/**
 * Provenance audit: does each benefit's own cited source actually state the
 * figures the app shows?
 *
 * This is deterministic and read-only. It answers one question per number:
 * "the app says $X and points at this page -- is $X on that page?" A number
 * the source does not state is not automatically wrong, but it is exactly how
 * the Manitoba Child Benefit bug looked (the app applied a six-child income
 * ceiling to every family, citing a page that never states it).
 *
 * The output is the ranked worklist for migration: benefits whose figures are
 * all confirmed are cheap and safe to migrate; benefits with unconfirmed
 * figures need a human decision about which source is right.
 */

import fs from "node:fs";
import path from "node:path";
import type { Benefit } from "../../src/types/benefit";
import { isOfficialUrl } from "../../src/lib/figures";
import { fetchOfficial, FetchError } from "./fetch";
import { comparable, htmlToText } from "./extract";
import { REPO_ROOT } from "./config";

export interface AuditedFigure {
  /** The number as written in the benefit's source code. */
  value: number;
  /** Where it appears: a user-facing string, or a bare literal in the rules. */
  where: "copy" | "code";
  found: boolean;
  /** The page that confirmed it, when one did. */
  confirmedBy?: string;
  /**
   * For an unconfirmed figure: the closest number the page DOES state, when
   * one is near enough to look like the same figure after an update.
   *
   * Government amounts are indexed, so a stale figure usually sits a few
   * percent from its replacement. "App says 1673, page says 1741.20" is a
   * strong drift signal; it is a lead to verify, not a value to apply.
   */
  drift?: { pageValue: number; relative: number; sentence: string; url: string };
}

export interface BenefitAudit {
  benefitId: string;
  level: string;
  urls: string[];
  fetchErrors: string[];
  figures: AuditedFigure[];
  confirmed: number;
  unconfirmed: number;
  /**
   * True when the benefit shows dollar amounts but not one of its cited pages
   * states any amount at all.
   *
   * This is worse than a wrong figure, because nothing can ever confirm or
   * correct it. The Canada Child Benefit cited its overview page, which
   * mentions no money -- every amount lives on "How much you can get" -- so a
   * $1,625 error in its phase-out threshold sat unnoticed and unnoticeable.
   */
  citesPageWithoutAmounts: boolean;
}

/**
 * Source text of each benefit, keyed by id.
 *
 * A benefit's numbers live in its `check` closure and its copy, neither of
 * which can be read off the runtime object, so the audit reads the file. A
 * block runs from one `export const` to the next, which also captures the
 * helper constants declared just above a benefit -- where estimator figures
 * usually live.
 */
export function benefitSourceBlocks(): Map<string, string> {
  const dir = path.join(REPO_ROOT, "src/data/benefits");
  const blocks = new Map<string, string>();

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts") || file === "index.ts") continue;
    const text = fs.readFileSync(path.join(dir, file), "utf-8");
    const parts = text.split(/^(?=export const )/m);

    let carried = parts[0] ?? "";
    for (const part of parts.slice(1)) {
      const id = /\bid:\s*"([^"]+)"/.exec(part)?.[1];
      if (!id) {
        // A helper const with no benefit id belongs to whatever follows it.
        carried += part;
        continue;
      }
      // A part runs to the NEXT `export const`, so it also swallows any
      // non-exported helpers declared after this benefit -- which belong to the
      // next one. Cut at the line closing the benefit object and carry the rest
      // forward, or Rent Assist's income tiers get audited as the Child
      // Benefit's.
      const end = part.indexOf("\n};\n");
      if (end === -1) {
        blocks.set(id, carried + part);
        carried = "";
      } else {
        blocks.set(id, carried + part.slice(0, end + 4));
        carried = part.slice(end + 4);
      }
    }
  }
  return blocks;
}

/**
 * Remove `figures({ ... })` declarations before auditing.
 *
 * Anchored figures are already checked, every run, by the freshness lane
 * against the exact page that states them. Auditing them again here adds
 * nothing and actively misleads: a figure block declared at the top of a file
 * is attributed to the first benefit in that file, so ODSP's $1,436 surfaced
 * as a drift candidate for the Ontario Trillium Benefit.
 *
 * The audit's job is the UNanchored remainder.
 */
export function stripFigureBlocks(source: string): string {
  let out = "";
  let i = 0;
  for (;;) {
    const start = source.indexOf("figures({", i);
    if (start === -1) return out + source.slice(i);
    out += source.slice(i, start);

    // Walk braces from the "{" of "figures({" to its match.
    let depth = 0;
    let j = source.indexOf("{", start);
    for (; j < source.length; j++) {
      if (source[j] === "{") depth++;
      else if (source[j] === "}" && --depth === 0) break;
    }
    if (j >= source.length) return out; // unbalanced; drop the rest
    i = j + 1;
  }
}

/** Drop line and block comments so prose about a figure is not audited as one. */
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/**
 * Numbers worth checking against a source page.
 *
 * Dollar amounts written in copy are taken as-is. Bare literals are only
 * considered at 500 or above, which skips ages, counts, percentages, and array
 * indices while keeping thresholds and payment amounts.
 */
