import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, buildCheck, inRange, isTrue, oneOf } from "@/lib/checks";

const NL = oneOf((c: { province?: string }) => c.province, ["NL"]);
const nlFail = tri(
  "This program is for residents of Newfoundland and Labrador.",
  "此計劃適用於紐芬蘭與拉布拉多省居民。",
  "此计划适用于纽芬兰与拉布拉多省居民。",
);
const nlPass = tri(
  "You live in Newfoundland and Labrador.",
  "你居住在紐芬蘭與拉布拉多省。",
  "你居住在纽芬兰与拉布拉多省。",
);

// NL Child Benefit -- the monthly amount RISES with each child.
// Source (fetched 2026-09-02): CRA provincial programs, Newfoundland and Labrador.
// The app paid a flat $1,868/year per child, which understates every family
// with more than one child and widens with each additional one.
const NLCB_URL =
  "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-newfoundland-labrador.html";
const NLCB_RATES =
  "For July 2026 to June 2027, you may be entitled to: $157.33 per month for the first child; $166.83 per month for the second child; $179.16 per month for the third child; and $192.50 per month for each additional child.";

const NLCB = figures({
  firstChildMonthly: {
    current: { value: 157.33, from: "2026-07-01", source: NLCB_URL, quote: NLCB_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Monthly amount, first child",
  },
  secondChildMonthly: {
    current: { value: 166.83, from: "2026-07-01", source: NLCB_URL, quote: NLCB_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Monthly amount, second child",
  },
  thirdChildMonthly: {
    current: { value: 179.16, from: "2026-07-01", source: NLCB_URL, quote: NLCB_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Monthly amount, third child",
  },
  additionalChildMonthly: {
    current: { value: 192.5, from: "2026-07-01", source: NLCB_URL, quote: NLCB_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Monthly amount, each additional child",
  },
});

/** Annual total for this many children, using the escalating monthly rates. */
const nlcbAnnual = (children: number): number => {
  const monthly = [
    val(NLCB.firstChildMonthly),
    val(NLCB.secondChildMonthly),
    val(NLCB.thirdChildMonthly),
  ];
  let total = 0;
  for (let i = 0; i < children; i++) {
    total += i < monthly.length ? monthly[i] : val(NLCB.additionalChildMonthly);
  }
  return Math.round(total * 12);
};

const nlcbEstimate = (ctx: {
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;

const n = ctx.numberOfChildren ?? 1;
  const income = ctx.familyIncome;
  const max = nlcbAnnual(n);
  if (income === undefined) return { low: 0, high: max, period: "year" };
  if (income < 28990) return { low: max, high: max, period: "year" };
  return { low: 0, high: max, period: "year" };
};

export const nlChildBenefit: Benefit = {
  id: "nl-child-benefit",
  figures: NLCB,
  name: tri(
    "Newfoundland and Labrador Child Benefit",
    "紐芬蘭與拉布拉多兒童福利",
    "纽芬兰与拉布拉多儿童福利",
  ),
  shortName: "NLCB",
  category: "family",
  level: "provincial-nl",
  description: tri(
    "A tax-free monthly payment for low-income families in Newfoundland and Labrador with children under 18, paid with the Canada Child Benefit. Amounts increased sharply in 2025.",
    "為紐芬蘭與拉布拉多低收入、有 18 歲以下子女家庭提供的免稅每月款項，與加拿大兒童福利一併發放。金額於 2025 年大幅增加。",
    "为纽芬兰与拉布拉多低收入、有 18 岁以下子女家庭提供的免税每月款项，与加拿大儿童福利一并发放。金额于 2025 年大幅增加。",
  ),
  estimatedValue: tri(
    "About $1,868/year for one child, more for additional children (income under $28,990)",
    "一名子女約每年 $1,868，子女越多越高（收入低於 $28,990）",
    "一名子女约每年 $1,868，子女越多越高（收入低于 $28,990）",
  ),
  contextFields: ["province", "hasChildren", "numberOfChildren", "familyIncome"],
  prerequisites: ["ccb"],
  check: buildCheck([
    { test: NL, hard: true, passReason: nlPass, failReason: nlFail, missingField: "province" },
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
      test: atMost((c) => c.familyIncome, 28990),
      hard: true,
      passReason: tri(
        "Your income is within the range for this benefit.",
        "你的收入在此福利的範圍內。",
        "你的收入在此福利的范围内。",
      ),
      failReason: tri(
        "The NL Child Benefit is for families with income under about $28,990.",
        "紐芬蘭與拉布拉多兒童福利適用於收入約 $28,990 以下的家庭。",
        "纽芬兰与拉布拉多儿童福利适用于收入约 $28,990 以下的家庭。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: (ctx) => nlcbEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("File your taxes", "報稅", "报税"),
      description: tri(
        "No separate application. Receive the Canada Child Benefit and file taxes; the NL Child Benefit is added automatically.",
        "無需另行申請。領取加拿大兒童福利並報稅後，會自動加入紐芬蘭與拉布拉多兒童福利。",
        "无需另行申请。领取加拿大儿童福利并报税后，会自动加入纽芬兰与拉布拉多儿童福利。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-newfoundland-labrador.html",
    },
  ],
  requiredDocuments: [tri("Filed tax returns", "已報稅表", "已报税表")],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-newfoundland-labrador.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["newfoundland", "family", "children", "low-income"],
  relatedBenefits: ["ccb"],
  lastUpdated: "2026-09-01",
};

export const nlIncomeSupport: Benefit = {
  id: "nl-income-support",
  name: tri(
    "NL Income Support",
    "紐芬蘭與拉布拉多收入支援",
    "纽芬兰与拉布拉多收入支援",
  ),
  shortName: "Income Support",
  category: "income-support",
  level: "provincial-nl",
  description: tri(
    "Monthly help for people in Newfoundland and Labrador who cannot meet their basic needs, covering food, shelter, and essentials.",
    "為無法滿足基本需要的紐芬蘭與拉布拉多居民提供每月援助，涵蓋食物、住屋及必需品。",
    "为无法满足基本需要的纽芬兰与拉布拉多居民提供每月援助，涵盖食物、住房及必需品。",
  ),
  estimatedValue: tri(
    "About $561/month per adult, plus shelter and other benefits",
    "每名成人約每月 $561，另加住屋及其他福利",
    "每名成人约每月 $561，另加住房及其他福利",
  ),
  contextFields: ["province", "annualIncome"],
  check: buildCheck([
    { test: NL, hard: true, passReason: nlPass, failReason: nlFail, missingField: "province" },
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
      test: atMost((c) => c.annualIncome, 14000),
      hard: false,
      passReason: tri(
        "Your income is very low, which is the main test.",
        "你的收入極低，這是主要條件。",
        "你的收入极低，这是主要条件。",
      ),
      failReason: tri(
        "Income Support is a last resort for people with very little income and assets.",
        "收入支援是為收入及資產極少人士而設的最後保障。",
        "收入支援是为收入及资产极少人士而设的最后保障。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 561, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through the Province", "向省政府申請", "向省政府申请"),
      description: tri(
        "Apply by phone or online. Your income, assets, and household are assessed.",
        "以電話或網上申請，會評估你的收入、資產及家庭。",
        "以电话或网上申请，会评估你的收入、资产及家庭。",
      ),
      actionUrl: "https://www.gov.nl.ca/sswb/",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl: "https://www.gov.nl.ca/sswb/",
  officialInfoUrl: "https://www.gov.nl.ca/sswb/",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["newfoundland", "low-income", "assistance", "last-resort"],
  relatedBenefits: ["nl-disability-benefit"],
  lastUpdated: "2026-09-01",
};

export const nlDisabilityBenefit: Benefit = {
  id: "nl-disability-benefit",
  name: tri(
    "Newfoundland and Labrador Disability Benefit",
    "紐芬蘭與拉布拉多殘障福利",
    "纽芬兰与拉布拉多残障福利",
  ),
  shortName: "NLDB",
  category: "disability",
  level: "provincial-nl",
  description: tri(
    "A monthly income benefit for lower-income adults with a disability who are approved for the federal Disability Tax Credit. It started in July 2025.",
    "為已獲批聯邦殘疾稅務抵免的低收入殘障成人提供的每月收入福利。2025 年 7 月起實施。",
    "为已获批联邦残疾税务抵免的低收入残障成人提供的每月收入福利。2025 年 7 月起实施。",
  ),
  estimatedValue: tri(
    "Up to $400/month (stacks with the federal Canada Disability Benefit)",
    "最多每月 $400（可與聯邦加拿大殘障福利疊加）",
    "最多每月 $400（可与联邦加拿大残障福利叠加）",
  ),
  contextFields: ["province", "hasDTC", "annualIncome", "age"],
  prerequisites: ["dtc"],
  check: buildCheck([
    {
      // The source states an explicit age window that the check was missing:
      // "You are at least 18 years old and less than 65 years old".
      test: inRange((c) => c.age, 18, 64),
      hard: true,
      passReason: tri(
        "You are between 18 and 64.",
        "你介乎 18 至 64 歲。",
        "你介乎 18 至 64 岁。",
      ),
      failReason: tri(
        "This benefit is for people aged 18 to 64. At 65 the federal seniors benefits take over.",
        "此福利適用於 18 至 64 歲人士。65 歲後由聯邦長者福利接續。",
        "此福利适用于 18 至 64 岁人士。65 岁后由联邦长者福利接续。",
      ),
      missingField: "age",
    },
    { test: NL, hard: true, passReason: nlPass, failReason: nlFail, missingField: "province" },
    {
      test: isTrue((c) => c.hasDTC),
      hard: true,
      passReason: tri(
        "You are approved for the Disability Tax Credit.",
        "你已獲批殘疾稅務抵免。",
        "你已获批残疾税务抵免。",
      ),
      failReason: tri(
        "You must be approved for the federal Disability Tax Credit first.",
        "你必須先獲批聯邦殘疾稅務抵免。",
        "你必须先获批联邦残疾税务抵免。",
      ),
      missingField: "hasDTC",
    },
    {
      test: atMost((c) => c.annualIncome, 29402),
      hard: false,
      passReason: tri(
        "At your income, you may receive the full benefit.",
        "以你的收入，你或可獲全額福利。",
        "以你的收入，你或可获全额福利。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 400, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Get the DTC and file taxes", "取得 DTC 並報稅", "取得 DTC 并报税"),
      description: tri(
        "Once you have the federal Disability Tax Credit and file your taxes, you are assessed for this benefit.",
        "一旦取得聯邦殘疾稅務抵免並報稅，便會被評估此福利。",
        "一旦取得联邦残疾税务抵免并报税，便会被评估此福利。",
      ),
      actionUrl: "https://www.gov.nl.ca/sswb/newfoundland-and-labrador-disability-benefit/",
    },
  ],
  requiredDocuments: [
    tri("Approved Disability Tax Credit", "已獲批的殘疾稅務抵免", "已获批的残疾税务抵免"),
    tri("Filed tax return", "已報稅表", "已报税表"),
  ],
  applicationUrl: "https://www.gov.nl.ca/sswb/newfoundland-and-labrador-disability-benefit/",
  officialInfoUrl: "https://www.gov.nl.ca/sswb/newfoundland-and-labrador-disability-benefit/",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["newfoundland", "disability", "income", "low-income"],
  relatedBenefits: ["dtc", "cdb"],
  lastUpdated: "2026-09-01",
};

// NL Seniors' Benefit -- Budget 2026 figures. The province's own page states
// the change explicitly, so the old values are preserved as history rather
// than discarded. Source (fetched 2026-09-02).
const NL_SENIORS_URL =
  "https://www.gov.nl.ca/fin/tax-programs-incentives/personal/income-supplement/";
const NL_SENIORS_SENTENCE =
  "seniors with family net income of up to $30,409 (previously $30,078) are eligible to receive the maximum benefit of $1,882 (increased from $1,551).";

const NL_SENIORS = figures({
  maxBenefit: {
    current: { value: 1882, from: "2026-07-01", source: NL_SENIORS_URL, quote: NL_SENIORS_SENTENCE },
    history: [
      {
        value: 1551,
        from: "2025-07-01",
        to: "2026-06-30",
        source: NL_SENIORS_URL,
        quote: NL_SENIORS_SENTENCE,
      },
    ],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum annual benefit",
  },
  incomeLimit: {
    current: { value: 30409, from: "2026-07-01", source: NL_SENIORS_URL, quote: NL_SENIORS_SENTENCE },
    history: [
      {
        value: 30078,
        from: "2025-07-01",
        to: "2026-06-30",
        source: NL_SENIORS_URL,
        quote: NL_SENIORS_SENTENCE,
      },
    ],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Family net income for the maximum benefit",
  },
});

export const nlSeniorsBenefit: Benefit = {
  id: "nl-seniors-benefit",
  figures: NL_SENIORS,
  name: tri(
    "NL Seniors' Benefit",
    "紐芬蘭與拉布拉多長者福利",
    "纽芬兰与拉布拉多长者福利",
  ),
  shortName: "Seniors' Benefit",
  category: "seniors",
  level: "provincial-nl",
  description: tri(
    "A yearly payment for low-income seniors in Newfoundland and Labrador. You get it automatically by filing your taxes.",
    "為紐芬蘭與拉布拉多低收入長者提供的年度款項。報稅即自動獲得。",
    "为纽芬兰与拉布拉多低收入长者提供的年度款项。报税即自动获得。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(NL_SENIORS.maxBenefit)}/year (family income under about ${fmt(NL_SENIORS.incomeLimit)})`,
    `最多約每年 ${fmt(NL_SENIORS.maxBenefit)}（家庭收入約 ${fmt(NL_SENIORS.incomeLimit)} 以下）`,
    `最多约每年 ${fmt(NL_SENIORS.maxBenefit)}（家庭收入约 ${fmt(NL_SENIORS.incomeLimit)} 以下）`,
  ),
  contextFields: ["province", "age", "familyIncome"],
  check: buildCheck([
    { test: NL, hard: true, passReason: nlPass, failReason: nlFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 64),
      hard: true,
      passReason: tri("You are a senior.", "你是長者。", "你是长者。"),
      failReason: tri(
        "The Seniors' Benefit is for people 64 and older (couples where one is 65+).",
        "長者福利適用於 64 歲或以上人士（夫婦中一人 65 歲以上）。",
        "长者福利适用于 64 岁或以上人士（夫妇中一人 65 岁以上）。",
      ),
      missingField: "age",
    },
    {
      test: atMost((c) => c.familyIncome, val(NL_SENIORS.incomeLimit)),
      hard: true,
      passReason: tri(
        "Your family income is within the range for the maximum benefit.",
        "你的家庭收入在可獲最高福利的範圍內。",
        "你的家庭收入在可获最高福利的范围内。",
      ),
      failReason: tri(
        `The full benefit is for family income under about ${fmt(NL_SENIORS.incomeLimit)}.`,
        `全額福利適用於家庭收入約 ${fmt(NL_SENIORS.incomeLimit)} 以下。`,
        `全额福利适用于家庭收入约 ${fmt(NL_SENIORS.incomeLimit)} 以下。`,
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: val(NL_SENIORS.maxBenefit), period: "year" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Just file your taxes", "只需報稅", "只需报税"),
      description: tri(
        "There is no application. The CRA pays it automatically based on your tax return.",
        "無需申請。稅務局會按你的報稅表自動發放。",
        "无需申请。税务局会按你的报税表自动发放。",
      ),
      actionUrl: "https://www.gov.nl.ca/fin/tax-programs-incentives/personal/income-supplement/",
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  officialInfoUrl: "https://www.gov.nl.ca/fin/tax-programs-incentives/personal/income-supplement/",
  paymentFrequency: tri("Yearly (paid quarterly)", "每年（按季發放）", "每年（按季发放）"),
  tags: ["newfoundland", "seniors", "65+", "low-income"],
  relatedBenefits: ["oas", "gis", "nl-income-supplement"],
  lastUpdated: "2026-09-01",
};

// NL Income Supplement -- the amount depends on household, not a flat figure.
// The app's own copy already listed the tiers ($520 single, $589 with a
// spouse, plus $231 per child) while the estimator returned $589 to everyone.
const NLIS_URL =
  "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-newfoundland-labrador.html";
const NLIS_RATES =
  "The maximum annual payment amount is: $520 if you are a single individual $589 if you have a spouse or common-law partner plus $231 per child under 19 years of age";

const NLIS = figures({
  maxSingle: {
    current: { value: 520, from: "2026-07-01", source: NLIS_URL, quote: NLIS_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum annual amount, single",
  },
  maxCouple: {
    current: { value: 589, from: "2026-07-01", source: NLIS_URL, quote: NLIS_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum annual amount, with a spouse",
  },
  perChild: {
    current: { value: 231, from: "2026-07-01", source: NLIS_URL, quote: NLIS_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Additional amount per child under 19",
  },
});

export const nlIncomeSupplement: Benefit = {
  id: "nl-income-supplement",
  figures: NLIS,
  name: tri(
    "NL Income Supplement",
    "紐芬蘭與拉布拉多收入補助",
    "纽芬兰与拉布拉多收入补助",
  ),
  shortName: "Income Supplement",
  category: "tax-credits",
  level: "provincial-nl",
  description: tri(
    "A tax-free quarterly payment for low-income individuals, seniors, and families in Newfoundland and Labrador. You get it automatically by filing your taxes.",
    "為紐芬蘭與拉布拉多低收入個人、長者及家庭提供的免稅季度款項。報稅即自動獲得。",
    "为纽芬兰与拉布拉多低收入个人、长者及家庭提供的免税季度款项。报税即自动获得。",
  ),
  estimatedValue: tri(
    "Up to $520/year (single), $589 (couple), plus $231 per child",
    "單身最多每年 $520、夫婦 $589，另每名子女 $231",
    "单身最多每年 $520、夫妇 $589，另每名子女 $231",
  ),
  contextFields: ["province", "filedTaxes", "familyIncome"],
  check: buildCheck([
    { test: NL, hard: true, passReason: nlPass, failReason: nlFail, missingField: "province" },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: true,
      passReason: tri(
        "You file taxes, which is how this is paid.",
        "你有報稅，這是發放此款項的方式。",
        "你有报税，这是发放此款项的方式。",
      ),
      failReason: tri("You must file a tax return to receive it.", "你須報稅才能領取。", "你须报税才能领取。"),
      missingField: "filedTaxes",
    },
    {
      test: atMost((c) => c.familyIncome, 40000),
      hard: false,
      passReason: tri(
        "Your income is in the range that receives the supplement.",
        "你的收入在可獲此補助的範圍內。",
        "你的收入在可获此补助的范围内。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: (ctx) => {
    const couple =
      ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
    const kids = ctx.hasChildren === true ? Math.max(0, ctx.numberOfChildren ?? 0) : 0;
    const base = couple ? val(NLIS.maxCouple) : val(NLIS.maxSingle);
    return { low: 0, high: base + val(NLIS.perChild) * kids, period: "year" };
  },
  applicationSteps: [
    {
      order: 1,
      title: tri("Just file your taxes", "只需報稅", "只需报税"),
      description: tri(
        "There is no application. The CRA pays it automatically with the GST credit if you qualify.",
        "無需申請。如合資格，稅務局會與 GST 抵免一併自動發放。",
        "无需申请。如合资格，税务局会与 GST 抵免一并自动发放。",
      ),
      actionUrl: "https://www.gov.nl.ca/fin/tax-programs-incentives/personal/income-supplement/",
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  officialInfoUrl: "https://www.gov.nl.ca/fin/tax-programs-incentives/personal/income-supplement/",
  paymentFrequency: tri("Quarterly", "每季", "每季"),
  tags: ["newfoundland", "tax", "low-income", "seniors", "quarterly"],
  relatedBenefits: ["cgeb", "nl-seniors-benefit"],
  lastUpdated: "2026-09-01",
};

export const newfoundlandBenefits: Benefit[] = [
  nlChildBenefit,
  nlIncomeSupport,
  nlDisabilityBenefit,
  nlSeniorsBenefit,
  nlIncomeSupplement,
];
