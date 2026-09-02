import type { Benefit, BenefitCategory, BenefitLevel } from "@/types/benefit";
import { federalDisabilityBenefits } from "./federal-disability";
import { federalSeniorsBenefits } from "./federal-seniors";
import { federalFamilyTaxBenefits } from "./federal-family-tax";
import { federalIncomeBenefits } from "./federal-income";
import { federalHousingBenefits } from "./federal-housing";
import { federalEducationBenefits } from "./federal-education";
import { bcDisabilityIncomeBenefits } from "./bc-disability-income";
import { bcHousingBenefits } from "./bc-housing";
import { bcHealthSeniorsFamilyBenefits } from "./bc-health-seniors-family";
import { bcEducationChildcareBenefits } from "./bc-education-childcare";
import { ontarioBenefits } from "./ontario";
import { albertaBenefits } from "./alberta";
import { manitobaBenefits } from "./manitoba";
import { saskatchewanBenefits } from "./saskatchewan";
import { novaScotiaBenefits } from "./nova-scotia";
import { newBrunswickBenefits } from "./new-brunswick";

/** Every benefit in the app. Order here is the default browse order. */
export const BENEFITS: Benefit[] = [
  ...federalDisabilityBenefits,
  ...federalSeniorsBenefits,
  ...federalFamilyTaxBenefits,
  ...federalIncomeBenefits,
  ...federalHousingBenefits,
  ...federalEducationBenefits,
  ...bcDisabilityIncomeBenefits,
  ...bcHousingBenefits,
  ...bcHealthSeniorsFamilyBenefits,
  ...bcEducationChildcareBenefits,
  ...ontarioBenefits,
  ...albertaBenefits,
  ...manitobaBenefits,
  ...saskatchewanBenefits,
  ...novaScotiaBenefits,
  ...newBrunswickBenefits,
];

/** Benefits that are still active (excludes discontinued programs). */
export const ACTIVE_BENEFITS: Benefit[] = BENEFITS.filter((b) => !b.discontinued);

const BY_ID = new Map(BENEFITS.map((b) => [b.id, b]));

export function getBenefit(id: string): Benefit | undefined {
  return BY_ID.get(id);
}

export function getBenefits(ids: string[]): Benefit[] {
  return ids.map((id) => BY_ID.get(id)).filter((b): b is Benefit => !!b);
}

export const CATEGORIES: BenefitCategory[] = [
  "disability",
  "seniors",
  "family",
  "housing",
  "health",
  "income-support",
  "tax-credits",
  "education",
];

export const LEVELS: BenefitLevel[] = [
  "federal",
  "provincial-bc",
  "provincial-on",
  "provincial-ab",
  "provincial-mb",
  "provincial-sk",
  "provincial-ns",
  "provincial-nb",
];

export function benefitsByCategory(category: BenefitCategory): Benefit[] {
  return BENEFITS.filter((b) => b.category === category);
}
