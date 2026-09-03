import { describe, expect, it } from "vitest";
import { hsoIncomeLimit } from "@/data/benefits/ontario";
import { getBenefit } from "@/data/benefits";
import { evaluate } from "@/lib/engine";
import type { AssessmentContext } from "@/types/benefit";

describe("Healthy Smiles income limit", () => {
  it("reproduces every row of Ontario's published table", () => {
    // The province publishes ten rows; the app stores two figures and a
    // formula. If they ever disagree, this fails.
    const published = [29065, 31265, 33465, 35665, 37865, 40065, 42265, 44465, 46665, 48865];
    published.forEach((expected, i) => {
      expect(hsoIncomeLimit(i + 1), `${i + 1} child(ren)`).toBe(expected);
    });
  });

  it("keeps rising past ten children, as the page instructs", () => {
    expect(hsoIncomeLimit(11)).toBe(48865 + 2200);
  });

  it("is unknown when the number of children is unknown", () => {
    expect(hsoIncomeLimit(undefined)).toBeUndefined();
  });
});

describe("newly added Ontario benefits", () => {
  const base: AssessmentContext = { province: "ON", filedTaxes: true };

  it("gives a larger family a higher Healthy Smiles income limit", () => {
    const ctx = { ...base, hasChildren: true, youngestChildAge: 5, familyIncome: 34000 };
    // $34,000 is over the one-child limit but under the four-child limit.
    expect(evaluate(getBenefit("ontario-healthy-smiles")!, { ...ctx, numberOfChildren: 1 }).status)
      .toBe("ineligible");
    expect(evaluate(getBenefit("ontario-healthy-smiles")!, { ...ctx, numberOfChildren: 4 }).status)
      .toBe("eligible");
  });

  it("phases out the seniors care credit with income", () => {
    const at35k = evaluate(getBenefit("ontario-seniors-care-at-home")!, {
      ...base, age: 72, familyIncome: 35000,
    });
    const at55k = evaluate(getBenefit("ontario-seniors-care-at-home")!, {
      ...base, age: 72, familyIncome: 55000,
    });
    expect(at35k.estimate?.high).toBe(1500);
    expect(at55k.estimate?.high).toBe(500); // 1500 - 5% of 20,000
  });

  it("scales the child care credit with the number of young children", () => {
    const one = evaluate(getBenefit("ontario-child-care-tax-credit")!, {
      ...base, hasChildren: true, numberOfChildren: 1, childrenUnder6: 1, familyIncome: 40000,
    });
    // 75% of the $6,000 expense cap for one child under 7.
    expect(one.estimate?.high).toBe(4500);
  });
});
