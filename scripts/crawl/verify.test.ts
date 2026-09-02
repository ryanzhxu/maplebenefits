import { describe, expect, it } from "vitest";
import type { Figure } from "@/types/benefit";
import { verifyFigure, withinBand } from "../../scripts/crawl/verify";

const figure = (value: number, quote: string): Figure => ({
  current: { value, from: "2025-07-01", source: "https://www.gov.mb.ca/x.html", quote },
  history: [],
  verifiedAt: "2026-09-01",
  format: "currency",
  label: "Income cutoff",
});

const page = (body: string) => `<html><body><p>${body}</p></body></html>`;

describe("verifyFigure", () => {
  const f = figure(25864, "net family income of less than $25,864 per year");

  it("reports unchanged when the sentence is still on the page", () => {
    expect(verifyFigure(f, page("Families with a net family income of less than $25,864 per year qualify."))).toEqual({
      kind: "unchanged",
      quote: "net family income of less than $25,864 per year",
    });
  });

  it("sees through non-breaking spaces and markup", () => {
    const html = page("net family <b>income</b> of less than $25&nbsp;864 per year");
    expect(verifyFigure(f, html).kind).toBe("unchanged");
  });

  it("extracts the exact new value when only the number moved", () => {
    const v = verifyFigure(f, page("net family income of less than $27,100 per year"));
    expect(v).toMatchObject({ kind: "changed", oldValue: 25864, newValue: 27100, strength: "exact" });
  });

  it("still finds the value when surrounding wording drifted", () => {
    const v = verifyFigure(f, page("households with a total net family income of less than $27,100 each year"));
    expect(v).toMatchObject({ kind: "changed", newValue: 27100, strength: "leading" });
  });

  it("uses the narrowed tier when drift is beyond the context window", () => {
    // Wording changes only in the tail, more than 45 chars past the number, so
    // the narrowed window still matches and the leading tier is never reached.
    const wide = figure(
      25864,
      "a net family income of less than $25,864 in the benefit year, and applications are accepted online through the provincial portal",
    );
    const v = verifyFigure(
      wide,
      page(
        "a net family income of less than $27,100 in the benefit year, and applications are accepted online through the regional office",
      ),
    );
    expect(v).toMatchObject({ kind: "changed", newValue: 27100, strength: "narrowed" });
  });

  it("refuses to guess when the sentence is gone entirely", () => {
    expect(verifyFigure(f, page("This program has moved. See the new eligibility page.")).kind).toBe("quote-lost");
  });

  it("refuses to guess when the pattern matches two different numbers", () => {
    const html = page(
      "net family income of less than $27,100 per year. In Northern regions, net family income of less than $31,900 per year.",
    );
    expect(verifyFigure(f, html)).toMatchObject({ kind: "ambiguous" });
  });

  it("treats a cosmetically reworded sentence with the same number as unchanged", () => {
    const v = verifyFigure(f, page("a net family income of less than $25,864 per year applies"));
    expect(v.kind).toBe("unchanged");
  });
});

describe("withinBand", () => {
  it("passes an ordinary indexation bump", () => {
    expect(withinBand(8157, 8412, 0.25)).toBe(true);
  });

  it("stops an order-of-magnitude jump", () => {
    expect(withinBand(8157, 81570, 0.25)).toBe(false);
  });

  it("stops a sign flip", () => {
    expect(withinBand(500, -500, 0.25)).toBe(false);
  });
});
