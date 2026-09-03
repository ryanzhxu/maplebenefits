import { describe, it, expect } from "vitest";
import { BENEFITS, ACTIVE_BENEFITS, getBenefit } from "@/data/benefits";
import { INTAKE } from "@/data/intake";
import { assessAll, evaluate } from "@/lib/engine";
import type { AssessmentContext, EligibilityStatus } from "@/types/benefit";
import { SITE } from "@/config/site";
import { validateFigures } from "@/lib/figures";

const ids = new Set(BENEFITS.map((b) => b.id));
const intakeFields = new Set(INTAKE.map((q) => q.field));

describe("benefit data integrity", () => {
  // Deliberately a floor, not an equality: the crawl automation adds benefits
  // unattended, and a hard count would turn every addition into a red suite.
  // The count that must stay exact is SITE.benefitCount, asserted below.
  it("has at least 75 benefits", () => {
    expect(BENEFITS.length).toBeGreaterThanOrEqual(75);
  });

  it("keeps SITE.benefitCount in sync with the registry", () => {
    expect(SITE.benefitCount).toBe(ACTIVE_BENEFITS.length);
  });

  it("has sound sourced figures on every benefit", () => {
    expect(BENEFITS.flatMap(validateFigures)).toEqual([]);
  });

  it("has unique ids", () => {
    expect(ids.size).toBe(BENEFITS.length);
  });

  it("every benefit has an official info URL and lastUpdated date", () => {
    for (const b of BENEFITS) {
      expect(b.officialInfoUrl, b.id).toMatch(/^https?:\/\//);
      expect(b.lastUpdated, b.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("relatedBenefits and prerequisites reference real benefit ids", () => {
    for (const b of BENEFITS) {
      for (const rel of b.relatedBenefits) expect(ids.has(rel), `${b.id}->${rel}`).toBe(true);
      for (const pre of b.prerequisites ?? [])
        expect(ids.has(pre), `${b.id} prereq ${pre}`).toBe(true);
    }
  });

  it("contextFields reference real intake questions", () => {
    for (const b of BENEFITS) {
      for (const f of b.contextFields)
        expect(intakeFields.has(f) || f === "helpingSomeoneElse", `${b.id}.${f}`).toBe(true);
    }
  });

  it("discontinued benefits are never eligible", () => {
    const richContext: AssessmentContext = {
      age: 40,
      province: "BC",
      familyIncome: 0,
      annualIncome: 0,
      hasChildren: true,
      filedTaxes: true,
    };
    for (const b of BENEFITS.filter((x) => x.discontinued)) {
      expect(b.check(richContext).status).toBe("ineligible");
    }
  });

  it("check functions are pure (same input, same output)", () => {
    const ctx: AssessmentContext = { age: 70, province: "BC", annualIncome: 15000 };
    for (const b of BENEFITS) {
      expect(b.check({ ...ctx })).toEqual(b.check({ ...ctx }));
    }
  });
});

function statusFor(id: string, ctx: AssessmentContext): EligibilityStatus {
  const b = getBenefit(id)!;
  return evaluate(b, ctx).status;
}

describe("real scenario: low-income single senior renter (age 68)", () => {
  const ctx: AssessmentContext = {
    age: 68,
    province: "BC",
    residency: "citizen",
    maritalStatus: "single",
    hasChildren: false,
    employmentStatus: "retired",
    annualIncome: 18000,
    familyIncome: 18000,
    isHomeowner: false,
    monthlyRent: 900,
    yearsInProvince: 20,
    hasDisability: false,
    hasPrivateDentalInsurance: false,
    receivesProvincialAssistance: false,
    filedTaxes: true,
  };

  it("qualifies for OAS, GIS, CGEB, SAFER, seniors supplement", () => {
    expect(statusFor("oas", ctx)).toBe("eligible");
    expect(statusFor("gis", ctx)).toBe("eligible");
    expect(statusFor("cgeb", ctx)).toBe("eligible");
    expect(statusFor("safer", ctx)).toBe("eligible");
    expect(statusFor("bc-seniors-supplement", ctx)).toBe("eligible");
    expect(statusFor("cdcp", ctx)).toBe("eligible");
  });

  it("does not qualify for child or working benefits", () => {
    expect(statusFor("ccb", ctx)).toBe("ineligible");
    expect(statusFor("bc-family-benefit", ctx)).toBe("ineligible");
  });
});

describe("real scenario: working family with young kids (age 35)", () => {
  const ctx: AssessmentContext = {
    age: 35,
    province: "BC",
    residency: "pr",
    maritalStatus: "married",
    hasChildren: true,
    numberOfChildren: 2,
    youngestChildAge: 3,
    employmentStatus: "employed",
    annualIncome: 25000,
    familyIncome: 42000,
    isHomeowner: false,
    monthlyRent: 1800,
    hasDisability: false,
    hasPrivateDentalInsurance: false,
    receivesProvincialAssistance: false,
    filedTaxes: true,
  };

  it("qualifies for CCB, BC Family Benefit, CGEB, RAP", () => {
    expect(statusFor("ccb", ctx)).toBe("eligible");
    expect(statusFor("bc-family-benefit", ctx)).toBe("eligible");
    expect(statusFor("cgeb", ctx)).toBe("eligible");
    expect(statusFor("rap", ctx)).toBe("eligible");
  });

  it("qualifies for family/education savings (Learning Bond, Affordable Child Care)", () => {
    expect(statusFor("canada-learning-bond", ctx)).toBe("eligible");
    expect(statusFor("bc-affordable-child-care", ctx)).toBe("eligible");
  });

  it("as a renter, may qualify for first-home programs", () => {
    expect(statusFor("fhsa", ctx)).toBe("eligible");
    expect(statusFor("home-buyers-amount", ctx)).toBe("eligible");
  });

  it("CCB estimate is a positive dollar amount for 2 kids", () => {
    const r = evaluate(getBenefit("ccb")!, ctx);
    expect(r.estimate?.low).toBeGreaterThan(5000);
  });

  it("does not qualify for senior benefits", () => {
    expect(statusFor("oas", ctx)).toBe("ineligible");
    expect(statusFor("safer", ctx)).toBe("ineligible");
  });
});

describe("real scenario: adult with severe disability and DTC (age 40)", () => {
  const ctx: AssessmentContext = {
    age: 40,
    province: "BC",
    residency: "citizen",
    maritalStatus: "single",
    hasChildren: false,
    employmentStatus: "unable-to-work",
    annualIncome: 12000,
    familyIncome: 12000,
    isHomeowner: false,
    monthlyRent: 800,
    hasDisability: true,
    hasSevereDisability: true,
    hasDTC: true,
    hasRecentCppContributions: true,
    receivesProvincialAssistance: false,
    hasPrivateDentalInsurance: false,
    filedTaxes: true,
  };

  it("qualifies for CDB, RDSP, PWD, CPP-D, DTC", () => {
    expect(statusFor("dtc", ctx)).toBe("eligible");
    expect(statusFor("cdb", ctx)).toBe("eligible");
    expect(statusFor("rdsp", ctx)).toBe("eligible");
    expect(statusFor("pwd", ctx)).toBe("eligible");
    expect(statusFor("cpp-d", ctx)).toBe("eligible");
  });

  it("CDB is gated on DTC — without it, not eligible", () => {
    expect(statusFor("cdb", { ...ctx, hasDTC: false })).toBe("ineligible");
  });
});

describe("real scenario: post-secondary student (age 22)", () => {
  const ctx: AssessmentContext = {
    age: 22,
    province: "BC",
    residency: "citizen",
    maritalStatus: "single",
    hasChildren: false,
    employmentStatus: "unemployed",
    annualIncome: 8000,
    familyIncome: 40000,
    isHomeowner: false,
    postSecondaryStudent: true,
    filedTaxes: true,
  };

  it("qualifies for the BC Access Grant", () => {
    expect(statusFor("bc-access-grant", ctx)).toBe("eligible");
  });

  it("does not surface the Access Grant when not a student", () => {
    expect(statusFor("bc-access-grant", { ...ctx, postSecondaryStudent: false })).toBe(
      "ineligible",
    );
  });
});

describe("real scenario: Ontario low-income senior (age 70)", () => {
  const ctx: AssessmentContext = {
    age: 70,
    province: "ON",
    residency: "citizen",
    maritalStatus: "single",
    hasChildren: false,
    employmentStatus: "retired",
    annualIncome: 17000,
    familyIncome: 17000,
    isHomeowner: false,
    filedTaxes: true,
  };

  it("qualifies for federal seniors + Ontario Trillium, drug coverage; not GAINS at this income", () => {
    expect(statusFor("oas", ctx)).toBe("eligible");
    expect(statusFor("gis", ctx)).toBe("eligible");
    expect(statusFor("ontario-trillium", ctx)).toBe("eligible");
    // GAINS's own income limit ($4,416 single) is far below the $22,488 flat
    // number this check used to use, so $17,000 no longer clears it -- see
    // ontario.ts's GAINS_FIGURES comment.
    expect(statusFor("ontario-gains", ctx)).toBe("ineligible");
    expect(statusFor("ontario-drug-benefit", ctx)).toBe("eligible");
  });

  it("qualifies for GAINS when private income is under its own limit", () => {
    expect(statusFor("ontario-gains", { ...ctx, annualIncome: 4000, familyIncome: 4000 })).toBe(
      "eligible",
    );
  });

  it("does not surface BC-only benefits for an Ontario resident", () => {
    expect(statusFor("safer", ctx)).toBe("ineligible");
    expect(statusFor("pwd", ctx)).toBe("ineligible");
    expect(statusFor("bc-seniors-supplement", ctx)).toBe("ineligible");
  });
});

describe("real scenario: Ontario family with a child (age 33)", () => {
  const ctx: AssessmentContext = {
    age: 33,
    province: "ON",
    residency: "pr",
    maritalStatus: "married",
    hasChildren: true,
    numberOfChildren: 1,
    youngestChildAge: 4,
    employmentStatus: "employed",
    annualIncome: 20000,
    familyIncome: 35000,
    isHomeowner: false,
    filedTaxes: true,
  };

  it("qualifies for CCB and the Ontario Child Benefit", () => {
    expect(statusFor("ccb", ctx)).toBe("eligible");
    expect(statusFor("ontario-child-benefit", ctx)).toBe("eligible");
  });
});

describe("real scenario: Alberta adult with a disability (age 45)", () => {
  const ctx: AssessmentContext = {
    age: 45,
    province: "AB",
    residency: "citizen",
    maritalStatus: "single",
    hasChildren: false,
    employmentStatus: "unable-to-work",
    annualIncome: 6000,
    familyIncome: 6000,
    isHomeowner: false,
    hasDisability: true,
    hasSevereDisability: true,
    filedTaxes: true,
  };

  it("qualifies for AISH and Alberta Adult Health Benefit", () => {
    expect(statusFor("aish", ctx)).toBe("eligible");
    expect(statusFor("alberta-adult-health-benefit", ctx)).toBe("eligible");
  });

  it("does not surface BC or Ontario provincial benefits", () => {
    expect(statusFor("pwd", ctx)).toBe("ineligible");
    expect(statusFor("odsp", ctx)).toBe("ineligible");
  });
});

describe("real scenario: Manitoba senior renter & Saskatchewan disability", () => {
  const mb: AssessmentContext = {
    age: 67,
    province: "MB",
    maritalStatus: "single",
    hasChildren: false,
    annualIncome: 16000,
    familyIncome: 16000,
    isHomeowner: false,
    filedTaxes: true,
  };
  const sk: AssessmentContext = {
    age: 40,
    province: "SK",
    hasDisability: true,
    hasSevereDisability: true,
    annualIncome: 6000,
    familyIncome: 6000,
    filedTaxes: true,
  };

  it("Manitoba senior: OAS/GIS + 55 PLUS + Rent Assist", () => {
    expect(statusFor("oas", mb)).toBe("eligible");
    expect(statusFor("manitoba-55-plus", mb)).toBe("eligible");
    expect(statusFor("manitoba-rent-assist", mb)).toBe("eligible");
  });

  it("Saskatchewan disability: SAID; not the Manitoba/Ontario equivalents", () => {
    expect(statusFor("said", sk)).toBe("eligible");
    expect(statusFor("manitoba-eia", sk)).toBe("ineligible");
    expect(statusFor("odsp", sk)).toBe("ineligible");
  });
});

describe("real scenario: Atlantic provinces", () => {
  it("Newfoundland low-income family: CCB + NL Child Benefit", () => {
    const nl: AssessmentContext = {
      age: 30,
      province: "NL",
      hasChildren: true,
      numberOfChildren: 1,
      youngestChildAge: 2,
      annualIncome: 12000,
      familyIncome: 20000,
      isHomeowner: false,
      filedTaxes: true,
    };
    expect(statusFor("ccb", nl)).toBe("eligible");
    expect(statusFor("nl-child-benefit", nl)).toBe("eligible");
  });

  it("Nova Scotia senior: OAS/GIS, not other provinces' benefits", () => {
    const ns: AssessmentContext = {
      age: 72,
      province: "NS",
      maritalStatus: "single",
      hasChildren: false,
      annualIncome: 16000,
      familyIncome: 16000,
      isHomeowner: false,
      filedTaxes: true,
    };
    expect(statusFor("oas", ns)).toBe("eligible");
    expect(statusFor("gis", ns)).toBe("eligible");
    expect(statusFor("ontario-trillium", ns)).toBe("ineligible");
    expect(statusFor("sip", ns)).toBe("ineligible");
  });

  it("PEI family: PEI Child Benefit + Sales Tax Credit", () => {
    const pe: AssessmentContext = {
      age: 34,
      province: "PE",
      maritalStatus: "married",
      hasChildren: true,
      numberOfChildren: 2,
      annualIncome: 20000,
      familyIncome: 40000,
      filedTaxes: true,
    };
    expect(statusFor("pei-child-benefit", pe)).toBe("eligible");
    expect(statusFor("pei-sales-tax-credit", pe)).toBe("eligible");
  });

  it("NB Seniors' Benefit uses GIS's real tiered income ceiling, not a flat $30,000", () => {
    // A married senior couple with $45,000 combined income is within GIS's
    // real widest couple ceiling ($54,624) but was wrongly excluded by the
    // old flat $30,000 cutoff.
    const nbCouple: AssessmentContext = {
      age: 66,
      province: "NB",
      maritalStatus: "married",
      familyIncome: 45000,
    };
    expect(statusFor("nb-seniors-benefit", nbCouple)).toBe("eligible");

    // A single senior with $25,000 income is above GIS's real single ceiling
    // ($22,800) but was wrongly let through by the old flat $30,000 cutoff.
    const nbSingle: AssessmentContext = {
      age: 66,
      province: "NB",
      maritalStatus: "single",
      annualIncome: 25000,
    };
    expect(statusFor("nb-seniors-benefit", nbSingle)).toBe("ineligible");
  });
});

describe("exact amount calculators", () => {
  it("CCB: 2 kids (1 under 6), $42k income → accurate two-tier amount", () => {
    const ctx: AssessmentContext = {
      hasChildren: true,
      numberOfChildren: 2,
      childrenUnder6: 1,
      familyIncome: 42000,
    };
    // max 8157 + 6883 = 15040; reduce 13.5% of (42000-38237)=508 → ~14532
    const r = evaluate(getBenefit("ccb")!, ctx);
    expect(r.estimate?.low).toBeGreaterThanOrEqual(14520);
    expect(r.estimate?.low).toBeLessThanOrEqual(14540);
  });

  it("CCB: high income above tier-2 threshold reduces further", () => {
    const low = evaluate(getBenefit("ccb")!, {
      hasChildren: true,
      numberOfChildren: 1,
      childrenUnder6: 0,
      familyIncome: 90000,
    }).estimate?.low;
    expect(low).toBeGreaterThan(0);
    expect(low).toBeLessThan(6883);
  });

  it("GIS: single with $12k income → about $623/month", () => {
    const r = evaluate(getBenefit("gis")!, {
      age: 70,
      maritalStatus: "single",
      annualIncome: 12000,
      familyIncome: 12000,
    });
    expect(r.estimate?.period).toBe("month");
    // 1123.17 (2026 single maximum) - 12000/24 = 623.17. The old range of
    // 590-600 was pinned to a stale 1097 maximum that appeared nowhere on the
    // GIS page.
    expect(r.estimate?.low).toBeGreaterThanOrEqual(615);
    expect(r.estimate?.low).toBeLessThanOrEqual(630);
  });

  it("GIS: very high income → $0", () => {
    const r = evaluate(getBenefit("gis")!, {
      age: 70,
      maritalStatus: "single",
      annualIncome: 40000,
    });
    expect(r.estimate?.low).toBe(0);
  });
});

describe("assessAll ordering", () => {
  it("puts eligible results before ineligible and sorts by value", () => {
    const ctx: AssessmentContext = {
      age: 68,
      province: "BC",
      maritalStatus: "single",
      annualIncome: 15000,
      familyIncome: 15000,
      isHomeowner: false,
      monthlyRent: 900,
      hasChildren: false,
      filedTaxes: true,
      receivesProvincialAssistance: false,
      hasPrivateDentalInsurance: false,
    };
    const results = assessAll(ACTIVE_BENEFITS, ctx);
    const firstIneligible = results.findIndex((r) => r.status === "ineligible");
    const lastEligible = results.map((r) => r.status).lastIndexOf("eligible");
    if (firstIneligible !== -1 && lastEligible !== -1) {
      expect(lastEligible).toBeLessThan(firstIneligible);
    }
  });
});
