import { describe, it, expect } from "vitest";
import { getBenefit } from "@/data/benefits";
import { evaluate } from "@/lib/engine";
import type { AssessmentContext } from "@/types/benefit";

describe("SAFER exact estimate", () => {
  it("single senior, low income and full sliding-scale (90%) benefit", () => {
    // monthlyIncome = 1250, well under the single Base Income (~$1,948) so the
    // formula applies the full 90% of the rent gap.
    // rentGap = min(900, 1150) - 0.3 * 1250 = 900 - 375 = 525
    // benefit = 525 * 0.9 = 472.5 -> 473
    const ctx: AssessmentContext = {
      province: "BC",
      age: 70,
      isHomeowner: false,
      monthlyRent: 900,
      annualIncome: 15000,
      maritalStatus: "single",
      receivesProvincialAssistance: false,
    };
    const r = evaluate(getBenefit("safer")!, ctx);
    expect(r.estimate?.period).toBe("month");
    expect(r.estimate?.low).toBeGreaterThanOrEqual(465);
    expect(r.estimate?.low).toBeLessThanOrEqual(480);
  });

  it("senior couple with higher income gets a reduced sliding-scale percentage", () => {
    // Couple Base Income ~$2,944; monthlyIncome = 3250 is above it, so the
    // percentage declines below 90% toward the $3,333.34 max-income floor of 35%.
    // rentGap = min(1200, 1150) - 0.3 * 3250 = 1150 - 975 = 175
    const ctx: AssessmentContext = {
      province: "BC",
      age: 68,
      isHomeowner: false,
      monthlyRent: 1200,
      annualIncome: 39000,
      familyIncome: 39000,
      maritalStatus: "married",
      receivesProvincialAssistance: false,
    };
    const r = evaluate(getBenefit("safer")!, ctx);
    expect(r.estimate?.low).toBeGreaterThan(0);
    // Full 90% would be 157.5; the reduced percentage must give less than that.
    expect(r.estimate?.low).toBeLessThan(158);
  });
});

describe("RAP exact estimate", () => {
  it("single parent, one child, moderate income", () => {
    // Core household size = 1 adult + 1 child = 2 -> $1,950 rent ceiling.
    // monthlyIncome = 2500, above the $1,800 Base Income.
    // rentGap = min(1400, 1950) - 0.3 * 2500 = 1400 - 750 = 650
    const ctx: AssessmentContext = {
      province: "BC",
      hasChildren: true,
      numberOfChildren: 1,
      isHomeowner: false,
      monthlyRent: 1400,
      familyIncome: 30000,
      employmentStatus: "employed",
      maritalStatus: "single",
    };
    const r = evaluate(getBenefit("rap")!, ctx);
    expect(r.estimate?.period).toBe("month");
    expect(r.estimate?.low).toBeGreaterThanOrEqual(490);
    expect(r.estimate?.low).toBeLessThanOrEqual(520);
  });

  it("couple with two children (household of 4) uses the higher rent ceiling", () => {
    // Core household size = 2 adults + 2 children = 4 -> $2,200 rent ceiling.
    // rentGap = min(2000, 2200) - 0.3 * 3750 = 2000 - 1125 = 875
    const ctx: AssessmentContext = {
      province: "BC",
      hasChildren: true,
      numberOfChildren: 2,
      isHomeowner: false,
      monthlyRent: 2000,
      familyIncome: 45000,
      employmentStatus: "employed",
      maritalStatus: "married",
    };
    const r = evaluate(getBenefit("rap")!, ctx);
    expect(r.estimate?.low).toBeGreaterThanOrEqual(480);
    expect(r.estimate?.low).toBeLessThanOrEqual(510);
  });

  it("missing rent/income falls back to a theoretical ceiling, not a fixed guess", () => {
    const ctx: AssessmentContext = {
      province: "BC",
      hasChildren: true,
      numberOfChildren: 1,
    };
    const r = evaluate(getBenefit("rap")!, ctx);
    expect(r.estimate?.low).toBe(0);
    expect(r.estimate?.high).toBeGreaterThan(0);
  });
});
