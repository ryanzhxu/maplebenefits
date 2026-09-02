/**
 * Deterministic figure verification. No model involved.
 *
 * A stored figure carries the verbatim sentence that stated its value. To
 * re-check it we look for that sentence on the live page:
 *
 *   found verbatim            -> unchanged (the quote contains the value, so an
 *                                exact hit proves the value still stands)
 *   found with a different
 *   number in the same slot   -> changed, and we know the new value exactly
 *   not found at all          -> the page was restructured; escalate, never guess
 *
 * The middle case is the whole point: it turns "a number moved" into a
 * one-field patch backed by evidence, with nothing to hallucinate.
 */

import type { Figure } from "../../src/types/benefit";
import { comparable, htmlToText } from "./extract";
import { numberPattern } from "../../src/lib/figures";

export type Verdict =
  | { kind: "unchanged"; quote: string }
  | {
      kind: "changed";
      oldValue: number;
      newValue: number;
      newQuote: string;
      /** How much of the stored sentence still matched. See MATCH_TIERS. */
      strength: MatchStrength;
    }
  | { kind: "ambiguous"; candidates: number[] }
  | { kind: "quote-lost" };

/** Escape a string for literal use inside a RegExp. */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Locate a value inside text, tolerating the trailing zeros pages write
 * ("1741.20" for 1741.2). Returns the matched span so callers can split around
 * the number exactly as the page wrote it.
 */
function locateValue(text: string, value: number): { start: number; length: number } | undefined {
  const m = new RegExp(numberPattern(value)).exec(text);
  return m ? { start: m.index, length: m[0].length } : undefined;
}

export type MatchStrength = "exact" | "narrowed" | "leading";

/**
 * Progressively looser ways to re-find a figure on a changed page. Each tier is
 * tried in order and the first that yields a single candidate wins.
 *
 * - exact:    the whole stored sentence, number replaced by a wildcard
 * - narrowed: a window either side, surviving drift elsewhere in the sentence
 * - leading:  only the phrase BEFORE the number ("...income of less than $"),
 *             which survives drift after it ("per year" -> "each year")
 *
 * `leading` is safe despite being loosest: a phrase that recurs on the page
 * produces two distinct candidates, which reports ambiguous rather than
 * guessing.
 */
const MATCH_TIERS: { strength: MatchStrength; before?: number; after?: number }[] = [
  { strength: "exact" },
  { strength: "narrowed", before: 45, after: 45 },
  { strength: "leading", before: 40, after: 0 },
];

/**
 * Turn a quote into a pattern matching the same sentence with a different
 * number, trimmed to the given amount of context on each side.
 */
function skeleton(
  quote: string,
  value: number,
  tier: { before?: number; after?: number },
): RegExp | undefined {
  const q = comparable(quote);
  const at = locateValue(q, value);
  if (!at) return undefined;

  let before = q.slice(0, at.start);
  let after = q.slice(at.start + at.length);
  if (tier.before !== undefined) before = before.slice(-tier.before);
  if (tier.after !== undefined) after = after.slice(0, tier.after);

  // Demand real context, or the pattern degenerates into "any number".
  if (before.trim().length < 12) return undefined;
  return new RegExp(`${esc(before)}(\\d+(?:\\.\\d+)?)${esc(after)}`, "g");
}

function matchValues(pattern: RegExp, text: string): { value: number; quote: string }[] {
  const out: { value: number; quote: string }[] = [];
  for (const m of text.matchAll(pattern)) {
    const parsed = Number(m[1]);
    if (Number.isFinite(parsed)) out.push({ value: parsed, quote: m[0] });
  }
  return out;
}

/** Check one stored figure against the live HTML of its source page. */
export function verifyFigure(figure: Figure, html: string): Verdict {
  const text = comparable(htmlToText(html));
  const storedQuote = comparable(figure.current.quote);

  if (text.includes(storedQuote)) {
    return { kind: "unchanged", quote: figure.current.quote };
  }

  for (const tier of MATCH_TIERS) {
    const pattern = skeleton(figure.current.quote, figure.current.value, tier);
    if (!pattern) continue;

    const hits = matchValues(pattern, text);
    const distinct = [...new Set(hits.map((h) => h.value))];
    if (distinct.length === 0) continue;
    if (distinct.length > 1) return { kind: "ambiguous", candidates: distinct };

    const found = hits[0];
    if (found.value === figure.current.value) {
      // Same number, cosmetically different sentence. Still verified.
      return { kind: "unchanged", quote: found.quote };
    }
    return {
      kind: "changed",
      oldValue: figure.current.value,
      newValue: found.value,
      newQuote: found.quote,
      strength: tier.strength,
    };
  }
  return { kind: "quote-lost" };
}

/**
 * Is a proposed change small enough to merge without review?
 *
 * A figure moving beyond its band is not necessarily wrong, but it is exactly
 * the shape of a misread page, so it stops and emails instead of shipping.
 */
export function withinBand(oldValue: number, newValue: number, band: number): boolean {
  if (oldValue === 0) return newValue === 0;
  return Math.abs(newValue - oldValue) / Math.abs(oldValue) <= band;
}
