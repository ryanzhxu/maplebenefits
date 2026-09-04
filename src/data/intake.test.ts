import { describe, expect, it } from "vitest";
import { INTAKE } from "@/data/intake";

describe("age question", () => {
  const age = INTAKE.find((q) => q.field === "age")!;

  it("is a slider pre-filled at 40", () => {
    expect(age.inputType).toBe("slider");
    expect(age.defaultValue).toBe(40);
  });

  it("keeps defaultValue within min/max", () => {
    expect(age.min).toBeDefined();
    expect(age.max).toBeDefined();
    expect(age.defaultValue).toBeGreaterThanOrEqual(age.min!);
    expect(age.defaultValue).toBeLessThanOrEqual(age.max!);
  });
});
