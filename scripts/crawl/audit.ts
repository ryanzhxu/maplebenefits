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
}

export interface BenefitAudit {
  benefitId: string;
  level: string;
  urls: string[];
  fetchErrors: string[];
  figures: AuditedFigure[];
  confirmed: number;
  unconfirmed: number;
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
  const code = stripComments(source);

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

  const figures: AuditedFigure[] = extractFigures(source).map(({ value, where }) => {
    const hit = pages.find((p) => statedIn(value, p.text));
    return { value, where, found: !!hit, confirmedBy: hit?.url };
  });

  return {
    benefitId: b.id,
    level: b.level,
    urls,
    fetchErrors,
    figures,
    confirmed: figures.filter((f) => f.found).length,
    unconfirmed: figures.filter((f) => !f.found).length,
  };
}
