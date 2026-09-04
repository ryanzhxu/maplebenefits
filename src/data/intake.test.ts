import { describe, expect, it } from "vitest";
import { INTAKE } from "@/data/intake";

describe("age question", () => {
  const age = INTAKE.find((q) => q.field === "age")!;
  const currentYear = new Date().getFullYear();

  it("is a birth-year slider defaulting to age 40", () => {
    expect(age.inputType).toBe("slider");
    expect(age.birthYearSlider).toBe(true);
    expect(age.defaultValue).toBe(currentYear - 40);
  });

  it("keeps defaultValue within min/max, spanning 1900 to the current year", () => {
    expect(age.min).toBe(1900);
    expect(age.max).toBe(currentYear);
    expect(age.defaultValue).toBeGreaterThanOrEqual(age.min!);
    expect(age.defaultValue).toBeLessThanOrEqual(age.max!);
  });
});
