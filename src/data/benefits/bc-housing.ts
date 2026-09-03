import type { AmountEstimate, AssessmentContext, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import {
  atLeast,
  atMost,
  buildCheck,
  isFalse,
  isTrue,
  oneOf,
  type RuleState,
} from "@/lib/checks";
import { OAS, GIS } from "./federal-seniors";

const householdIncome = (ctx: AssessmentContext) =>
  ctx.familyIncome ?? ctx.annualIncome;

const rentBurden = (ctx: AssessmentContext): RuleState => {
  if (ctx.monthlyRent === undefined || ctx.annualIncome === undefined)
    return "unknown";
  if (ctx.annualIncome <= 0) return ctx.monthlyRent > 0 ? "pass" : "unknown";
  const monthlyIncome = ctx.annualIncome / 12;
  return ctx.monthlyRent / monthlyIncome > 0.3 ? "pass" : "fail";
};

/**
 * SAFER and RAP share the same BC Housing benefit formula (sliding scale):
 *   Benefit = Rent Gap x sliding-scale percentage (90% down to 35%).
 *   Rent Gap = Adjusted Rent (actual rent, capped at the program's rent
 *              ceiling) minus 30% of gross monthly household income.
 *   Percentage = 90% at or below "Base Income"; declines linearly to 35%
 *              at "Maximum Income": 90 - (income - base) * 55 / (max - base).
 * Sources: SAFER Program Framework, April 2025 --
 * https://www.bchousing.org/sites/default/files/media/documents/SAFER-Program-Framework.pdf
 * and Rental Assistance Program Framework, April 2025 --
 * https://www.bchousing.org/sites/default/files/media/documents/Rental-Assistance-Program-Framework-April-2025.pdf
 */
const slidingScalePercent = (
  monthlyIncome: number,
  baseIncome: number,
  maxIncome: number,
): number => {
  if (monthlyIncome <= baseIncome) return 90;
  const pct =
    90 - (monthlyIncome - baseIncome) * (55 / (maxIncome - baseIncome));
  return Math.min(90, Math.max(35, pct));
};

// SAFER rent ceiling and income limit, effective April 2025 --
// https://www.bchousing.org/housing-assistance/rental-assistance-programs/SAFER
// (same ceiling and income limit for singles and couples).
const SAFER_MAX_RENT = 1150;
const SAFER_MAX_INCOME_MONTHLY = 3333.34; // $40,000/year
const SAFER_MIN_BENEFIT = 50; // official minimum monthly benefit

/**
 * SAFER's "Base Income" is officially defined (Program Framework, April 2025)
 * as the maximum OAS + maximum GIS + maximum BC Senior's Supplement for the
 * year (reset every August 1). AssessmentContext has no field carrying these
 * program-parameter amounts directly, so we approximate Base Income from the
 * current maximums, split by marital status where known (assume single if
 * maritalStatus is unanswered):
 *   OAS (age 65-74) and GIS max -- read from the OAS/GIS figures anchored in
 *     src/data/benefits/federal-seniors.ts (source: canada.ca OAS/GIS
 *     payments pages) instead of duplicating the literals here, so the two
 *     files cannot drift apart the way they already have once (the couple
 *     GIS rate sat stale at $60.10 here against the published table).
 *   BC Senior's Supplement: single $99.30/month, couple $110.25/month each --
 *     https://www2.gov.bc.ca/gov/content/governments/policies-for-government/bcea-policy-and-procedure-manual/bc-employment-and-assistance-rate-tables/senior-s-supplement-rate-table
 */
const saferBaseIncomeMonthly = (ctx: AssessmentContext): number => {
  const couple =
    ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
  const oas = val(OAS.maxMonthly65to74);
  const gis = couple ? val(GIS.maxMonthlyWithSpouseOnOas) : val(GIS.maxMonthlySingle);
  const supplement = couple ? 110.25 : 99.3;
  const perPerson = oas + gis + supplement;
  return couple ? perPerson * 2 : perPerson;
};

const saferEstimate = (ctx: AssessmentContext): AmountEstimate => {
  const rent = ctx.monthlyRent;
  const income = householdIncome(ctx);
  // Best-case theoretical ceiling (income near $0) while we are missing an
  // input, matching how other exact calculators (e.g. GIS, CCB) fall back.
  if (rent === undefined || income === undefined) {
    return { low: 0, high: Math.round(SAFER_MAX_RENT * 0.9), period: "month" };
  }
  const monthlyIncome = income / 12;
  const adjustedRent = Math.min(rent, SAFER_MAX_RENT);
  const rentGap = adjustedRent - 0.3 * monthlyIncome;
  if (rentGap <= 0) return { low: 0, high: 0, period: "month" };
  const baseIncome = saferBaseIncomeMonthly(ctx);
  const pct = slidingScalePercent(
    monthlyIncome,
    baseIncome,
    SAFER_MAX_INCOME_MONTHLY,
  );
  const raw = rentGap * (pct / 100);
  const amount = raw <= 0 ? 0 : Math.max(SAFER_MIN_BENEFIT, Math.round(raw));
  return {
    low: amount,
    high: amount,
    period: "month",
    note: tri(
      "Calculated from the SAFER formula: your rent (up to the $1,150 ceiling) minus 30% of your income, times a sliding-scale percentage.",
      "根據 SAFER 公式計算：租金（上限 $1,150）減去收入的 30%，再乘以按收入遞減的百分比。",
      "根据 SAFER 公式计算：租金（上限 $1,150）减去收入的 30%，再乘以按收入递减的百分比。",
    ),
  };
};

export const safer: Benefit = {
  id: "safer",
  name: tri(
    "Shelter Aid for Elderly Renters",
    "長者租金援助 (SAFER)",
    "长者租金援助 (SAFER)",
  ),
  shortName: "SAFER",
  category: "housing",
  level: "provincial-bc",
  description: tri(
    "Monthly cash payments that help BC seniors aged 60 and older with low to moderate incomes afford their rent.",
    "為 60 歲或以上、低至中等收入的卑詩省長者提供每月現金援助，協助支付租金。",
    "为 60 岁或以上、低至中等收入的不列颠哥伦比亚省长者提供每月现金援助，帮助支付租金。",
  ),
  estimatedValue: tri(
    "Varies with your rent and income — use the BC Housing SAFER calculator",
    "視乎租金與收入而定 — 可用 BC Housing SAFER 計算器",
    "视乎租金与收入而定 — 可用 BC Housing SAFER 计算器",
  ),
  contextFields: ["province", "age", "isHomeowner", "monthlyRent", "annualIncome", "familyIncome", "receivesProvincialAssistance", "yearsInProvince", "maritalStatus"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri("SAFER is only for BC residents.", "SAFER 只適用於卑詩省居民。", "SAFER 只适用于不列颠哥伦比亚省居民。"),
      missingField: "province",
    },
    {
      test: atLeast((c) => c.age, 60),
      hard: true,
      passReason: tri("You are 60 or older.", "你已年滿 60 歲。", "你已年满 60 岁。"),
      failReason: tri(
        "SAFER is for BC residents aged 60 and older.",
        "SAFER 適用於 60 歲或以上的卑詩省居民。",
        "SAFER 适用于 60 岁或以上的不列颠哥伦比亚省居民。",
      ),
      missingField: "age",
    },
    {
      test: isFalse((c) => c.isHomeowner),
      hard: true,
      passReason: tri("You rent your home.", "你租住居所。", "你租住居所。"),
      failReason: tri("SAFER helps renters, not homeowners.", "SAFER 幫助租客，而非業主。", "SAFER 帮助租客，而非业主。"),
      missingField: "isHomeowner",
    },
    {
      test: rentBurden,
      hard: true,
      passReason: tri(
        "You pay more than 30% of your income toward rent.",
        "你的租金超過收入的 30%。",
        "你的租金超过收入的 30%。",
      ),
      failReason: tri(
        "SAFER helps renters who pay more than 30% of their income toward rent.",
        "SAFER 幫助租金超過收入 30% 的租客。",
        "SAFER 帮助租金超过收入 30% 的租客。",
      ),
      missingField: "monthlyRent",
    },
    {
      test: atMost(householdIncome, 40000),
      hard: true,
      passReason: tri(
        "Your household income is within the SAFER limit.",
        "你的家庭收入在 SAFER 上限之內。",
        "你的家庭收入在 SAFER 上限之内。",
      ),
      failReason: tri(
        "SAFER is for households with gross income under about $40,000/year.",
        "SAFER 適用於稅前收入約 $40,000／年以下的家庭。",
        "SAFER 适用于税前收入约 $40,000／年以下的家庭。",
      ),
      missingField: "familyIncome",
    },
    {
      test: isFalse((c) => c.receivesProvincialAssistance),
      hard: true,
      passReason: tri(
        "You are not receiving BC income or disability assistance.",
        "你並無領取卑詩省收入或殘障援助。",
        "你并无领取不列颠哥伦比亚省收入或残障援助。",
      ),
      failReason: tri(
        "SAFER is not available to people already receiving BC income or disability assistance.",
        "已領取卑詩省收入或殘障援助的人士不能領取 SAFER。",
        "已领取不列颠哥伦比亚省收入或残障援助的人士不能领取 SAFER。",
      ),
      missingField: "receivesProvincialAssistance",
    },
  ]),
  estimateAmount: (ctx) => saferEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("Download the SAFER application", "下載 SAFER 申請表", "下载 SAFER 申请表"),
      description: tri(
        "Get the SAFER application form from BC Housing.",
        "從 BC Housing 取得 SAFER 申請表。",
        "从 BC Housing 取得 SAFER 申请表。",
      ),
      actionUrl:
        "https://www.bchousing.org/housing-assistance/rental-assistance-programs/SAFER",
      estimatedTime: tri("30 minutes", "30 分鐘", "30 分钟"),
    },
    {
      order: 2,
      title: tri("Gather documents and submit", "準備文件並提交", "准备文件并提交"),
      description: tri(
        "You will need proof of age, proof of rent, income information, and banking details. Submit everything together — incomplete applications are held then cancelled.",
        "你需要年齡證明、租金證明、收入資料及銀行資料。請一次過提交 — 不完整的申請會被擱置後取消。",
        "你需要年龄证明、租金证明、收入资料及银行资料。请一次过提交 — 不完整的申请会被搁置后取消。",
      ),
      tips: [
        tri(
          "Benefits start from the month your application is received — submit early in the month.",
          "援助由收到申請的月份起計 — 請於月初提交。",
          "援助由收到申请的月份起计 — 请于月初提交。",
        ),
      ],
    },
  ],
  requiredDocuments: [
    tri("Proof of age and status", "年齡及身份證明", "年龄及身份证明"),
    tri("Proof of rent (tenancy agreement or receipt)", "租金證明（租約或收據）", "租金证明（租约或收据）"),
    tri("Income tax information", "所得稅資料", "所得税资料"),
    tri("Direct deposit info (void cheque)", "直接存款資料（作廢支票）", "直接存款资料（作废支票）"),
  ],
  applicationUrl:
    "https://www.bchousing.org/housing-assistance/rental-assistance-programs/SAFER",
  officialInfoUrl:
    "https://www.bchousing.org/housing-assistance/rental-assistance-programs/SAFER",
  processingTime: tri("4-6 weeks", "4-6 星期", "4-6 星期"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["seniors", "housing", "rent", "60+", "low-income", "bc"],
  relatedBenefits: ["oas", "gis", "bc-housing-registry"],
  lastUpdated: "2026-09-01",
};

