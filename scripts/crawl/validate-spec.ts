/**
 * Validate a researched benefit spec before it is written into the registry.
 *
 * Research can be delegated; trust cannot. A spec arrives as JSON claiming a
 * set of figures, each with a source URL and a verbatim quote. This checks
 * those claims mechanically, and — critically — re-fetches the cited page to
 * confirm the quote is really on it. A quote that cannot be found on its own
 * source is a fabrication, whatever produced it.
 *
 *   npx tsx scripts/crawl/validate-spec.ts <spec.json> [more.json ...]
 *
 * Exits non-zero if any spec has an error.
 */

import fs from "node:fs";
import path from "node:path";
import { isOfficialUrl, numberPattern } from "../../src/lib/figures";
import { fetchOfficial } from "./fetch";
import { comparable, htmlToText } from "./extract";

interface SpecFigure {
  key: string;
  value: number;
  kind: string;
  label: string;
  source: string;
  quote: string;
  effectiveFrom?: string | null;
}

interface Spec {
  benefitId: string;
  level?: string;
  whyBroad?: string;
  name: { en: string; "zh-Hant"?: string; "zh-Hans"?: string };
  shortName: string;
  category: string;
  description: { en: string; "zh-Hant"?: string; "zh-Hans"?: string };
  officialInfoUrl: string;
  figures: SpecFigure[];
  eligibility?: string[];
  howToApply?: string[];
  contextFieldsNeeded?: string[];
  cannotRepresent?: string | null;
  notes?: string;
}

const LEVELS = [
  "federal", "provincial-bc", "provincial-on", "provincial-ab", "provincial-mb",
  "provincial-sk", "provincial-ns", "provincial-nb", "provincial-pe", "provincial-nl",
];

const CATEGORIES = [
  "disability",
  "seniors",
  "family",
  "housing",
  "health",
  "income-support",
  "tax-credits",
  "education",
];

/** Context fields the app actually has. A spec asking for others cannot be built. */
const CONTEXT_FIELDS = new Set([
  "helpingSomeoneElse", "age", "residency", "province", "yearsInCanada", "yearsInProvince",
  "maritalStatus", "hasChildren", "numberOfChildren", "childrenUnder6", "youngestChildAge",
  "employmentStatus", "annualIncome", "familyIncome", "hasDisability", "hasSevereDisability",
  "hasDTC", "isHomeowner", "monthlyRent", "hasPrivateDentalInsurance",
  "receivesProvincialAssistance", "hasRecentCppContributions", "hasRecentEiHours",
  "filedTaxes", "postSecondaryStudent",
]);

export interface Finding {
  level: "error" | "warn";
  where: string;
  message: string;
}

