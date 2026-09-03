/**
 * Discovery lane: find programs the app does not cover yet, and rank them.
 *
 * Deliberately NOT a general web crawl. It reads a small, hand-picked set of
 * official index pages — the pages each government publishes to list its own
 * programs — and diffs them against the registry. That keeps the candidate set
 * on-allowlist by construction, and keeps the crawl small enough to stay
 * polite.
 *
 * Ranking is by reach: roughly how many people can claim it, times what it is
 * worth. The point is not to add everything, it is to work down the list until
 * the marginal program stops being worth its permanent upkeep.
 */

import type { Benefit, BenefitLevel } from "../../src/types/benefit";
import { fetchOfficial, FetchError } from "./fetch";
import { comparable, htmlToText } from "./extract";

/**
 * Official pages that list programs. One per jurisdiction to start; more can
 * be added as they are found.
 *
 * Quebec is absent on purpose — it needs a French locale, which is out of
 * scope. See the design spec.
 */
export const PROGRAM_INDEXES: Partial<Record<BenefitLevel, string[]>> = {
  "provincial-on": [
    "https://www.ontario.ca/page/tax-credits-and-benefits-people",
    "https://www.ontario.ca/page/find-benefits-and-programs",
  ],
  "provincial-ab": ["https://www.alberta.ca/financial-support"],
  "provincial-bc": [
    "https://www2.gov.bc.ca/gov/content/family-social-supports/income-assistance",
  ],
};

/** Population by jurisdiction, in millions. Used only to weight reach. */
const POPULATION_M: Record<string, number> = {
  federal: 41.5,
  "provincial-on": 16.0,
  "provincial-bc": 5.7,
  "provincial-ab": 5.0,
  "provincial-mb": 1.5,
  "provincial-sk": 1.25,
  "provincial-ns": 1.08,
  "provincial-nb": 0.85,
  "provincial-nl": 0.54,
  "provincial-pe": 0.18,
};

/**
 * Labels that are navigation, not programs. Index pages are mostly chrome, so
 * without this the queue fills with "Business and economy".
 */
const NOT_A_PROGRAM =
  /^(benefits and taxes|business|courts|driving|education|environment|family and social services|government|health and wellness|heritage|home and housing|immigration|jobs and employment|land use|recreation|rural|more accounts|contact|about|home|français|search|menu|skip)/i;

export interface Candidate {
  level: BenefitLevel;
  label: string;
  url: string;
  /** Largest annual-looking dollar figure found on the program's own page. */
  topAmount?: number;
  /** population (millions) x value. Higher means work on it sooner. */
  reachScore?: number;
  /** Why it was dropped, when it was. */
  rejected?: string;
}

/**
 * Shortest registry name allowed to match a candidate as a substring.
 *
 * Below this, names are too generic and swallow unrelated programs. Exact
 * matches still apply at any length.
 */
const MIN_SUBSTRING_MATCH = 14;

/** Normalise a name for comparison against the registry. */
const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

