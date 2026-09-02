/**
 * Show what the crawler sees on a page. Debugging tool, not part of a run.
 *
 * When the loop escalates a figure as "quote-lost", this is how you find out
 * why: it prints the extracted text, whether a given phrase survives
 * extraction, and every dollar figure the page states.
 *
 *   npx tsx scripts/crawl/probe.ts <url> ["phrase to look for"]
 */

import { fetchOfficial } from "./fetch";
import { comparable, htmlToText } from "./extract";

async function main(): Promise<void> {
  const [url, needle] = process.argv.slice(2);
  if (!url) {
    console.error('usage: npx tsx scripts/crawl/probe.ts <url> ["phrase"]');
    process.exit(2);
  }
  const res = await fetchOfficial(url);
  const text = comparable(htmlToText(res.html));
  console.log(`status=${res.status} cached=${res.fromCache} html=${res.html.length}b text=${text.length}b`);

  if (needle) {
    const i = text.indexOf(comparable(needle));
    console.log(`phrase: ${i === -1 ? "NOT FOUND after extraction" : `found at ${i}`}`);
    if (i !== -1) console.log("  context:", text.slice(Math.max(0, i - 110), i + 130));
  }

  const money = [...new Set([...text.matchAll(/\$\s?\d[\d.]*/g)].map((m) => m[0]))];
  console.log(`dollar figures (${money.length}):`, money.slice(0, 30).join("  "));
}

main().catch((err) => {
  console.error("FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