const RAP_URL =
  "https://www.bchousing.org/housing-assistance/rental-assistance-programs/RAP";

const RAP = figures({
  incomeLimit: {
    current: {
      value: 60000,
      from: "2025-04-01",
      source: RAP_URL,
      quote: "You have a total before-tax annual household income of $60,000 or less",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Maximum household income",
  },
  rentCeilingSmall: {
    current: {
      value: 1950,
      from: "2025-04-01",
      source: RAP_URL,
      quote: "Family of 3 or less $1,950, province wide",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Rent ceiling, family of 3 or less",
  },
  rentCeilingLarge: {
    current: {
      value: 2200,
      from: "2025-04-01",
      source: RAP_URL,
      quote: "Family of 4 or more $2,200, province wide",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Rent ceiling, family of 4 or more",
  },
  assetLimit: {
    current: {
      value: 100000,
      from: "2025-04-01",
      source: RAP_URL,
      quote: "You have less than $100,000 in assets",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Maximum assets",
  },
});

const RAP_MAX_INCOME_MONTHLY = val(RAP.incomeLimit) / 12;

/**
 * RAP's Base Income is fixed at $1,800/month ($21,600/year), effective April
 * 2025 -- Rental Assistance Program Framework, April 2025 (see source above).
 * That framework is a PDF the crawler's text extractor cannot reliably parse
 * (confirmed: probe.ts returns garbled dollar figures from it), so this one
 * stays a plain literal rather than a figures() entry with an unverifiable
 * quote.
 */
const RAP_BASE_INCOME_MONTHLY = 1800;

/**
 * "Core Household" size (Applicant + Spouse + Dependent Children) sets the
 * rent ceiling. AssessmentContext has no direct "household size" field, so we
 * approximate it from maritalStatus (1 adult, or 2 for a couple) plus
 * numberOfChildren (defaulting to 1, since RAP requires at least one child).
 */
const rapMaxRent = (ctx: AssessmentContext): number => {
  const adults =
    ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law"
      ? 2
      : 1;
  const children = ctx.numberOfChildren ?? 1;
  const coreHouseholdSize = adults + children;
  return coreHouseholdSize >= 4
    ? val(RAP.rentCeilingLarge)
    : val(RAP.rentCeilingSmall);
};

const rapEstimate = (ctx: AssessmentContext): AmountEstimate => {
  const rent = ctx.monthlyRent;
  const income = householdIncome(ctx);
  const maxRent = rapMaxRent(ctx);
  // Best-case theoretical ceiling (income near $0) while we are missing an
  // input, matching how other exact calculators (e.g. GIS, CCB) fall back.
  if (rent === undefined || income === undefined) {
    return { low: 0, high: Math.round(maxRent * 0.9), period: "month" };
  }
  const monthlyIncome = income / 12;
  const adjustedRent = Math.min(rent, maxRent);
  const rentGap = adjustedRent - 0.3 * monthlyIncome;
  if (rentGap <= 0) return { low: 0, high: 0, period: "month" };
  const pct = slidingScalePercent(
    monthlyIncome,
    RAP_BASE_INCOME_MONTHLY,
    RAP_MAX_INCOME_MONTHLY,
  );
  const amount = Math.max(0, Math.round(rentGap * (pct / 100)));
  return {
    low: amount,
    high: amount,
    period: "month",
    note: tri(
      "Calculated from the RAP formula: your rent (up to the household rent ceiling) minus 30% of your income, times a sliding-scale percentage.",
      "根據 RAP 公式計算：租金（上限為家庭租金上限）減去收入的 30%，再乘以按收入遞減的百分比。",
      "根据 RAP 公式计算：租金（上限为家庭租金上限）减去收入的 30%，再乘以按收入递减的百分比。",
    ),
  };
};

export const rap: Benefit = {
  id: "rap",
  name: tri(
    "Rental Assistance Program",
    "租金援助計劃 (RAP)",
    "租金援助计划 (RAP)",
  ),
  shortName: "RAP",
  category: "housing",
  level: "provincial-bc",
  description: tri(
    "Monthly help with rent for lower-income working families with children in BC. Eligibility was expanded in 2025.",
    "為卑詩省低收入在職且有子女的家庭提供每月租金援助。資格已於 2025 年放寬。",
    "为不列颠哥伦比亚省低收入在职且有子女的家庭提供每月租金援助。资格已于 2025 年放宽。",
  ),
  estimatedValue: tri(
    "Varies with your rent, income, and family size",
    "視乎租金、收入及家庭人數而定",
    "视乎租金、收入及家庭人数而定",
  ),
  contextFields: ["province", "hasChildren", "isHomeowner", "monthlyRent", "annualIncome", "familyIncome", "employmentStatus", "maritalStatus", "numberOfChildren"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri("RAP is only for BC residents.", "RAP 只適用於卑詩省居民。", "RAP 只适用于不列颠哥伦比亚省居民。"),
      missingField: "province",
    },
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: tri(
        "You have at least one dependent child.",
        "你至少有一名受養子女。",
        "你至少有一名受养子女。",
      ),
      failReason: tri(
        "RAP is for families with at least one dependent child.",
        "RAP 適用於至少有一名受養子女的家庭。",
        "RAP 适用于至少有一名受养子女的家庭。",
      ),
      missingField: "hasChildren",
    },
    {
      test: isFalse((c) => c.isHomeowner),
      hard: true,
      passReason: tri("You rent your home.", "你租住居所。", "你租住居所。"),
      failReason: tri("RAP helps renters, not homeowners.", "RAP 幫助租客，而非業主。", "RAP 帮助租客，而非业主。"),
      missingField: "isHomeowner",
    },
    {
      test: atMost(householdIncome, val(RAP.incomeLimit)),
      hard: true,
      passReason: tri(
        "Your household income is within the RAP limit.",
        "你的家庭收入在 RAP 上限之內。",
        "你的家庭收入在 RAP 上限之内。",
      ),
      failReason: tri(
        `RAP is for households with income of ${fmt(RAP.incomeLimit)} or less.`,
        `RAP 適用於收入 ${fmt(RAP.incomeLimit)} 或以下的家庭。`,
        `RAP 适用于收入 ${fmt(RAP.incomeLimit)} 或以下的家庭。`,
      ),
      missingField: "familyIncome",
    },
    {
      test: rentBurden,
      hard: true,
      passReason: tri(
        "You pay more than 30% of your income toward rent.",
        "你的租金超過收入的 30%。",
        "你的租金超过收入的 30%。",
      ),
      failReason: tri(
        "RAP helps families who pay more than 30% of their income toward rent.",
        "RAP 幫助租金超過收入 30% 的家庭。",
        "RAP 帮助租金超过收入 30% 的家庭。",
      ),
      missingField: "monthlyRent",
    },
    {
      test: oneOf((c) => c.employmentStatus, ["employed", "self-employed"]),
      hard: false,
      passReason: tri(
        "Some of your income comes from working, which RAP requires.",
        "你部分收入來自工作，符合 RAP 要求。",
        "你部分收入来自工作，符合 RAP 要求。",
      ),
      missingField: "employmentStatus",
    },
  ]),
  estimateAmount: (ctx) => rapEstimate(ctx),
  figures: RAP,
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through BC Housing", "透過 BC Housing 申請", "通过 BC Housing 申请"),
      description: tri(
        "Download and complete the RAP application. Include proof of income, rent, and your children.",
        "下載並填寫 RAP 申請表，附上收入、租金及子女證明。",
        "下载并填写 RAP 申请表，附上收入、租金及子女证明。",
      ),
      actionUrl:
        "https://www.bchousing.org/housing-assistance/rental-assistance-programs/RAP",
      tips: [
        tri(
          `You also need less than ${fmt(RAP.assetLimit)} in assets (savings, investments, and property; RRSPs and vehicles don't count).`,
          `你亦須擁有少於 ${fmt(RAP.assetLimit)} 的資產（儲蓄、投資及物業；RRSP 及車輛不計算在內）。`,
          `你亦须拥有少于 ${fmt(RAP.assetLimit)} 的资产（储蓄、投资及物业；RRSP 及车辆不计算在内）。`,
        ),
      ],
    },
  ],
  requiredDocuments: [
    tri("Proof of income", "收入證明", "收入证明"),
    tri("Proof of rent", "租金證明", "租金证明"),
    tri("Proof of your children", "子女證明", "子女证明"),
    tri("Proof of assets", "資產證明", "资产证明"),
    tri("Direct deposit info", "直接存款資料", "直接存款资料"),
  ],
  applicationUrl:
    "https://www.bchousing.org/housing-assistance/rental-assistance-programs/RAP",
  officialInfoUrl:
    "https://www.bchousing.org/housing-assistance/rental-assistance-programs/RAP",
  processingTime: tri("4-6 weeks", "4-6 星期", "4-6 星期"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["housing", "rent", "family", "children", "low-income", "bc", "working"],
  relatedBenefits: ["ccb", "bc-family-benefit", "bc-housing-registry"],
  lastUpdated: "2026-09-01",
};

