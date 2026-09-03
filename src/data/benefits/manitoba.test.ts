import { describe, it, expect } from "vitest";
import { manitobaRentAssist } from "@/data/benefits/manitoba";

// Manitoba Rent Assist (non-EIA) exact formula tests.
// Formula source: https://www.gov.mb.ca/fs/eia/non_rentassist_facts.html and
// https://www.gov.mb.ca/fs/eia/estimator.html (fetched 2026-09-01):
// benefit = 80% of Median Market Rent - 30% of net household income, capped
// at the max benefit and floored at $0. Max benefit per tier is derived from
// the official 2025-26 annual income cutoffs (where benefit hits $0):
//   single, under 55, no DTC:        cutoff $29,120 -> max $728/month
//   single, 55+ or claims DTC/CPPD:  cutoff $33,920 -> max $848/month
//   2 people:                        cutoff $38,720 -> max $968/month
//   3-4 people:                      cutoff $50,240 -> max $1,256/month
//   5+ people:                       cutoff $60,768 -> max $1,519/month
describe("Manitoba Rent Assist estimateAmount", () => {
  it("gives the max benefit for a single person with $0 income", () => {
    const est = manitobaRentAssist.estimateAmount!({
      maritalStatus: "single",
      annualIncome: 0,
    });
    expect(est).toMatchObject({ low: 728, high: 728, period: "month" });
  });

  it("gives the higher 55+/DTC max benefit for a single senior with $0 income", () => {
    const est = manitobaRentAssist.estimateAmount!({
      maritalStatus: "single",
      age: 60,
      annualIncome: 0,
    });
    expect(est).toMatchObject({ low: 848, high: 848, period: "month" });
  });

  it("gives the higher 55+/DTC max benefit for a single person with DTC and $0 income", () => {
    const est = manitobaRentAssist.estimateAmount!({
      maritalStatus: "single",
      hasDTC: true,
      annualIncome: 0,
    });
    expect(est).toMatchObject({ low: 848, high: 848, period: "month" });
  });

  it("reduces the benefit by 30% of monthly income", () => {
    // Half of the $29,120 single cutoff: 728 - 0.3*14560/12 = 728 - 364 = 364
    const est = manitobaRentAssist.estimateAmount!({
      maritalStatus: "single",
      annualIncome: 14560,
    });
    expect(est).toMatchObject({ low: 364, high: 364, period: "month" });
  });

  it("floors the benefit at $0 above the income cutoff", () => {
    const est = manitobaRentAssist.estimateAmount!({
      maritalStatus: "single",
      annualIncome: 40000,
    });
    expect(est).toMatchObject({ low: 0, high: 0, period: "month" });
  });

  it("uses the 2-person tier for a couple with $0 income", () => {
    const est = manitobaRentAssist.estimateAmount!({
      maritalStatus: "married",
      familyIncome: 0,
    });
    expect(est).toMatchObject({ low: 968, high: 968, period: "month" });
  });

  it("uses the 3-4 person tier for a couple with 2 children", () => {
    const est = manitobaRentAssist.estimateAmount!({
      maritalStatus: "common-law",
      numberOfChildren: 2,
      familyIncome: 0,
    });
    expect(est).toMatchObject({ low: 1256, high: 1256, period: "month" });
  });

  it("uses the 5+ person tier for a couple with 3 children", () => {
    const est = manitobaRentAssist.estimateAmount!({
      maritalStatus: "married",
      numberOfChildren: 3,
      familyIncome: 0,
    });
    expect(est).toMatchObject({ low: 1519, high: 1519, period: "month" });
  });

  it("returns only the max benefit as a range when income is unknown", () => {
    const est = manitobaRentAssist.estimateAmount!({ maritalStatus: "single" });
    expect(est).toMatchObject({ low: 0, high: 728, period: "month" });
  });

  it("falls back to annualIncome for a couple with missing familyIncome", () => {
    const est = manitobaRentAssist.estimateAmount!({
      maritalStatus: "married",
      annualIncome: 0,
    });
    expect(est).toMatchObject({ low: 968, high: 968, period: "month" });
  });
});

// The hard eligibility gate used to hard-code a flat $40,000 cutoff for
// every household, while the real, published cutoffs (used correctly above
// in estimateAmount) range from $29,120 (single, under 55) to $60,768 (5+
// people with children). These two cases were wrong under the flat number.
describe("Manitoba Rent Assist eligibility check", () => {
  const renter = {
    province: "MB",
    isHomeowner: false,
    filedTaxes: true,
  };

  it("passes a large family above the old flat $40,000 but within their real $60,768 tier", () => {
    const result = manitobaRentAssist.check({
      ...renter,
      maritalStatus: "married",
      numberOfChildren: 3,
      familyIncome: 45000,
    });
    expect(result.status).toBe("eligible");
  });

  it("fails a single, non-senior renter above their real $29,120 cutoff, below the old flat $40,000", () => {
    const result = manitobaRentAssist.check({
      ...renter,
      maritalStatus: "single",
      annualIncome: 35000,
    });
    expect(result.status).toBe("ineligible");
  });
});
