/**
 * Sourced figures — helpers for reading and validating "figures with receipts".
 *
 * A benefit declares each dollar amount or threshold ONCE, with the official
 * page it came from and the verbatim sentence stating it (see `Figure` in
 * src/types/benefit.ts). Rules and copy read it through `val` / `fmt` instead
 * of restating the literal, so the crawl automation can update a value by
 * patching one field.
 *
 * The validation here is the mechanical replacement for human review: it runs
 * in `npm test`, so a figure whose quote does not actually support its value
 * cannot reach the site, no matter what produced it.
 */

import type { Benefit, Figure, FigureSet } from "@/types/benefit";

/**
 * Official domains a figure may cite. Suffix-matched against the URL host, so
 * "www2.gov.bc.ca" matches "gov.bc.ca".
 *
 * Provincial crown corporations and agencies are included where they are the
 * authoritative publisher for a program (BC Housing runs SAFER and RAP;
 * StudentAid BC runs BC student grants). Aggregators, news, and blogs are not
 * on this list and never should be.
 */
export const OFFICIAL_DOMAINS: readonly string[] = [
  // Federal
  "canada.ca",
  "gc.ca",
  // Provinces
  "gov.bc.ca",
  "bchousing.org",
  "studentaidbc.ca",
  "workbc.ca",
  "ontario.ca",
  "alberta.ca",
  "gov.mb.ca",
  "saskatchewan.ca",
  "novascotia.ca",
  "gnb.ca",
  "princeedwardisland.ca",
  "gov.nl.ca",
  // Territories (no benefits yet; here so discovery is not blocked on a change)
  "yukon.ca",
  "gov.nt.ca",
  "gov.nu.ca",
];

export function isOfficialUrl(url: string): boolean {
  let host: string;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    host = u.hostname.toLowerCase();
  } catch {
    return false;
  }
  return OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

/**
 * Declare a benefit's sourced figures. Identity at runtime; it exists to give
 * the object a checked type at the declaration site.
 */
export function figures<T extends FigureSet>(defs: T): T {
  return defs;
}

/** Current numeric value. Use in `check` rules and amount estimators. */
export function val(f: Figure): number {
  return f.current.value;
}

/**
 * Render a figure for user-facing copy.
 *
 * Language-neutral by design — all four formats render identically in English,
 * Traditional Chinese, and Simplified Chinese, which is what the existing copy
 * already does ("$25,864" in all three). Units needing a word are supplied by
 * the surrounding sentence in its own language.
 */
export function fmt(f: Figure): string {
  const v = f.current.value;
  switch (f.format) {
    case "currency":
      return `$${Math.round(v).toLocaleString("en-CA")}`;
    case "currency-cents":
      return `$${v.toLocaleString("en-CA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    case "percent":
      return `${v}%`;
    case "number":
      return v.toLocaleString("en-CA");
  }
}

/** Remove digit-grouping commas so "1,673.24" and "1673.24" compare equal. */
function normalizeNumbers(text: string): string {
  return text.replace(/(?<=\d),(?=\d)/g, "");
}

/**
 * Does the figure's quote actually contain its value?
 *
 * This is the provenance invariant. The crawler may only change a value it can
 * find verbatim on the official page, and this proves the stored quote backs
 * the stored number. A fabricated quote fails here, in `npm test`, before it
 * can merge.
 */
export function quoteSupports(f: Figure): boolean {
  return observationSupported(f.current) && f.history.every(observationSupported);
}

/**
 * Regex source matching this number as written on a page.
 *
 * Two things it must get right:
 *
 * - trailing zeros. Pages write "$1,741.20" while the stored value is 1741.2,
 *   so a plain match on "1741.2" is blocked by the following "0". Every CPP,
 *   OAS, and GIS amount carries cents, so this is the common case, not an edge
 *   one.
 * - not matching a longer number. "5" must not match inside "45521", and 420
 *   must not match "$420.50" -- that is a different amount.
 */
export function numberPattern(value: number): string {
  const text = String(value);
  const escaped = text.replace(".", "\\.");
  // A decimal may carry extra trailing zeros; an integer may gain ".00".
  const tail = text.includes(".") ? "0*" : "(?:\\.0+)?";
  return `(?<![\\d.,])${escaped}${tail}(?![\\d])(?!\\.\\d)`;
}

function observationSupported(o: { value: number; quote: string }): boolean {
  return new RegExp(numberPattern(o.value)).test(normalizeNumbers(o.quote));
}

/** Today as YYYY-MM-DD, for comparing against ISO date strings. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface FigureProblem {
  benefitId: string;
  figureKey: string;
  problem: string;
}

/**
 * Validate every figure on a benefit. Returns the problems found; an empty
 * array means the benefit's figures are sound.
 */
export function validateFigures(benefit: Benefit): FigureProblem[] {
  const problems: FigureProblem[] = [];
  const add = (figureKey: string, problem: string) =>
    problems.push({ benefitId: benefit.id, figureKey, problem });

  for (const [key, f] of Object.entries(benefit.figures ?? {})) {
    if (!isOfficialUrl(f.current.source)) {
      add(key, `source is not an official https URL: ${f.current.source}`);
    }
    if (!quoteSupports(f)) {
      add(key, `quote does not contain the value ${f.current.value}: "${f.current.quote}"`);
    }
    if (f.current.to !== undefined) {
      add(key, "current observation must not have an end date");
    }
    // `from` may legitimately be in the FUTURE: governments announce next
    // year's figures ahead of time, and BC published its January 2027 home
    // owner grant amounts in 2026. Recording the real effective date matters
    // more than keeping it behind verifiedAt -- the effective date is what
    // makes the history a usable tax-year parameter table.
    //
    // What is genuinely impossible is verifying something that has not
    // happened yet.
    if (f.verifiedAt > todayIso()) {
      add(key, `verifiedAt ${f.verifiedAt} is in the future`);
    }
    if (f.band !== undefined && (f.band <= 0 || f.band > 1)) {
      add(key, `band must be in (0, 1], got ${f.band}`);
    }

    // History runs oldest first, each entry closed, and none overlapping the
    // current value. Ordering matters: it is the tax-year parameter table.
    let previousEnd = "";
    for (const h of f.history) {
      if (h.to === undefined) {
        add(key, `history entry from ${h.from} is missing an end date`);
        continue;
      }
      if (h.to < h.from) add(key, `history entry ${h.from}..${h.to} ends before it starts`);
      if (h.from < previousEnd) add(key, `history is out of order at ${h.from}`);
      if (h.to >= f.current.from) {
        add(key, `history entry ending ${h.to} overlaps the current value`);
      }
      previousEnd = h.to;
    }
  }
  return problems;
}
