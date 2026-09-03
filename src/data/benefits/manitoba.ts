import type { AmountEstimate, AssessmentContext, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, atMostOf, buildCheck, isFalse, isTrue, oneOf } from "@/lib/checks";

const MB = oneOf((c: { province?: string }) => c.province, ["MB"]);
const mbFail = tri(
  "This program is for residents of Manitoba.",
  "此計劃適用於緬尼托巴省居民。",
  "此计划适用于曼尼托巴省居民。",
);
const mbPass = tri("You live in Manitoba.", "你居住在緬尼托巴省。", "你居住在曼尼托巴省。");

// Manitoba Child Benefit -- exact figures from the province's own benefit table.
// Sources (fetched 2026-09-01):
//   https://www.gov.mb.ca/fs/eia/mcb.html        program page ($420 per child)
//   https://www.gov.mb.ca/fs/eia/mcb_table.html  "Benefit Levels and Allowable
//                                                 Income Ranges"
//
// Manitoba publishes ONE cutoff PER FAMILY SIZE, not a single global cutoff:
// full benefits at or below $15,000, partial benefits up to a ceiling that
// rises with the number of children ($20,435 for 1-3, $22,242 for 4, $24,052
// for 5, $25,864 for 6). This app previously applied the six-child ceiling of
// $25,864 to every family, which told a one-child family earning $24,000 that
// it qualified when the real limit is $20,435.
//
// The published table stops at six children. Larger families use the
// six-child ceiling -- the highest figure the province actually states, so the
// app never invents a number the source does not support.
const MCB_PROGRAM_URL = "https://www.gov.mb.ca/fs/eia/mcb.html";
const MCB_TABLE_URL = "https://www.gov.mb.ca/fs/eia/mcb_table.html";

const MCB = figures({
  perChild: {
    current: {
      value: 420,
      from: "2026-09-01",
      source: MCB_PROGRAM_URL,
      quote: "Low-income families may be eligible for up to $420 tax free each year for every child.",
    },
    history: [],
    verifiedAt: "2026-09-01",
    format: "currency",
    label: "Maximum per child per year",
  },
  fullBenefitIncome: {
    current: {
      value: 15000,
      from: "2026-09-01",
      source: MCB_PROGRAM_URL,
      quote: "earning $15,000 or less, this totals $1,260",
    },
    history: [],
    verifiedAt: "2026-09-01",
    format: "currency",
    label: "Income at or below which the full benefit is paid",
  },
  // Each cutoff quotes its own row of the official table, so the row's child
  // count and benefit amount disambiguate it from the other rows.
  cutoff1to3: {
    current: {
      value: 20435,
      from: "2026-09-01",
      source: MCB_TABLE_URL,
      quote: "1 $420 $15,000 $15,001 to $20,435",
    },
    history: [],
    verifiedAt: "2026-09-01",
    format: "currency",
    label: "Partial-benefit income ceiling, 1-3 children",
  },
  cutoff4: {
    current: {
      value: 22242,
      from: "2026-09-01",
      source: MCB_TABLE_URL,
      quote: "4 $1,680 $15,000 $15,001 to $22,242",
    },
    history: [],
    verifiedAt: "2026-09-01",
    format: "currency",
    label: "Partial-benefit income ceiling, 4 children",
  },
  cutoff5: {
    current: {
      value: 24052,
      from: "2026-09-01",
      source: MCB_TABLE_URL,
      quote: "5 $2,100 $15,000 $15,001 to $24,052",
    },
    history: [],
    verifiedAt: "2026-09-01",
    format: "currency",
    label: "Partial-benefit income ceiling, 5 children",
  },
  cutoff6: {
    current: {
      value: 25864,
      from: "2026-09-01",
      source: MCB_TABLE_URL,
      quote: "6 $2,520 $15,000 $15,001 to $25,864",
    },
    history: [],
    verifiedAt: "2026-09-01",
    format: "currency",
    label: "Partial-benefit income ceiling, 6 or more children",
  },
});

/** Income ceiling for a family of this size, or undefined if size is unknown. */
const mcbIncomeCeiling = (children: number | undefined): number | undefined => {
  if (children === undefined || Number.isNaN(children) || children < 1) return undefined;
  if (children <= 3) return val(MCB.cutoff1to3);
  if (children === 4) return val(MCB.cutoff4);
  if (children === 5) return val(MCB.cutoff5);
  return val(MCB.cutoff6);
};

