import { describe, it, expect } from "vitest";
import type { AssessmentContext } from "@/types/benefit";
import { atLeast, atMost, atMostOf, buildCheck, isFalse, isTrue, lessThan, oneOf } from "./checks";

describe("check DSL", () => {
  it("returns eligible when all hard rules pass", () => {
    const check = buildCheck([
      { test: atLeast((c) => c.age, 65), hard: true, failReason: "too young" },
    ]);
    expect(check({ age: 70 }).status).toBe("eligible");
    expect(check({ age: 70 }).confidence).toBe("definite");
  });

  it("returns ineligible on a hard fail with the fail reason", () => {
    const check = buildCheck([
      { test: atLeast((c) => c.age, 65), hard: true, failReason: "too young" },
    ]);
    const r = check({ age: 40 });
    expect(r.status).toBe("ineligible");
    expect(r.reasons).toEqual(["too young"]);
  });

  it("returns need-more-info when a hard rule is unknown", () => {
    const check = buildCheck([
      { test: atLeast((c) => c.age, 65), hard: true, missingField: "age" },
    ]);
    const r = check({});
    expect(r.status).toBe("need-more-info");
    expect(r.missing).toContain("age");
  });

  it("soft fail keeps eligible but lowers confidence to likely", () => {
    const check = buildCheck([
      { test: atLeast((c) => c.age, 18), hard: true },
      { test: isTrue((c) => c.filedTaxes), hard: false },
    ]);
    const r = check({ age: 30, filedTaxes: false });
    expect(r.status).toBe("eligible");
    expect(r.confidence).toBe("likely");
  });

  it("collects pass reasons from passing rules", () => {
    const check = buildCheck([
      { test: isTrue((c) => c.hasChildren), hard: true, passReason: "kids" },
    ]);
    expect(check({ hasChildren: true }).reasons).toEqual(["kids"]);
  });

  it("a hard fail wins over an unknown", () => {
    const check = buildCheck([
      { test: atLeast((c) => c.age, 65), hard: true, failReason: "young" },
      { test: isTrue((c) => c.filedTaxes), hard: true, missingField: "filedTaxes" },
    ]);
    expect(check({ age: 30 }).status).toBe("ineligible");
  });
});

describe("predicate helpers", () => {
  const ctx: AssessmentContext = { age: 40, province: "BC", isHomeowner: false };
  it("atMost", () => {
    expect(atMost((c) => c.age, 50)(ctx)).toBe("pass");
    expect(atMost((c) => c.age, 30)(ctx)).toBe("fail");
    expect(atMost((c) => c.annualIncome, 30)(ctx)).toBe("unknown");
  });
  it("oneOf", () => {
    expect(oneOf((c) => c.province, ["BC"])(ctx)).toBe("pass");
    expect(oneOf((c) => c.province, ["ON"])(ctx)).toBe("fail");
  });
  it("isFalse", () => {
    expect(isFalse((c) => c.isHomeowner)(ctx)).toBe("pass");
    expect(isFalse((c) => c.hasChildren)(ctx)).toBe("unknown");
  });
});

describe("atMostOf", () => {
  it("compares against a ceiling derived from the context", () => {
    const p = atMostOf(
      (c) => c.familyIncome as number | undefined,
      (c) => ((c.numberOfChildren as number) >= 4 ? 22242 : 20435),
    );
    expect(p({ familyIncome: 21000, numberOfChildren: 1 })).toBe("fail");
    expect(p({ familyIncome: 21000, numberOfChildren: 4 })).toBe("pass");
  });

  it("is unknown when the value or the ceiling is unavailable", () => {
    const p = atMostOf(
      (c) => c.familyIncome as number | undefined,
      (c) => c.numberOfChildren as number | undefined,
    );
    expect(p({ numberOfChildren: 3 })).toBe("unknown");
    expect(p({ familyIncome: 100 })).toBe("unknown");
  });
});

describe("lessThan", () => {
  it("is strict at the boundary, unlike atMost", () => {
    const p = lessThan((c) => c.familyIncome as number | undefined, 90000);
    expect(p({ familyIncome: 89999 })).toBe("pass");
    expect(p({ familyIncome: 90000 })).toBe("fail");
    expect(atMost((c) => c.familyIncome as number | undefined, 90000)({ familyIncome: 90000 })).toBe("pass");
  });

  it("is unknown when the value is missing", () => {
    expect(lessThan((c) => c.familyIncome as number | undefined, 90000)({})).toBe("unknown");
  });
});