export function extractFigures(source: string): { value: number; where: "copy" | "code" }[] {
  const found = new Map<number, "copy" | "code">();
  // Comments explain a figure; they are not shown to anyone. Auditing them
  // flags every number a maintainer mentioned in passing.
  const code = stripFigureBlocks(stripComments(source));

  for (const m of code.matchAll(/\$\s?([\d,]+(?:\.\d{1,2})?)/g)) {
    const value = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(value) && value > 0) found.set(value, "copy");
  }
  // Remove the amounts already captured before scanning for bare literals, or
  // the grouping comma in "$25,864" leaves "864" looking like its own figure.
  const withoutCopy = code.replace(/\$\s?[\d,]+(?:\.\d{1,2})?/g, " ");
  for (const m of withoutCopy.matchAll(/(?<![\w.$,])(\d{3,7}(?:\.\d{1,2})?)(?![\w.])/g)) {
    const value = Number(m[1]);
    if (!Number.isFinite(value) || value < 500) continue;
    if (!found.has(value)) found.set(value, "code");
  }

  // Years read as thresholds otherwise, and every file is full of them.
  for (const year of [2023, 2024, 2025, 2026, 2027]) found.delete(year);

  return [...found].map(([value, where]) => ({ value, where }));
}

/** Official URLs a benefit points at, deduped and allowlist-filtered. */
export function benefitUrls(b: Benefit): string[] {
  const urls = [
    b.officialInfoUrl,
    b.applicationUrl,
    ...b.applicationSteps.map((s) => s.actionUrl),
    ...Object.values(b.figures ?? {}).map((f) => f.current.source),
  ];
  return [...new Set(urls.filter((u): u is string => !!u && isOfficialUrl(u)))];
}

/**
 * Every distinct CURRENCY amount the page states, with the sentence around it.
 *
 * Requiring a leading "$" is what makes drift detection usable. Without it the
 * nearest number to a benefit amount is very often a toll-free phone number or
 * a "Date modified" year -- pairing $1,196 with 1-800-387-1193 produced a
 * 0.2% "match" that meant nothing.
 */
function pageNumbers(text: string): { value: number; sentence: string }[] {
  const out = new Map<number, string>();
  for (const m of text.matchAll(/\$\s?(\d{2,7}(?:\.\d{1,2})?)(?![\d])/g)) {
    const value = Number(m[1]);
    if (!Number.isFinite(value) || value < 100) continue;
    if (out.has(value)) continue;
    const at = m.index ?? 0;
    out.set(value, text.slice(Math.max(0, at - 70), at + 70).trim());
  }
  return [...out].map(([value, sentence]) => ({ value, sentence }));
}

/**
 * The page number closest to an app figure, if it is within `maxRelative`.
 *
 * Deliberately narrow. A 30% window catches indexation and rate changes while
 * refusing to pair unrelated amounts that merely share a page.
 */
function closestPageNumber(
  value: number,
  pages: { url: string; numbers: { value: number; sentence: string }[] }[],
  maxRelative = 0.3,
): AuditedFigure["drift"] {
  let best: AuditedFigure["drift"];
  for (const page of pages) {
    for (const n of page.numbers) {
      const relative = Math.abs(n.value - value) / Math.abs(value || 1);
      if (relative > maxRelative || relative === 0) continue;
      if (!best || relative < best.relative) {
        best = { pageValue: n.value, relative, sentence: n.sentence, url: page.url };
      }
    }
  }
  return best;
}

/** Is this number stated anywhere in the page text? */
function statedIn(value: number, text: string): boolean {
  const re = new RegExp(`(?<![\\d.,])${String(value).replace(".", "\\.")}(?![\\d])`);
  return re.test(text);
}

export async function auditBenefit(b: Benefit, source: string): Promise<BenefitAudit> {
  const urls = benefitUrls(b);
  const fetchErrors: string[] = [];
  const pages: { url: string; text: string }[] = [];

  for (const url of urls) {
    try {
      const res = await fetchOfficial(url);
      pages.push({ url, text: comparable(htmlToText(res.html)) });
    } catch (err) {
      fetchErrors.push(
        err instanceof FetchError ? `${url} (${err.reason})` : `${url} (${String(err)})`,
      );
    }
  }

  const numbered = pages.map((p) => ({ url: p.url, numbers: pageNumbers(p.text) }));
  const figures: AuditedFigure[] = extractFigures(source).map(({ value, where }) => {
    const hit = pages.find((p) => statedIn(value, p.text));
    if (hit) return { value, where, found: true, confirmedBy: hit.url };
    return { value, where, found: false, drift: closestPageNumber(value, numbered) };
  });

  const pagesStateAnyAmount = numbered.some((p) => p.numbers.length > 0);
  return {
    benefitId: b.id,
    level: b.level,
    urls,
    fetchErrors,
    figures,
    confirmed: figures.filter((f) => f.found).length,
    unconfirmed: figures.filter((f) => !f.found).length,
    citesPageWithoutAmounts:
      figures.length > 0 && pages.length > 0 && !pagesStateAnyAmount,
  };
}