/** Checks that need no network. */
export function validateShape(spec: Spec): Finding[] {
  const out: Finding[] = [];
  const err = (where: string, message: string) => out.push({ level: "error", where, message });
  const warn = (where: string, message: string) => out.push({ level: "warn", where, message });

  if (!spec.benefitId || !/^[a-z0-9-]+$/.test(spec.benefitId)) {
    err("benefitId", `must be kebab-case, got ${JSON.stringify(spec.benefitId)}`);
  }
  if (!CATEGORIES.includes(spec.category)) {
    err("category", `${spec.category} is not one of ${CATEGORIES.join(", ")}`);
  }
  if (spec.level !== undefined && !LEVELS.includes(spec.level)) {
    err("level", `${spec.level} is not a BenefitLevel the app has`);
  }
  // A spec gathered under a "broad reach only" brief should say who it reaches.
  if (spec.level && !spec.whyBroad) {
    warn("whyBroad", "no statement of who this reaches — confirm it clears the breadth bar");
  }
  for (const field of ["name", "description"] as const) {
    const v = spec[field];
    if (!v?.en) err(field, "missing English text");
    if (!v?.["zh-Hant"]) warn(field, "no Traditional Chinese; will fall back to English");
    if (!v?.["zh-Hans"]) warn(field, "no Simplified Chinese; will fall back to English");
  }
  if (!isOfficialUrl(spec.officialInfoUrl ?? "")) {
    err("officialInfoUrl", `not an official https URL: ${spec.officialInfoUrl}`);
  }

  for (const field of spec.contextFieldsNeeded ?? []) {
    if (!CONTEXT_FIELDS.has(field)) {
      err("contextFieldsNeeded", `"${field}" is not a field the app has`);
    }
  }

  for (const f of spec.figures ?? []) {
    const at = `figure ${f.key}`;
    if (!Number.isFinite(f.value)) err(at, "value is not a number");
    if (!isOfficialUrl(f.source ?? "")) err(at, `source is not official: ${f.source}`);
    if (!f.quote) err(at, "no quote");
    else if (!new RegExp(numberPattern(f.value)).test(f.quote.replace(/(?<=\d),(?=\d)/g, ""))) {
      err(at, `quote does not contain ${f.value}: "${f.quote.slice(0, 90)}"`);
    }
    if (!f.kind) err(at, "kind not labelled");
    // The error this catches is real and common: an income ceiling written up
    // as the amount you receive. Very few benefits pay five figures a year.
    if (f.kind === "benefit-amount" && f.value >= 20000) {
      warn(at, `${f.value} is large for a benefit amount — confirm it is not an income threshold`);
    }
    if (f.kind === "income-threshold" && f.value < 1000) {
      warn(at, `${f.value} is small for an income threshold — confirm the kind`);
    }
  }
  if (!spec.figures?.length && !spec.cannotRepresent && !spec.notes) {
    warn("figures", "no figures and no explanation of why");
  }
  return out;
}

/** Re-fetch each cited page and confirm the quote is really there. */
export async function validateQuotes(spec: Spec): Promise<Finding[]> {
  const out: Finding[] = [];
  const pages = new Map<string, string>();

  for (const f of spec.figures ?? []) {
    if (!isOfficialUrl(f.source ?? "") || !f.quote) continue;
    if (!pages.has(f.source)) {
      try {
        pages.set(f.source, comparable(htmlToText((await fetchOfficial(f.source)).html)));
      } catch (err) {
        out.push({
          level: "error",
          where: `figure ${f.key}`,
          message: `source did not load: ${String(err).slice(0, 120)}`,
        });
        continue;
      }
    }
    const page = pages.get(f.source);
    if (page && !page.includes(comparable(f.quote))) {
      out.push({
        level: "error",
        where: `figure ${f.key}`,
        message: `quote is NOT on ${f.source} — "${f.quote.slice(0, 80)}"`,
      });
    }
  }
  return out;
}

async function main(): Promise<void> {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("usage: npx tsx scripts/crawl/validate-spec.ts <spec.json> [...]");
    process.exit(2);
  }

  let errors = 0;
  for (const file of files) {
    const spec = JSON.parse(fs.readFileSync(file, "utf-8")) as Spec;
    const findings = [...validateShape(spec), ...(await validateQuotes(spec))];
    const bad = findings.filter((f) => f.level === "error").length;
    errors += bad;

    const figures = spec.figures?.length ?? 0;
    console.log(
      `\n${path.basename(file)} — ${spec.benefitId}: ${figures} figure(s), ` +
        `${bad} error(s), ${findings.length - bad} warning(s)`,
    );
    if (spec.whyBroad) console.log(`  REACH: ${spec.whyBroad}`);
    if (spec.cannotRepresent) console.log(`  CANNOT REPRESENT: ${spec.cannotRepresent}`);
    for (const f of findings) {
      console.log(`  ${f.level === "error" ? "ERROR" : "warn "} ${f.where}: ${f.message}`);
    }
  }
  console.log(`\n${errors ? `${errors} error(s) — do not integrate` : "all specs clean"}`);
  process.exit(errors ? 1 : 0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("validation failed:", err);
    process.exit(1);
  });
}
