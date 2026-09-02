/**
 * HTML -> comparable plain text.
 *
 * The crawler matches stored `quote` strings against live pages, so extraction
 * must be stable across cosmetic markup changes and must normalize the ways a
 * government page can write the same number. Government pages routinely use
 * non-breaking spaces inside and around figures.
 */

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&ndash;": "–",
  "&mdash;": "—",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

/** Strip markup and collapse a page to a single normalized text line-set. */
export function htmlToText(html: string): string {
  const stripped = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Keep block boundaries so unrelated sentences do not fuse together.
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|td|th|br)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return normalizeText(decodeEntities(stripped));
}

/**
 * Normalize text for quote matching.
 *
 * - non-breaking and thin spaces become ordinary spaces (canada.ca writes
 *   "$1 673" and "10 138" with U+00A0)
 * - curly quotes and dashes are folded to ASCII
 * - runs of whitespace collapse to one space, per line
 */
export function normalizeText(s: string): string {
  return s
    .replace(/[      ]/g, " ")
    .replace(/[‘’′]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Collapse digit grouping so "1,673.24", "1 673.24" and "1673.24" all compare
 * equal. Only separators BETWEEN digits are removed, so "$1,000, and $50"
 * does not fuse into one number.
 */
export function normalizeNumbers(s: string): string {
  return s.replace(/(?<=\d)[,\s](?=\d{3}\b)/g, "");
}

/** Text prepared for quote matching: markup-free, space- and digit-normalized. */
export function comparable(s: string): string {
  return normalizeNumbers(normalizeText(s)).replace(/\n/g, " ");
}
