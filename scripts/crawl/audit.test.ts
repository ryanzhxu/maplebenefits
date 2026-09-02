import { describe, expect, it } from "vitest";
import { extractFigures, stripComments, stripFigureBlocks, stripUrls } from "../../scripts/crawl/audit";

const values = (src: string) => extractFigures(src).map((f) => f.value).sort((a, b) => a - b);

describe("stripComments", () => {
  it("removes line and block comments", () => {
    expect(stripComments("const a = 1; // note about $24,000\nconst b = 2;")).not.toContain("24,000");
    expect(stripComments("/* the cutoff was $9,999 */ const a = 1;")).not.toContain("9,999");
  });

  it("leaves URLs intact — the // in https:// is not a comment", () => {
    const src = 'source: "https://www.gov.mb.ca/fs/eia/mcb.html",';
    expect(stripComments(src)).toContain("https://www.gov.mb.ca/fs/eia/mcb.html");
  });
});

describe("extractFigures", () => {
  it("finds dollar amounts written in copy", () => {
    expect(values('estimatedValue: "Up to $420/year", cutoff: "$25,864"')).toEqual([420, 25864]);
  });

  it("finds bare threshold literals in rules", () => {
    expect(values("atMost((c) => c.familyIncome, 25864)")).toEqual([25864]);
  });

  it("does not mistake a grouping comma for a separate figure", () => {
    // "$25,864" must not also yield 864.
    expect(values('failReason: "under $25,864 per year"')).toEqual([25864]);
    expect(values('rows: ["$1,680", "$2,520"]')).toEqual([1680, 2520]);
  });

  it("ignores numbers that only appear in comments", () => {
    const src = `
      // This app previously used $25,864 for every family, which was wrong.
      atMost((c) => c.familyIncome, 20435)
    `;
    expect(values(src)).toEqual([20435]);
  });

  it("skips ages, small counts, and years", () => {
    const src = "age: 65, children: 3, from: 2026, threshold: 15000";
    expect(values(src)).toEqual([15000]);
  });

  it("keeps decimal amounts", () => {
    expect(values('max: "$1,673.24 per month"')).toEqual([1673.24]);
  });
});

describe("stripFigureBlocks", () => {
  it("removes an anchored figure declaration, keeping the rest", () => {
    const src = `
      const A = figures({ x: { current: { value: 1436, quote: "up to $1,436" } } });
      estimatedValue: "unanchored $999 here"
    `;
    const out = stripFigureBlocks(src);
    expect(out).not.toContain("1436");
    expect(out).toContain("999");
  });

  it("handles nested braces without eating the following code", () => {
    const src = 'const A = figures({ a: { b: { c: 1 } } }); const after = "$777";';
    expect(stripFigureBlocks(src)).toContain("777");
  });

  it("keeps anchored values out of the audit entirely", () => {
    // Anchored figures are the freshness lane's job, not the audit's.
    const src = 'const A = figures({ x: { current: { value: 1436 } } }); const y = 22488;';
    expect(extractFigures(src).map((f) => f.value)).toEqual([22488]);
  });
});

describe("stripUrls", () => {
  it("keeps a tax line number in a URL out of the audit", () => {
    // .../line-45300-canada-workers-benefit-cwb.html is a line number, not $45,300.
    const src = 'officialInfoUrl: "https://www.canada.ca/x/line-45300-cwb.html", max: 1633';
    expect(extractFigures(src).map((f) => f.value)).toEqual([1633]);
  });
});