const mcbEstimate = (ctx: AssessmentContext): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const n = ctx.numberOfChildren;
  if (n === undefined || n < 1) return undefined;

  const max = val(MCB.perChild) * n;
  if (ctx.familyIncome === undefined) return { low: 0, high: max, period: "year" };

  const ceiling = mcbIncomeCeiling(n);
  if (ceiling === undefined || ctx.familyIncome > ceiling) return undefined;

  if (ctx.familyIncome <= val(MCB.fullBenefitIncome)) {
    return { low: max, high: max, period: "year" };
  }
  return {
    low: 0,
    high: max,
    period: "year",
    note: tri(
      `Partial benefit -- your family income is above the ${fmt(MCB.fullBenefitIncome)} level at which the full amount is paid.`,
      `部分福利——你的家庭收入高於可領全額的 ${fmt(MCB.fullBenefitIncome)}。`,
      `部分福利——你的家庭收入高于可领全额的 ${fmt(MCB.fullBenefitIncome)}。`,
    ),
  };
};

export const manitobaChildBenefit: Benefit = {
  id: "manitoba-child-benefit",
  name: tri("Manitoba Child Benefit", "緬尼托巴兒童福利", "曼尼托巴儿童福利"),
  shortName: "MCB",
  category: "family",
  level: "provincial-mb",
  description: tri(
    "A tax-free yearly payment for low-income Manitoba families with children under 18 who already receive the Canada Child Benefit.",
    "為已領取加拿大兒童福利、有 18 歲以下子女的緬尼托巴低收入家庭提供的免稅年度款項。",
    "为已领取加拿大儿童福利、有 18 岁以下子女的曼尼托巴低收入家庭提供的免税年度款项。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(MCB.perChild)}/year per child`,
    `每名子女最多每年 ${fmt(MCB.perChild)}`,
    `每名子女最多每年 ${fmt(MCB.perChild)}`,
  ),
  figures: MCB,
  contextFields: ["province", "hasChildren", "numberOfChildren", "familyIncome"],
  prerequisites: ["ccb"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: tri("You have children under 18.", "你有 18 歲以下的子女。", "你有 18 岁以下的子女。"),
      failReason: tri(
        "This benefit is for families with a child under 18.",
        "此福利適用於有 18 歲以下子女的家庭。",
        "此福利适用于有 18 岁以下子女的家庭。",
      ),
      missingField: "hasChildren",
    },
    {
      // The ceiling depends on family size, so the rule reads it from context
      // rather than applying one tier's number to everybody.
      test: atMostOf((c) => c.familyIncome, (c) => mcbIncomeCeiling(c.numberOfChildren)),
      hard: true,
      passReason: tri(
        "Your family income is within the Manitoba Child Benefit limit for your family size.",
        "你的家庭收入在你家庭人數對應的緬尼托巴兒童福利上限之內。",
        "你的家庭收入在你家庭人数对应的曼尼托巴儿童福利上限之内。",
      ),
      failReason: tri(
        `The income limit depends on family size -- from ${fmt(MCB.cutoff1to3)} for one to three children up to ${fmt(MCB.cutoff6)} for six. Your family income is above the limit for your family size.`,
        `收入上限視家庭人數而定——一至三名子女為 ${fmt(MCB.cutoff1to3)}，六名子女為 ${fmt(MCB.cutoff6)}。你的家庭收入超出你家庭人數對應的上限。`,
        `收入上限视家庭人数而定——一至三名子女为 ${fmt(MCB.cutoff1to3)}，六名子女为 ${fmt(MCB.cutoff6)}。你的家庭收入超出你家庭人数对应的上限。`,
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: mcbEstimate,
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply to the Manitoba Child Benefit", "申請緬尼托巴兒童福利", "申请曼尼托巴儿童福利"),
      description: tri(
        "Complete the application form. You must already receive the Canada Child Benefit.",
        "填寫申請表。你必須已領取加拿大兒童福利。",
        "填写申请表。你必须已领取加拿大儿童福利。",
      ),
      actionUrl: MCB_PROGRAM_URL,
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  applicationUrl: MCB_PROGRAM_URL,
  officialInfoUrl: MCB_PROGRAM_URL,
  paymentFrequency: tri("Yearly", "每年", "每年"),
  tags: ["manitoba", "family", "children", "low-income"],
  relatedBenefits: ["ccb"],
  lastUpdated: "2026-09-01",
};

// Rent Assist (Non-EIA) -- exact 2025-26 formula.
// Source: Province of Manitoba, "Rent Assist for Manitobans Not Receiving EIA"
// https://www.gov.mb.ca/fs/eia/non_rentassist_facts.html and the official
// online estimator https://www.gov.mb.ca/fs/eia/estimator.html (fetched
// 2026-09-01). Both state: "Benefits are calculated based on the difference
// between 80% of Median Market Rent and 30% of net household income."
// Notably the official estimator itself does NOT ask for actual rent -- only
// household size, income, and 55+/disability status -- so this mirrors that
// and does not use monthlyRent.
//
// The 80%-of-MMR maximum monthly benefit for each household size is not
// published directly, but the site publishes the annual net-income cutoff
// where the benefit reaches $0 (2025-26 figures below). Since the benefit is
// 0 exactly when 0.3 * (income / 12) equals 0.8 * MMR (the max benefit), the
// max benefit for each tier equals 0.3 * cutoff / 12 -- derived directly
// from the official cutoffs, not estimated separately.
const MB_RENT_ASSIST_TIERS: { maxHouseholdSize: number; cutoffAnnual: number }[] = [
  { maxHouseholdSize: 1, cutoffAnnual: 29120 }, // single, under 55, no DTC
  { maxHouseholdSize: 2, cutoffAnnual: 38720 }, // 2 people
  { maxHouseholdSize: 4, cutoffAnnual: 50240 }, // 3-4 people
  { maxHouseholdSize: Infinity, cutoffAnnual: 60768 }, // 5+ people
];
const MB_RENT_ASSIST_SINGLE_55_OR_DTC_CUTOFF = 33920; // single, 55+ or claims DTC/CPPD

const rentAssistEstimate = (ctx: {
  maritalStatus?: string;
  numberOfChildren?: number;
  hasChildren?: boolean;
  annualIncome?: number;
  familyIncome?: number;
  age?: number;
  hasDTC?: boolean;
}): AmountEstimate | undefined => {
  const hasSpouse =
    ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
  const children = ctx.numberOfChildren ?? (ctx.hasChildren ? 1 : 0);
  const householdSize = 1 + (hasSpouse ? 1 : 0) + children;

  const isSeniorOrDtc = (ctx.age !== undefined && ctx.age >= 55) || ctx.hasDTC === true;
  const cutoffAnnual =
    householdSize === 1 && isSeniorOrDtc
      ? MB_RENT_ASSIST_SINGLE_55_OR_DTC_CUTOFF
      : children > 0
        ? // Manitoba states a separate, higher cutoff for households WITH
          // dependent children: "have dependent children in your home and have
          // a net annual income of less than $50,240 for two to four people, or
          // $60,768 for five or more people". Using the childless table meant a
          // single parent with one child was measured against $38,720 instead
          // of $50,240 -- wrongly excluded at incomes in between.
          householdSize >= 5
          ? 60768
          : 50240
        : (MB_RENT_ASSIST_TIERS.find((t) => householdSize <= t.maxHouseholdSize) ??
            MB_RENT_ASSIST_TIERS[MB_RENT_ASSIST_TIERS.length - 1]).cutoffAnnual;
  const maxBenefit = Math.round((0.3 * cutoffAnnual) / 12);

  // The estimator asks for "net annual income"; AssessmentContext only has
  // pre-tax income, so this is used as the closest available approximation.
  const income = hasSpouse ? (ctx.familyIncome ?? ctx.annualIncome) : ctx.annualIncome;
  if (income === undefined) return { low: 0, high: maxBenefit, period: "month" };

  const monthly = Math.max(0, Math.round(maxBenefit - (0.3 * income) / 12));
  return {
    low: monthly,
    high: monthly,
    period: "month",
    note: tri(
      "Calculated as 80% of median market rent minus 30% of your income, using the official Manitoba Rent Assist formula. Uses your before-tax income as an approximation for net income.",
      "根據緬尼托巴租金援助的官方公式計算：市場租金中位數的 80% 減去你收入的 30%。以稅前收入近似淨收入。",
      "根据曼尼托巴租金援助的官方公式计算：市场租金中位数的 80% 减去你收入的 30%。以税前收入近似净收入。",
    ),
  };
};

export const manitobaRentAssist: Benefit = {
  id: "manitoba-rent-assist",
  name: tri("Rent Assist (Manitoba)", "租金援助（緬尼托巴）", "租金援助（曼尼托巴）"),
  shortName: "Rent Assist",
  category: "housing",
  level: "provincial-mb",
  description: tri(
    "A monthly shelter benefit that helps low-income Manitobans who rent in the private market afford their rent.",
    "為在私人市場租住的緬尼托巴低收入居民提供的每月住屋援助。",
    "为在私人市场租住的曼尼托巴低收入居民提供的每月住房援助。",
  ),
  estimatedValue: tri(
    "Based on 80% of median market rent minus 30% of your income",
    "以市場租金中位數的 80% 減去你收入的 30% 計算",
    "以市场租金中位数的 80% 减去你收入的 30% 计算",
  ),
  contextFields: ["province", "isHomeowner", "annualIncome"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
    {
      test: isFalse((c) => c.isHomeowner),
      hard: true,
      passReason: tri("You rent your home.", "你租住居所。", "你租住居所。"),
      failReason: tri("Rent Assist helps renters, not homeowners.", "租金援助幫助租客，而非業主。", "租金援助帮助租客，而非业主。"),
      missingField: "isHomeowner",
    },
    {
      test: atMost((c) => c.annualIncome, 40000),
      hard: true,
      passReason: tri(
        "Your income is in the low range Rent Assist is for.",
        "你的收入屬租金援助針對的低收入範圍。",
        "你的收入属租金援助针对的低收入范围。",
      ),
      failReason: tri(
        "Rent Assist is for lower-income renters.",
        "租金援助適用於較低收入的租客。",
        "租金援助适用于较低收入的租客。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: (ctx) => rentAssistEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through the Province", "向省政府申請", "向省政府申请"),
      description: tri(
        "Apply for Rent Assist online or on paper. If you receive Employment and Income Assistance, it is included automatically.",
        "網上或紙本申請租金援助。如你領取就業及收入援助，會自動包括在內。",
        "网上或纸本申请租金援助。如你领取就业及收入援助，会自动包括在内。",
      ),
      actionUrl: "https://www.gov.mb.ca/fs/eia/rent_assist.html",
    },
  ],
  requiredDocuments: [
    tri("Proof of rent and income", "租金及收入證明", "租金及收入证明"),
  ],
  applicationUrl: "https://www.gov.mb.ca/fs/eia/rent_assist.html",
  officialInfoUrl: "https://www.gov.mb.ca/fs/eia/rent_assist.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["manitoba", "housing", "rent", "low-income"],
  relatedBenefits: ["manitoba-eia"],
  lastUpdated: "2026-09-01",
};

// 55 PLUS -- income limits differ for singles and couples.
// Source (fetched 2026-09-02): https://www.gov.mb.ca/fs/eia/55plus.html
// The app used a flat $20,000 for everyone, which appears nowhere on the page.
// That OVER-promised: a single person on $15,000 was told they qualified when
// Manitoba's limit for a single person is $9,746.40.
const MB55_URL = "https://www.gov.mb.ca/fs/eia/55plus.html";
const MB55_LIMITS =
  "Partial benefits are available to single people with an annual income up to $9,746.40 and couples with an annual family income up to $16,255.20.";

const MB55 = figures({
  incomeLimitSingle: {
    current: { value: 9746.4, from: "2026-01-01", source: MB55_URL, quote: MB55_LIMITS },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Income limit, single person",
  },
  incomeLimitCouple: {
    current: { value: 16255.2, from: "2026-01-01", source: MB55_URL, quote: MB55_LIMITS },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Combined income limit, couple",
  },
  quarterlySingle: {
    current: {
      value: 161.8,
      from: "2026-01-01",
      source: MB55_URL,
      quote:
        "Maximum quarterly benefits (every three months) have increased to $161.80 for a single person and $173.90 to each eligible person in a married or common law relationship.",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Maximum quarterly benefit, single person",
  },
});

/** Manitoba measures a couple's combined income against a higher limit. */
const mb55IsCouple = (c: { maritalStatus?: string }) =>
  c.maritalStatus === "married" || c.maritalStatus === "common-law";

/**
 * Income limit for 55 PLUS, or undefined when Manitoba publishes none.
 *
 * The province runs TWO components. The Junior Component states figures
 * ($9,746.40 single, $16,255.20 couple). The Senior Component states none at
 * all — benefits there are "based on family composition, net family income and
 * the type and level of benefits you receive under the federal Old Age
 * Security program". Applying the Junior figures to someone on OAS was wrong,
 * and produced a false "ineligible" for a 67-year-old on $16,000.
 *
 * So: the published limits apply below 65, and above it there is no figure to
 * apply rather than a figure to invent.
 */
const mb55IncomeCeiling = (c: {
  age?: number;
  maritalStatus?: string;
}): number | undefined => {
  if (c.age !== undefined && c.age >= 65) return undefined;
  return mb55IsCouple(c) ? val(MB55.incomeLimitCouple) : val(MB55.incomeLimitSingle);
};

export const manitoba55Plus: Benefit = {
  id: "manitoba-55-plus",
  figures: MB55,
  name: tri("55 PLUS (Manitoba Income Supplement)", "55 PLUS（緬尼托巴收入補助）", "55 PLUS（曼尼托巴收入补助）"),
  shortName: "55 PLUS",
  category: "seniors",
  level: "provincial-mb",
  description: tri(
    "A quarterly payment for lower-income Manitobans aged 55 and older whose income is within program limits.",
    "為 55 歲或以上、收入在計劃上限內的緬尼托巴低收入居民提供的季度款項。",
    "为 55 岁或以上、收入在计划上限内的曼尼托巴低收入居民提供的季度款项。",
  ),
  estimatedValue: tri(
    "Up to about $647/year for a single person (paid quarterly)",
    "單身人士最多約每年 $647（每季發放）",
    "单身人士最多约每年 $647（每季发放）",
  ),
  contextFields: ["province", "age", "annualIncome"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 55),
      hard: true,
      passReason: tri("You are 55 or older.", "你已年滿 55 歲。", "你已年满 55 岁。"),
      failReason: tri(
        "55 PLUS is for Manitobans aged 55 and older.",
        "55 PLUS 適用於 55 歲或以上的緬尼托巴居民。",
        "55 PLUS 适用于 55 岁或以上的曼尼托巴居民。",
      ),
      missingField: "age",
    },
    {
      // Soft, on Manitoba's own advice: "If your income is slightly above the
      // maximum, you are encouraged to apply anyway as there are some
      // allowable deductions from gross income." A hard gate would turn away
      // people the province is actively inviting to apply.
      test: atMostOf(
        (c) => (mb55IsCouple(c) ? c.familyIncome ?? c.annualIncome : c.annualIncome),
        mb55IncomeCeiling,
      ),
      hard: false,
      passReason: tri(
        "Your income is within the program limit.",
        "你的收入在計劃上限之內。",
        "你的收入在计划上限之内。",
      ),
      failReason: tri(
        "55 PLUS is income-tested and aimed at lower-income residents.",
        "55 PLUS 按收入審查，面向較低收入居民。",
        "55 PLUS 按收入审查，面向较低收入居民。",
      ),
      missingField: "annualIncome",
    },
  ]),
  // Four quarterly payments a year.
  estimateAmount: () => ({
    low: 0,
    high: Math.round(val(MB55.quarterlySingle) * 4),
    period: "year",
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply once", "申請一次", "申请一次"),
      description: tri(
        "Submit the 55 PLUS application. Eligibility is based on last year's tax return.",
        "提交 55 PLUS 申請。資格按去年的報稅表釐定。",
        "提交 55 PLUS 申请。资格按去年的报税表厘定。",
      ),
      actionUrl: "https://www.gov.mb.ca/fs/eia/55plus.html",
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  applicationUrl: "https://www.gov.mb.ca/fs/eia/55plus.html",
  officialInfoUrl: "https://www.gov.mb.ca/fs/eia/55plus.html",
  paymentFrequency: tri("Quarterly", "每季", "每季"),
  tags: ["manitoba", "seniors", "55+", "low-income"],
  relatedBenefits: ["gis", "oas"],
  lastUpdated: "2026-09-01",
};

export const manitobaEia: Benefit = {
  id: "manitoba-eia",
  name: tri(
    "Employment and Income Assistance (EIA)",
    "就業及收入援助 (EIA)",
    "就业及收入援助 (EIA)",
  ),
  shortName: "EIA",
  category: "income-support",
  level: "provincial-mb",
  description: tri(
    "Monthly financial help for Manitobans who cannot meet their basic needs, including a separate rate for people with a disability, plus health benefits.",
    "為無法滿足基本需要的緬尼托巴居民提供每月援助，包括殘障人士的獨立標準及健康福利。",
    "为无法满足基本需要的曼尼托巴居民提供每月援助，包括残障人士的独立标准及健康福利。",
  ),
  estimatedValue: tri(
    "Covers basic needs and shelter, plus health benefits",
    "涵蓋基本需要及住屋，並附健康福利",
    "涵盖基本需要及住房，并附健康福利",
  ),
  contextFields: ["province", "annualIncome"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
    {
      // Needs-tested, not income-capped. No province publishes a flat annual
      // income cutoff for social assistance -- eligibility is a household needs
      // and asset assessment, and benefits reduce against other income rather
      // than stopping at a line. This app carried an invented $12,000 cutoff on
      // EVERY province's program (verified absent from the NS, PEI and NL
      // sources by three separate reviews), as a HARD rule, which returned
      // "ineligible" to the people these programs exist for.
      //
      // Kept as a SOFT signal: it still tells someone their income looks high
      // for a last-resort program, but it no longer shuts the door on them.
      test: atMost((c) => c.annualIncome, 12000),
      hard: false,
      passReason: tri(
        "Your income is very low, which is the main test.",
        "你的收入極低，這是主要條件。",
        "你的收入极低，这是主要条件。",
      ),
      failReason: tri(
        "EIA is a last resort for people with very little income and assets.",
        "EIA 是為收入及資產極少人士而設的最後保障。",
        "EIA 是为收入及资产极少人士而设的最后保障。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 900, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through the Province", "向省政府申請", "向省政府申请"),
      description: tri(
        "Apply online or by phone. Your income, assets, and household are assessed.",
        "網上或電話申請，會評估你的收入、資產及家庭。",
        "网上或电话申请，会评估你的收入、资产及家庭。",
      ),
      actionUrl: "https://www.gov.mb.ca/fs/eia/",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl: "https://www.gov.mb.ca/fs/eia/",
  officialInfoUrl: "https://www.gov.mb.ca/fs/eia/",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["manitoba", "low-income", "assistance", "disability"],
  relatedBenefits: ["manitoba-rent-assist"],
  lastUpdated: "2026-09-01",
};

export const manitobaPharmacare: Benefit = {
  id: "manitoba-pharmacare",
  name: tri("Manitoba Pharmacare", "緬尼托巴藥物保障", "曼尼托巴药物保障"),
  shortName: "Pharmacare",
  category: "health",
  level: "provincial-mb",
  description: tri(
    "A drug benefit for Manitobans based on income. After you reach an income-based deductible, Pharmacare pays for eligible prescription drugs.",
    "按收入計算的緬尼托巴藥物福利。達到按收入釐定的自付額後，藥物保障支付合資格處方藥。",
    "按收入计算的曼尼托巴药物福利。达到按收入厘定的自付额后，药物保障支付合资格处方药。",
  ),
  estimatedValue: tri(
    "Prescription drug coverage above an income-based deductible",
    "超過按收入計算的自付額後的處方藥保障",
    "超过按收入计算的自付额后的处方药保障",
  ),
  contextFields: ["province", "familyIncome"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Register each year", "每年登記", "每年登记"),
      description: tri(
        "Register for Manitoba Pharmacare online or on paper. Your deductible is set by your family income.",
        "網上或紙本登記緬尼托巴藥物保障。自付額按你的家庭收入釐定。",
        "网上或纸本登记曼尼托巴药物保障。自付额按你的家庭收入厘定。",
      ),
      actionUrl: "https://www.gov.mb.ca/health/pharmacare/",
    },
  ],
  requiredDocuments: [
    tri("Manitoba Health registration and income details", "緬尼托巴健康登記及收入資料", "曼尼托巴健康登记及收入资料"),
  ],
  applicationUrl: "https://www.gov.mb.ca/health/pharmacare/",
  officialInfoUrl: "https://www.gov.mb.ca/health/pharmacare/",
  paymentFrequency: tri("Ongoing coverage", "持續保障", "持续保障"),
  tags: ["manitoba", "health", "drugs", "prescriptions"],
  relatedBenefits: [],
  lastUpdated: "2026-09-01",
};

// ---------------------------------------------------------------------------
// Manitoba's two affordability tax credits, added 2026-09-02. Between them they
// reach essentially every Manitoba household: one for owners, one for renters,
// with NO income test on either base credit. That breadth is why they were
// picked ahead of narrower programs like the Seniors' School Tax Rebate.
// ---------------------------------------------------------------------------

const MB_HATC_URL = "https://www.gov.mb.ca/finance/tao/hatc.html";

const MB_HATC = figures({
  maxCredit: {
    current: {
      value: 1600,
      from: "2026-01-01",
      source: MB_HATC_URL,
      quote:
        "For 2026, the amount of the HATC is the lesser of $1,600 and the gross school taxes on your principal residence.",
    },
    history: [
      {
        value: 1500,
        from: "2025-01-01",
        to: "2025-12-31",
        source: "https://www.gov.mb.ca/finance/personal/pcredits.html",
        quote: "Claims made for the 2025 tax year may receive up to $1,500.",
      },
    ],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum credit",
  },
});

export const manitobaHomeownersAffordability: Benefit = {
  id: "manitoba-homeowners-affordability",
  name: tri(
    "Homeowners Affordability Tax Credit",
    "屋主可負擔稅務抵免",
    "房主可负担税务抵免",
  ),
  shortName: "HATC",
  category: "tax-credits",
  level: "provincial-mb",
  description: tri(
    "Takes up to $1,600 off the school taxes on your principal residence. There is no income test — almost every Manitoba homeowner qualifies.",
    "為主要居所的教育稅提供最多 $1,600 減免。不設收入審查，幾乎所有緬尼托巴業主均符合資格。",
    "为主要居所的教育税提供最多 $1,600 减免。不设收入审查，几乎所有曼尼托巴业主均符合资格。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(MB_HATC.maxCredit)}/year off your school taxes`,
    `教育稅每年最多減免 ${fmt(MB_HATC.maxCredit)}`,
    `教育税每年最多减免 ${fmt(MB_HATC.maxCredit)}`,
  ),
  figures: MB_HATC,
  contextFields: ["province", "isHomeowner"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
    {
      test: isTrue((c) => c.isHomeowner),
      hard: true,
      passReason: tri(
        "You own your home, and there is no income test for this credit.",
        "你擁有自住物業，此抵免不設收入審查。",
        "你拥有自住物业，此抵免不设收入审查。",
      ),
      failReason: tri(
        "This credit is for homeowners. Renters get the Renters Affordability Tax Credit instead.",
        "此抵免適用於業主。租戶可申請「租戶可負擔稅務抵免」。",
        "此抵免适用于业主。租户可申请「租户可负担税务抵免」。",
      ),
      missingField: "isHomeowner",
    },
  ]),
  // The credit is the LESSER of the maximum and your actual school taxes, and
  // the app does not know a household's school taxes, so this is a ceiling.
  estimateAmount: () => ({
    low: 0,
    high: val(MB_HATC.maxCredit),
    period: "year",
    note: tri(
      "You get the lesser of this and your actual school taxes.",
      "實際金額為此上限與你實付教育稅兩者中的較低者。",
      "实际金额为此上限与你实付教育税两者中的较低者。",
    ),
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Claim it on your property tax bill or tax return", "在物業稅單或報稅表上申領", "在物业税单或报税表上申领"),
      description: tri(
        "Most homeowners receive it automatically as a reduction on the municipal property tax bill for their principal residence.",
        "大多數業主會在主要居所的市政物業稅單上自動獲得減免。",
        "大多数业主会在主要居所的市政物业税单上自动获得减免。",
      ),
      actionUrl: MB_HATC_URL,
    },
  ],
  requiredDocuments: [tri("Property tax statement", "物業稅單", "物业税单")],
  officialInfoUrl: MB_HATC_URL,
  paymentFrequency: tri("Yearly", "每年", "每年"),
  tags: ["manitoba", "tax-credit", "homeowner", "property-tax", "broad"],
  relatedBenefits: ["manitoba-renters-affordability"],
  lastUpdated: "2026-09-02",
};

const MB_RENTERS_URL = "https://www.gov.mb.ca/finance/personal/pcredits.html";

const MB_RENTERS = figures({
  maxCredit: {
    current: {
      value: 625,
      from: "2026-01-01",
      source: MB_RENTERS_URL,
      quote:
        "For the 2026 tax year, an increased Renters Affordability Tax Credit of up to $625 will be provided, and the seniors top-up will be increased to a maximum of $357.",
    },
    history: [
      {
        value: 525,
        from: "2024-01-01",
        to: "2025-12-31",
        source: MB_RENTERS_URL,
        quote:
          "The Renters Affordability Tax Credit provides savings of up to $525 a year to Manitobans who rent their principal residence.",
      },
    ],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum base credit",
  },
  seniorTopUp: {
    current: {
      value: 357,
      from: "2026-01-01",
      source: MB_RENTERS_URL,
      quote:
        "For the 2026 tax year, an increased Renters Affordability Tax Credit of up to $625 will be provided, and the seniors top-up will be increased to a maximum of $357.",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum senior top-up",
  },
});

export const manitobaRentersAffordability: Benefit = {
  id: "manitoba-renters-affordability",
  name: tri(
    "Renters Affordability Tax Credit",
    "租戶可負擔稅務抵免",
    "租户可负担税务抵免",
  ),
  shortName: "RATC",
  category: "tax-credits",
  level: "provincial-mb",
  description: tri(
    "A yearly tax credit for anyone who rents their principal residence in Manitoba, with an extra top-up for seniors. There is no income test on the base credit.",
    "為在緬尼托巴租住主要居所的人士提供的年度稅務抵免，長者另有額外補助。基本抵免不設收入審查。",
    "为在曼尼托巴租住主要居所的人士提供的年度税务抵免，长者另有额外补助。基本抵免不设收入审查。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(MB_RENTERS.maxCredit)}/year, plus up to ${fmt(MB_RENTERS.seniorTopUp)} more for seniors`,
    `每年最多 ${fmt(MB_RENTERS.maxCredit)}，長者另加最多 ${fmt(MB_RENTERS.seniorTopUp)}`,
    `每年最多 ${fmt(MB_RENTERS.maxCredit)}，长者另加最多 ${fmt(MB_RENTERS.seniorTopUp)}`,
  ),
  figures: MB_RENTERS,
  contextFields: ["province", "isHomeowner", "age"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
    {
      test: isFalse((c) => c.isHomeowner),
      hard: true,
      passReason: tri(
        "You rent your home, and there is no income test for the base credit.",
        "你租住居所，基本抵免不設收入審查。",
        "你租住居所，基本抵免不设收入审查。",
      ),
      failReason: tri(
        "This credit is for renters. Homeowners get the Homeowners Affordability Tax Credit instead.",
        "此抵免適用於租戶。業主可申請「屋主可負擔稅務抵免」。",
        "此抵免适用于租户。业主可申请「屋主可负担税务抵免」。",
      ),
      missingField: "isHomeowner",
    },
  ]),
  estimateAmount: (ctx) => {
    const senior = ctx.age !== undefined && ctx.age >= 65;
    const high = val(MB_RENTERS.maxCredit) + (senior ? val(MB_RENTERS.seniorTopUp) : 0);
    return {
      low: 0,
      high,
      period: "year",
      note: tri(
        "Prorated by how many months you rented during the year.",
        "按你年內租住的月數按比例計算。",
        "按你年内租住的月数按比例计算。",
      ),
    };
  },
  applicationSteps: [
    {
      order: 1,
      title: tri("Claim it on your Manitoba tax return", "報緬尼托巴稅表時申領", "报曼尼托巴税表时申领"),
      description: tri(
        "Enter the months you rented your principal residence on your provincial return.",
        "在省級報稅表上填報你租住主要居所的月數。",
        "在省级报税表上填报你租住主要居所的月数。",
      ),
      actionUrl: MB_RENTERS_URL,
    },
  ],
  requiredDocuments: [tri("Rent receipts or lease", "租金收據或租約", "租金收据或租约")],
  officialInfoUrl: MB_RENTERS_URL,
  paymentFrequency: tri("Yearly, at tax time", "每年報稅時", "每年报税时"),
  tags: ["manitoba", "tax-credit", "renter", "housing", "broad"],
  relatedBenefits: ["manitoba-homeowners-affordability", "manitoba-rent-assist"],
  lastUpdated: "2026-09-02",
};

export const manitobaBenefits: Benefit[] = [
  manitobaChildBenefit,
  manitobaRentAssist,
  manitoba55Plus,
  manitobaEia,
  manitobaPharmacare,
  manitobaHomeownersAffordability,
  manitobaRentersAffordability,
];
