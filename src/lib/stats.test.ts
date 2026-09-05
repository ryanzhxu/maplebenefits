import { describe, expect, it } from "vitest";
import {
  completionRate,
  emptyBlob,
  geoKey,
  isAssessPath,
  mergeEvent,
  parseBenefitId,
  topEntries,
} from "./stats";

describe("geoKey", () => {
  it("combines country and region", () => {
    expect(geoKey("CA", "BC")).toBe("CA·BC");
  });

  it("falls back to country only when region is missing", () => {
    expect(geoKey("CA", null)).toBe("CA");
    expect(geoKey("CA", undefined)).toBe("CA");
  });

  it("falls back to unknown when country is missing", () => {
    expect(geoKey(null, null)).toBe("unknown");
    expect(geoKey(undefined, "BC")).toBe("unknown");
  });
});

describe("parseBenefitId", () => {
  it("extracts the id from a benefit page path", () => {
    expect(parseBenefitId("/benefits/gis")).toBe("gis");
    expect(parseBenefitId("/benefits/gis/")).toBe("gis");
  });

  it("returns null for non-benefit paths", () => {
    expect(parseBenefitId("/")).toBeNull();
    expect(parseBenefitId("/benefits")).toBeNull();
    expect(parseBenefitId("/benefits/")).toBeNull();
    expect(parseBenefitId("/assess/")).toBeNull();
  });

  it("returns null for nested paths under a benefit id", () => {
    expect(parseBenefitId("/benefits/gis/extra")).toBeNull();
  });
});

describe("isAssessPath", () => {
  it("matches only the questionnaire page, not results", () => {
    expect(isAssessPath("/assess")).toBe(true);
    expect(isAssessPath("/assess/")).toBe(true);
    expect(isAssessPath("/assess/results")).toBe(false);
    expect(isAssessPath("/assess/results/")).toBe(false);
  });
});

describe("mergeEvent", () => {
  it("counts a pageview as a visit and buckets by geo", () => {
    const blob = mergeEvent(emptyBlob(), { type: "pageview", path: "/" }, "CA·BC");
    expect(blob.visits).toBe(1);
    expect(blob.geo).toEqual({ "CA·BC": 1 });
  });

  it("does not mutate the input blob", () => {
    const original = emptyBlob();
    mergeEvent(original, { type: "pageview", path: "/" }, "CA·BC");
    expect(original).toEqual(emptyBlob());
  });

  it("buckets a benefit page view under its benefit id", () => {
    const blob = mergeEvent(emptyBlob(), { type: "pageview", path: "/benefits/gis/" }, "CA");
    expect(blob.benefits).toEqual({ gis: 1 });
  });

  it("counts the assess page as started, not as a benefit view", () => {
    const blob = mergeEvent(emptyBlob(), { type: "pageview", path: "/assess/" }, "CA");
    expect(blob.assessStarted).toBe(1);
    expect(blob.benefits).toEqual({});
  });

  it("counts assess_completed without touching visits", () => {
    const blob = mergeEvent(emptyBlob(), { type: "assess_completed" }, "CA");
    expect(blob.assessCompleted).toBe(1);
    expect(blob.visits).toBe(0);
  });

  it("accumulates across repeated events", () => {
    let blob = emptyBlob();
    blob = mergeEvent(blob, { type: "pageview", path: "/benefits/gis/" }, "CA·BC");
    blob = mergeEvent(blob, { type: "pageview", path: "/benefits/gis/" }, "CA·ON");
    blob = mergeEvent(blob, { type: "pageview", path: "/benefits/ccb/" }, "CA·BC");
    expect(blob.visits).toBe(3);
    expect(blob.geo).toEqual({ "CA·BC": 2, "CA·ON": 1 });
    expect(blob.benefits).toEqual({ gis: 2, ccb: 1 });
  });

  it("caps distinct geo keys by dropping the least-frequent ones", () => {
    let blob = emptyBlob();
    for (let i = 0; i < 301; i++) {
      blob = mergeEvent(blob, { type: "pageview", path: "/" }, `region-${i}`);
    }
    // The first region only ever saw 1 hit, same as many others; capping
    // trims down to the 300-key limit without touching the total visit count.
    expect(Object.keys(blob.geo).length).toBe(300);
    expect(blob.visits).toBe(301);
  });
});

describe("completionRate", () => {
  it("is 0 when nobody has started", () => {
    expect(completionRate(emptyBlob())).toBe(0);
  });

  it("computes a rounded percentage", () => {
    const blob = { ...emptyBlob(), assessStarted: 3, assessCompleted: 1 };
    expect(completionRate(blob)).toBe(33);
  });

  it("can reach 100%", () => {
    const blob = { ...emptyBlob(), assessStarted: 4, assessCompleted: 4 };
    expect(completionRate(blob)).toBe(100);
  });
});

describe("topEntries", () => {
  it("sorts descending and limits to n", () => {
    const record = { a: 1, b: 5, c: 3, d: 4 };
    expect(topEntries(record, 2)).toEqual([
      ["b", 5],
      ["d", 4],
    ]);
  });

  it("returns everything when n exceeds the record size", () => {
    expect(topEntries({ a: 1 }, 10)).toEqual([["a", 1]]);
  });
});