/** Pull program links out of one index page. */
export function extractCandidates(html: string, level: BenefitLevel, origin: string): Candidate[] {
  const out = new Map<string, Candidate>();
  for (const m of html.matchAll(/<a[^>]+href="([^"#?]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (label.length < 6 || label.length > 90) continue;
    if (NOT_A_PROGRAM.test(label)) continue;

    let url: string;
    try {
      url = new URL(m[1], origin).toString();
    } catch {
      continue;
    }
    if (!out.has(url)) out.set(url, { level, label, url });
  }
  return [...out.values()];
}

/** Drop candidates the registry already covers, by URL or by name. */
export function dropKnown(candidates: Candidate[], benefits: Benefit[]): Candidate[] {
  const knownUrls = new Set<string>();
  /** Exact-match keys: full names AND short names. */
  const exact = new Set<string>();
  /** Substring-match keys: full names only, and only if distinctive enough. */
  const distinctive: string[] = [];

  for (const b of benefits) {
    for (const u of [b.officialInfoUrl, b.applicationUrl]) if (u) knownUrls.add(u);
    for (const s of b.applicationSteps) if (s.actionUrl) knownUrls.add(s.actionUrl);
    const full = norm(typeof b.name === "string" ? b.name : b.name.en);
    if (full) {
      exact.add(full);
      if (full.length >= MIN_SUBSTRING_MATCH) distinctive.push(full);
    }
    const short = norm(b.shortName);
    if (short) exact.add(short);
  }

  return candidates.filter((c) => {
    if (knownUrls.has(c.url)) return false;
    const n = norm(c.label);
    if (exact.has(n)) return false;
    // Substring matching catches "ODSP : Ontario Disability Support Program"
    // against the registry's "Ontario Disability Support Program". It must use
    // full names only: matching on short names dropped eight real Ontario
    // programs, because the registry's "Trillium" swallowed "Trillium Drug
    // Program", a different benefit the app does not have.
    return !distinctive.some((known) => n.includes(known) || known.includes(n));
  });
}

const AMOUNT_RE = /\$\s?(\d[\d,]*(?:\.\d{1,2})?)/g;
const plausible = (v: number) => Number.isFinite(v) && v >= 50 && v <= 100_000;

/**
 * What a program is worth, as stated on its own page.
 *
 * Takes the largest amount introduced by "up to", "maximum" or "receive",
 * falling back to the largest amount on the page.
 *
 * The fallback alone is badly wrong: government pages state INCOME THRESHOLDS
 * far larger than the benefit itself, so plain max-on-page scored Ontario's
 * Low-Income Workers Tax Credit at $82,500 — its income ceiling — when the
 * credit is worth a few hundred dollars. Benefit maximums are almost always
 * phrased "up to $X", so that phrasing is preferred when present.
 */
export function topAmountOn(text: string): number | undefined {
  const stated: number[] = [];
  for (const m of text.matchAll(
    /(?:up to|maximum of|maximum|receive up to|as much as)\s*(?:an?\s+)?\$\s?(\d[\d,]*(?:\.\d{1,2})?)/gi,
  )) {
    const v = Number(m[1].replace(/,/g, ""));
    if (plausible(v)) stated.push(v);
  }
  if (stated.length) return Math.max(...stated);

  const any = [...text.matchAll(AMOUNT_RE)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter(plausible);
  return any.length ? Math.max(...any) : undefined;
}

/**
 * Score a candidate by fetching its page.
 *
 * A program page stating no amount at all scores nothing — not because it is
 * worthless, but because it cannot be represented honestly yet. That is the
 * same rule the audit applies to benefits already in the app.
 */
export async function scoreCandidate(c: Candidate): Promise<Candidate> {
  try {
    const res = await fetchOfficial(c.url);
    const text = comparable(htmlToText(res.html));
    const topAmount = topAmountOn(text);
    if (topAmount === undefined) {
      return { ...c, rejected: "page states no dollar amount" };
    }
    const pop = POPULATION_M[c.level] ?? 1;
    return { ...c, topAmount, reachScore: Math.round(pop * topAmount) };
  } catch (err) {
    return {
      ...c,
      rejected: err instanceof FetchError ? `fetch failed (${err.reason})` : "fetch failed",
    };
  }
}

/** Sweep one jurisdiction's index pages and return ranked candidates. */
export async function sweep(level: BenefitLevel, benefits: Benefit[]): Promise<Candidate[]> {
  const found: Candidate[] = [];
  for (const indexUrl of PROGRAM_INDEXES[level] ?? []) {
    try {
      const res = await fetchOfficial(indexUrl);
      found.push(...extractCandidates(res.html, level, new URL(indexUrl).origin));
    } catch {
      // An index that will not load is worth noticing but not worth failing on.
    }
  }
  const unknown = dropKnown(found, benefits);
  const scored: Candidate[] = [];
  for (const c of unknown) scored.push(await scoreCandidate(c));
  return scored.sort((a, b) => (b.reachScore ?? -1) - (a.reachScore ?? -1));
}