export const bcHousingRegistry: Benefit = {
  id: "bc-housing-registry",
  name: tri(
    "BC Housing Registry (Subsidized Housing)",
    "卑詩省房屋登記處（資助房屋）",
    "不列颠哥伦比亚省房屋登记处（资助房屋）",
  ),
  shortName: "Housing Registry",
  category: "housing",
  level: "provincial-bc",
  description: tri(
    "One application that puts you on the waitlist for subsidized and social housing across many BC housing providers. Rent is usually set to about 30% of your income.",
    "一份申請即可登記於卑詩省多個房屋機構的資助及社會房屋輪候名單。租金一般約為收入的 30%。",
    "一份申请即可登记于不列颠哥伦比亚省多个房屋机构的资助及社会房屋轮候名单。租金一般约为收入的 30%。",
  ),
  estimatedValue: tri(
    "Rent geared to income (often about 30% of income) once housed",
    "獲配房屋後租金按收入計算（通常約收入的 30%）",
    "获配房屋后租金按收入计算（通常约收入的 30%）",
  ),
  contextFields: ["province", "familyIncome", "annualIncome"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "The Housing Registry is for BC residents.",
        "房屋登記處適用於卑詩省居民。",
        "房屋登记处适用于不列颠哥伦比亚省居民。",
      ),
      missingField: "province",
    },
    {
      test: atMost(householdIncome, 70000),
      hard: false,
      passReason: tri(
        "Your income is likely within the housing income limits.",
        "你的收入很可能在房屋收入上限之內。",
        "你的收入很可能在房屋收入上限之内。",
      ),
      missingField: "familyIncome",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Register with The Housing Registry", "向房屋登記處登記", "向房屋登记处登记"),
      description: tri(
        "Complete one application to join the waitlist. Update it if your situation changes so you keep your place.",
        "填寫一份申請即可加入輪候名單。情況有變時請更新，以保留你的排位。",
        "填写一份申请即可加入轮候名单。情况有变时请更新，以保留你的排位。",
      ),
      actionUrl:
        "https://www.bchousing.org/housing-assistance/rental-housing/subsidized-housing",
      tips: [
        tri(
          "Waitlists can be long. Register early even if you are not in urgent need yet.",
          "輪候名單可能很長。即使尚未急需，也請盡早登記。",
          "轮候名单可能很长。即使尚未急需，也请尽早登记。",
        ),
      ],
    },
  ],
  requiredDocuments: [
    tri("Proof of income", "收入證明", "收入证明"),
    tri("Identification", "身份證明", "身份证明"),
  ],
  applicationUrl:
    "https://www.bchousing.org/housing-assistance/rental-housing/subsidized-housing",
  officialInfoUrl:
    "https://www.bchousing.org/housing-assistance/rental-housing/subsidized-housing",
  processingTime: tri("Waitlist — varies widely", "輪候 — 時間差異很大", "轮候 — 时间差异很大"),
  paymentFrequency: tri("Ongoing (reduced rent)", "持續（減租）", "持续（减租）"),
  tags: ["housing", "subsidized", "low-income", "bc", "waitlist"],
  relatedBenefits: ["safer", "rap"],
  lastUpdated: "2026-09-01",
};

