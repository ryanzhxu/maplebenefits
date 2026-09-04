import { describe, expect, it } from "vitest";
import { getBenefit } from "@/data/benefits";
import { DEEP } from "@/data/deep-content";
import { resolve } from "@/i18n/locale";

describe("ccb pilot: French and Punjabi content", () => {
  const ccb = getBenefit("ccb")!;

  it("has the official French name and a distinct Punjabi name", () => {
    expect(resolve(ccb.name, "fr")).toBe("Allocation canadienne pour enfants");
    expect(resolve(ccb.name, "pa")).not.toBe(resolve(ccb.name, "en"));
  });

  it("translates description and estimated value", () => {
    expect(resolve(ccb.description, "fr")).not.toBe(resolve(ccb.description, "en"));
    expect(resolve(ccb.description, "pa")).not.toBe(resolve(ccb.description, "en"));
    expect(resolve(ccb.estimatedValue, "fr")).not.toBe(resolve(ccb.estimatedValue, "en"));
    expect(resolve(ccb.estimatedValue, "pa")).not.toBe(resolve(ccb.estimatedValue, "en"));
  });

  it("translates every application step, its tips, and required documents", () => {
    for (const step of ccb.applicationSteps) {
      expect(resolve(step.title, "fr")).not.toBe(resolve(step.title, "en"));
      expect(resolve(step.title, "pa")).not.toBe(resolve(step.title, "en"));
      expect(resolve(step.description, "fr")).not.toBe(resolve(step.description, "en"));
      expect(resolve(step.description, "pa")).not.toBe(resolve(step.description, "en"));
      for (const tip of step.tips ?? []) {
        expect(resolve(tip, "fr")).not.toBe(resolve(tip, "en"));
        expect(resolve(tip, "pa")).not.toBe(resolve(tip, "en"));
      }
    }
    for (const doc of ccb.requiredDocuments) {
      expect(resolve(doc, "fr")).not.toBe(resolve(doc, "en"));
      expect(resolve(doc, "pa")).not.toBe(resolve(doc, "en"));
    }
  });

  it("translates processing time and payment frequency", () => {
    expect(resolve(ccb.processingTime, "fr")).not.toBe(resolve(ccb.processingTime, "en"));
    expect(resolve(ccb.paymentFrequency, "pa")).not.toBe(resolve(ccb.paymentFrequency, "en"));
  });

  it("translates the deep-content eligibility details and good-to-know items", () => {
    const deep = DEEP.ccb;
    for (const item of deep.eligibilityDetails ?? []) {
      expect(resolve(item, "fr")).not.toBe(resolve(item, "en"));
      expect(resolve(item, "pa")).not.toBe(resolve(item, "en"));
    }
    for (const item of deep.goodToKnow ?? []) {
      expect(resolve(item, "fr")).not.toBe(resolve(item, "en"));
      expect(resolve(item, "pa")).not.toBe(resolve(item, "en"));
    }
  });
});
