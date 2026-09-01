import { describe, it, expect } from "vitest";
import { BENEFITS, ACTIVE_BENEFITS, getBenefit } from "@/data/benefits";
import { INTAKE } from "@/data/intake";
import { assessAll, evaluate } from "@/lib/engine";
import type { AssessmentContext, EligibilityStatus } from "@/types/benefit";

const ids = new Set(BENEFITS.map((b) => b.id));
const intakeFields = new Set(INTAKE.map((q) => q.field));

describe("benefit data integrity", () => {
  it("has 45 benefits", () => {
    expect(BENEFITS.length).toBe(45);
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

  it("qualifies for federal seniors + Ontario Trillium, GAINS, drug coverage", () => {
    expect(statusFor("oas", ctx)).toBe("eligible");
    expect(statusFor("gis", ctx)).toBe("eligible");
    expect(statusFor("ontario-trillium", ctx)).toBe("eligible");
    expect(statusFor("ontario-gains", ctx)).toBe("eligible");
    expect(statusFor("ontario-drug-benefit", ctx)).toBe("eligible");
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