// BC Home Owner Grant -- amounts from gov.bc.ca.
// Sources (fetched 2026-09-02):
//   .../home-owner-grant          regular grant
//   .../home-owner-grant/senior   senior and disability grant
//
// The province ELIMINATED the $200 northern-and-rural supplement, and both
// pages now say so explicitly. The app still showed the old ranges,
// "$570-$770" and "$845-$1,045", whose upper bounds exist only because of
// that supplement. There is one province-wide amount for each grant now.
const BC_HOG_URL =
  "https://www2.gov.bc.ca/gov/content/taxes/property-taxes/annual-property-tax/home-owner-grant";
const BC_HOG_SENIOR_URL = `${BC_HOG_URL}/senior`;

const BC_HOG = figures({
  regularGrant: {
    current: {
      value: 570,
      from: "2027-01-01",
      source: BC_HOG_URL,
      quote:
        "Effective January 1, 2027, the regular grant amount is $570 for properties located in B.C., including properties located in northern and rural areas.",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Regular grant",
  },
  seniorGrant: {
    current: {
      value: 845,
      from: "2027-01-01",
      source: BC_HOG_SENIOR_URL,
      quote: "the total grant amount for seniors aged 65 or older is $845",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Grant for seniors and people with disabilities",
  },
});

export const bcHomeownerGrant: Benefit = {
  id: "bc-homeowner-grant",
  name: tri("BC Home Owner Grant", "卑詩省業主津貼", "不列颠哥伦比亚省业主津贴"),
  shortName: "Home Owner Grant",
  category: "housing",
  level: "provincial-bc",
  description: tri(
    "Reduces the property tax you pay on your principal home in BC. Seniors, veterans, and people with disabilities can get a larger grant.",
    "減少你在卑詩省主要住所需繳的物業稅。長者、退伍軍人及殘障人士可獲更高津貼。",
    "减少你在不列颠哥伦比亚省主要住所需缴的物业税。长者、退伍军人及残障人士可获更高津贴。",
  ),
  estimatedValue: tri(
    `${fmt(BC_HOG.regularGrant)}/year, or ${fmt(BC_HOG.seniorGrant)} for seniors and people with disabilities`,
    `每年 ${fmt(BC_HOG.regularGrant)}，長者及殘障人士 ${fmt(BC_HOG.seniorGrant)}`,
    `每年 ${fmt(BC_HOG.regularGrant)}，长者及残障人士 ${fmt(BC_HOG.seniorGrant)}`,
  ),
  figures: BC_HOG,
  contextFields: ["province", "isHomeowner", "age", "hasDisability"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "The grant is only for BC homeowners.",
        "此津貼只適用於卑詩省業主。",
        "此津贴只适用于不列颠哥伦比亚省业主。",
      ),
      missingField: "province",
    },
    {
      test: isTrue((c) => c.isHomeowner),
      hard: true,
      passReason: tri(
        "You own and live in your home.",
        "你擁有並居住於自己的住所。",
        "你拥有并居住于自己的住所。",
      ),
      failReason: tri(
        "The grant applies to a home you own and live in as your principal residence.",
        "此津貼適用於你擁有並作為主要住所的居所。",
        "此津贴适用于你拥有并作为主要住所的居所。",
      ),
      missingField: "isHomeowner",
    },
  ]),
  estimateAmount: (ctx) => {
    const senior =
      (ctx.age !== undefined && ctx.age >= 65) || ctx.hasDisability === true;
    const amount = senior ? val(BC_HOG.seniorGrant) : val(BC_HOG.regularGrant);
    return { low: amount, high: amount, period: "year" };
  },
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply every year", "每年申請", "每年申请"),
      description: tri(
        "Apply online with the Province each year when you get your property tax notice. The grant is not automatic.",
        "每年收到物業稅通知時向省政府網上申請。此津貼並非自動發放。",
        "每年收到物业税通知时向省政府网上申请。此津贴并非自动发放。",
      ),
      actionUrl:
        "https://www2.gov.bc.ca/gov/content/taxes/property-taxes/annual-property-tax/home-owner-grant/apply",
    },
  ],
  requiredDocuments: [
    tri("Property tax notice", "物業稅通知", "物业税通知"),
    tri("Your roll and jurisdiction numbers", "地段及地區編號", "地段及地区编号"),
  ],
  applicationUrl:
    "https://www2.gov.bc.ca/gov/content/taxes/property-taxes/annual-property-tax/home-owner-grant/apply",
  officialInfoUrl:
    "https://www2.gov.bc.ca/gov/content/taxes/property-taxes/annual-property-tax/home-owner-grant",
  processingTime: tri("Same day online", "網上即日", "网上即日"),
  paymentFrequency: tri("Annual property tax reduction", "每年減物業稅", "每年减物业税"),
  tags: ["housing", "homeowner", "property-tax", "seniors", "bc"],
  relatedBenefits: [],
  lastUpdated: "2026-09-01",
};

export const bcHousingBenefits: Benefit[] = [
  safer,
  rap,
  bcHousingRegistry,
  bcHomeownerGrant,
];
