import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, atMostOf, buildCheck, inRange, isTrue, oneOf } from "@/lib/checks";

const AB = oneOf((c: { province?: string }) => c.province, ["AB"]);
const abFail = tri(
  "This program is for residents of Alberta.",
  "此計劃適用於亞伯達省居民。",
  "此计划适用于阿尔伯塔省居民。",
);
const abPass = tri("You live in Alberta.", "你居住在亞伯達省。", "你居住在阿尔伯塔省。");

const acfbEstimate = (ctx: {
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const n = Math.min(ctx.numberOfChildren ?? 1, 4);
  const base = 1499 + 749 * (n - 1);
  const income = ctx.familyIncome;
  if (income === undefined) return { low: 0, high: base, period: "year" };
  const over = Math.max(0, income - 27565);
  const amount = Math.max(0, Math.round(base - over * 0.08));
  return {
    low: amount,
    high: amount,
    period: "year",
    note: tri(
      "Base component estimate; a working-income component may add more.",
      "基本部分估算；工作收入部分或會增加金額。",
      "基本部分估算；工作收入部分或会增加金额。",
    ),
  };
};

export const aish: Benefit = {
  id: "aish",
  name: tri(
    "Assured Income for the Severely Handicapped (AISH)",
    "嚴重殘障保障收入 (AISH)",
    "严重残障保障收入 (AISH)",
  ),
  shortName: "AISH",
  category: "disability",
  level: "provincial-ab",
  description: tri(
    "Monthly income, plus health and other benefits, for Alberta adults with a permanent disability that seriously limits their ability to earn a living.",
    "為永久殘障且嚴重限制謀生能力的亞伯達成人提供每月收入，並附健康及其他福利。",
    "为永久残障且严重限制谋生能力的阿尔伯塔成人提供每月收入，并附健康及其他福利。",
  ),
  estimatedValue: tri(
    "Up to about $1,863/month, plus health, dental, and other benefits",
    "最多約每月 $1,863，另加健康、牙科及其他福利",
    "最多约每月 $1,863，另加健康、牙科及其他福利",
  ),
  contextFields: ["province", "age", "hasSevereDisability"],
  check: buildCheck([
    { test: AB, hard: true, passReason: abPass, failReason: abFail, missingField: "province" },
    {
      test: inRange((c) => c.age, 18, 64),
      hard: true,
      passReason: tri("You are an adult under 65.", "你是未滿 65 歲的成人。", "你是未满 65 岁的成人。"),
      failReason: tri(
        "AISH is for adults 18 to 64 (at 65 you move to OAS/GIS).",
        "AISH 適用於 18 至 64 歲成人（65 歲轉至 OAS／GIS）。",
        "AISH 适用于 18 至 64 岁成人（65 岁转至 OAS／GIS）。",
      ),
      missingField: "age",
    },
    {
      test: isTrue((c) => c.hasSevereDisability),
      hard: true,
      passReason: tri(
        "Your permanent disability may seriously limit your ability to earn a living.",
        "你的永久殘障或嚴重限制你的謀生能力。",
        "你的永久残障或严重限制你的谋生能力。",
      ),
      failReason: tri(
        "AISH requires a permanent medical condition that substantially limits your ability to earn a living.",
        "AISH 要求永久且嚴重限制謀生能力的醫療狀況。",
        "AISH 要求永久且严重限制谋生能力的医疗状况。",
      ),
      missingField: "hasSevereDisability",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 1863, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through Alberta Supports", "透過 Alberta Supports 申請", "通过 Alberta Supports 申请"),
      description: tri(
        "Complete the AISH application, including a medical report from your doctor about your condition.",
        "填寫 AISH 申請，包括醫生有關你狀況的醫療報告。",
        "填写 AISH 申请，包括医生有关你状况的医疗报告。",
      ),
      actionUrl: "https://www.alberta.ca/aish",
    },
  ],
  requiredDocuments: [
    tri("Medical report from your doctor", "醫生的醫療報告", "医生的医疗报告"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl: "https://www.alberta.ca/aish",
  officialInfoUrl: "https://www.alberta.ca/aish",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["alberta", "disability", "income", "assistance"],
  relatedBenefits: ["dtc", "cdb"],
  lastUpdated: "2026-09-01",
};

// Alberta Seniors Benefit -- thresholds and maximum from alberta.ca.
// Source (fetched 2026-09-02): https://www.alberta.ca/alberta-seniors-benefit
//
// Alberta publishes a DIFFERENT income threshold for singles and couples. The
// app applied one figure ($33,410) to everybody, so a senior couple with a
// combined income of, say, $45,000 was told they did not qualify when the
// province's couple threshold is $53,800. Under-promising excludes people who
// should apply, which is the worse direction of this error.
const ASB_URL = "https://www.alberta.ca/alberta-seniors-benefit";
const ASB_THRESHOLD_SENTENCE =
  "a single senior with an annual income of $32,690 or less, and senior couples with a combined annual income of $53,800 or less, may be eligible for a benefit";

const ASB = figures({
  incomeThresholdSingle: {
    current: { value: 32690, from: "2026-07-01", source: ASB_URL, quote: ASB_THRESHOLD_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income guideline, single senior",
  },
  incomeThresholdCouple: {
    current: { value: 53800, from: "2026-07-01", source: ASB_URL, quote: ASB_THRESHOLD_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income guideline, senior couple",
  },
  maxAnnualSingle: {
    current: {
      value: 3946,
      from: "2026-07-01",
      source: ASB_URL,
      quote: "Homeowner, renter, lodge resident $3,946",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum annual benefit, single homeowner/renter/lodge resident",
  },
});

/** Alberta counts a couple's combined income against a higher threshold. */
const asbIsCouple = (c: { maritalStatus?: string }) =>
  c.maritalStatus === "married" || c.maritalStatus === "common-law";

export const albertaSeniorsBenefit: Benefit = {
  id: "alberta-seniors-benefit",
  name: tri("Alberta Seniors Benefit", "亞伯達長者福利", "阿尔伯塔长者福利"),
  shortName: "ASB",
  category: "seniors",
  level: "provincial-ab",
  description: tri(
    "A monthly payment for lower-income Alberta seniors who receive Old Age Security, on top of federal OAS and GIS.",
    "為領取老年保障金的低收入亞伯達長者，在聯邦 OAS 及 GIS 之上提供每月款項。",
    "为领取老年保障金的低收入阿尔伯塔长者，在联邦 OAS 及 GIS 之上提供每月款项。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(ASB.maxAnnualSingle)}/year for a single senior (varies by living situation)`,
    `單身長者最多每年 ${fmt(ASB.maxAnnualSingle)}（視居住情況而定）`,
    `单身长者最多每年 ${fmt(ASB.maxAnnualSingle)}（视居住情况而定）`,
  ),
  figures: ASB,
  contextFields: ["province", "age", "annualIncome", "familyIncome", "maritalStatus"],
  prerequisites: ["oas"],
  check: buildCheck([
    { test: AB, hard: true, passReason: abPass, failReason: abFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 65),
      hard: true,
      passReason: tri("You are 65 or older.", "你已年滿 65 歲。", "你已年满 65 岁。"),
      failReason: tri(
        "The Alberta Seniors Benefit is for OAS recipients aged 65+.",
        "亞伯達長者福利適用於 65 歲以上的 OAS 領取者。",
        "阿尔伯塔长者福利适用于 65 岁以上的 OAS 领取者。",
      ),
      missingField: "age",
    },
    {
      // A couple's combined income is compared against the couple threshold,
      // not the single one.
      test: atMostOf(
        (c) => (asbIsCouple(c) ? c.familyIncome : c.annualIncome),
        (c) =>
          asbIsCouple(c) ? val(ASB.incomeThresholdCouple) : val(ASB.incomeThresholdSingle),
      ),
      hard: true,
      passReason: tri(
        "Your income is within the Alberta Seniors Benefit guideline for your household.",
        "你的收入在你家庭情況對應的亞伯達長者福利指引之內。",
        "你的收入在你家庭情况对应的阿尔伯塔长者福利指引之内。",
      ),
      failReason: tri(
        `Income must be under ${fmt(ASB.incomeThresholdSingle)} for a single senior, or ${fmt(ASB.incomeThresholdCouple)} combined for a senior couple.`,
        `單身長者收入須低於 ${fmt(ASB.incomeThresholdSingle)}，長者夫婦合計須低於 ${fmt(ASB.incomeThresholdCouple)}。`,
        `单身长者收入须低于 ${fmt(ASB.incomeThresholdSingle)}，长者夫妇合计须低于 ${fmt(ASB.incomeThresholdCouple)}。`,
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: val(ASB.maxAnnualSingle), period: "year" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply once, near age 65", "接近 65 歲時申請一次", "接近 65 岁时申请一次"),
      description: tri(
        "Submit the Seniors Financial Assistance application. Once approved, it renews automatically from your tax information.",
        "提交長者財政援助申請。獲批後會按你的報稅資料自動續期。",
        "提交长者财政援助申请。获批后会按你的报税资料自动续期。",
      ),
      actionUrl: "https://www.alberta.ca/alberta-seniors-benefit",
    },
  ],
  requiredDocuments: [
    tri("Filed tax return", "已報稅表", "已报税表"),
    tri("Banking information", "銀行資料", "银行资料"),
  ],
  applicationUrl: "https://www.alberta.ca/alberta-seniors-benefit",
  officialInfoUrl: "https://www.alberta.ca/alberta-seniors-benefit",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["alberta", "seniors", "65+", "low-income"],
  relatedBenefits: ["oas", "gis"],
  lastUpdated: "2026-09-01",
};

export const acfb: Benefit = {
  id: "acfb",
  name: tri(
    "Alberta Child and Family Benefit",
    "亞伯達兒童及家庭福利",
    "阿尔伯塔儿童及家庭福利",
  ),
  shortName: "ACFB",
  category: "family",
  level: "provincial-ab",
  description: tri(
    "A tax-free payment for lower- and middle-income Alberta families with children under 18. A base amount plus an extra working-income component.",
    "為亞伯達低至中等收入、有 18 歲以下子女家庭提供的免稅款項。包括基本金額及額外工作收入部分。",
    "为阿尔伯塔低至中等收入、有 18 岁以下子女家庭提供的免税款项。包括基本金额及额外工作收入部分。",
  ),
  estimatedValue: tri(
    "Up to about $1,499/year for the first child, plus more for others and for working income",
    "首名子女最多約每年 $1,499，其他子女及工作收入另有增加",
    "首名子女最多约每年 $1,499，其他子女及工作收入另有增加",
  ),
  contextFields: ["province", "hasChildren", "numberOfChildren", "familyIncome"],
  check: buildCheck([
    { test: AB, hard: true, passReason: abPass, failReason: abFail, missingField: "province" },
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: tri(
        "You have children under 18 in your care.",
        "你有 18 歲以下的子女受你照顧。",
        "你有 18 岁以下的子女受你照顾。",
      ),
      failReason: tri(
        "This benefit is for families caring for a child under 18.",
        "此福利適用於照顧 18 歲以下子女的家庭。",
        "此福利适用于照顾 18 岁以下子女的家庭。",
      ),
      missingField: "hasChildren",
    },
  ]),
  estimateAmount: (ctx) => acfbEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("File your taxes", "報稅", "报税"),
      description: tri(
        "There is no separate application. File your tax return and the CRA assesses you automatically, paying it with the Canada Child Benefit.",
        "無需另行申請。報稅後稅務局會自動評估，並與加拿大兒童福利一併發放。",
        "无需另行申请。报税后税务局会自动评估，并与加拿大儿童福利一并发放。",
      ),
      actionUrl: "https://www.alberta.ca/alberta-child-and-family-benefit",
    },
  ],
  requiredDocuments: [
    tri("Filed tax returns (both parents)", "已報稅表（父母雙方）", "已报税表（父母双方）"),
  ],
  officialInfoUrl: "https://www.alberta.ca/alberta-child-and-family-benefit",
  paymentFrequency: tri("Quarterly", "每季", "每季"),
  tags: ["alberta", "family", "children", "low-income"],
  relatedBenefits: ["ccb", "canada-learning-bond"],
  lastUpdated: "2026-09-01",
};

export const albertaIncomeSupport: Benefit = {
  id: "alberta-income-support",
  name: tri("Alberta Income Support", "亞伯達收入援助", "阿尔伯塔收入援助"),
  shortName: "Income Support",
  category: "income-support",
  level: "provincial-ab",
  description: tri(
    "Monthly help for Albertans who do not have enough money for basic needs like food, clothing, and shelter, plus help finding work.",
    "為無法負擔食物、衣物及住屋等基本需要的亞伯達居民提供每月援助，並協助求職。",
    "为无法负担食物、衣物及住房等基本需要的阿尔伯塔居民提供每月援助，并帮助求职。",
  ),
  estimatedValue: tri(
    "Around $900+/month for a single person, depending on your situation",
    "單身人士約每月 $900 以上，視情況而定",
    "单身人士约每月 $900 以上，视情况而定",
  ),
  contextFields: ["province", "annualIncome"],
  check: buildCheck([
    { test: AB, hard: true, passReason: abPass, failReason: abFail, missingField: "province" },
    {
      test: atMost((c) => c.annualIncome, 12000),
      hard: true,
      passReason: tri(
        "Your income is very low, which is the main test.",
        "你的收入極低，這是主要條件。",
        "你的收入极低，这是主要条件。",
      ),
      failReason: tri(
        "Income Support is for Albertans with very little income and assets.",
        "收入援助適用於收入及資產極少的亞伯達居民。",
        "收入援助适用于收入及资产极少的阿尔伯塔居民。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 950, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through Alberta Supports", "透過 Alberta Supports 申請", "通过 Alberta Supports 申请"),
      description: tri(
        "Apply online or by phone. You will provide details about your income, assets, and housing.",
        "網上或電話申請，需提供收入、資產及住屋資料。",
        "网上或电话申请，需提供收入、资产及住房资料。",
      ),
      actionUrl: "https://www.alberta.ca/income-support",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income and housing costs", "收入及住屋費用證明", "收入及住房费用证明"),
  ],
  applicationUrl: "https://www.alberta.ca/income-support",
  officialInfoUrl: "https://www.alberta.ca/income-support",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["alberta", "low-income", "assistance", "last-resort"],
  relatedBenefits: ["aish", "alberta-adult-health-benefit"],
  lastUpdated: "2026-09-01",
};

export const albertaAdultHealthBenefit: Benefit = {
  id: "alberta-adult-health-benefit",
  name: tri(
    "Alberta Adult Health Benefit",
    "亞伯達成人健康福利",
    "阿尔伯塔成人健康福利",
  ),
  shortName: "AAHB",
  category: "health",
  level: "provincial-ab",
  description: tri(
    "Health coverage — prescription drugs, dental, optical, and more — for lower-income Alberta adults and families, including those leaving Income Support or AISH for work.",
    "為低收入亞伯達成人及家庭（包括因就業而離開收入援助或 AISH 的人士）提供健康保障 — 處方藥、牙科、視光等。",
    "为低收入阿尔伯塔成人及家庭（包括因就业而离开收入援助或 AISH 的人士）提供健康保障 — 处方药、牙科、视光等。",
  ),
  estimatedValue: tri(
    "Prescription drug, dental, optical, and emergency health coverage",
    "處方藥、牙科、視光及緊急健康保障",
    "处方药、牙科、视光及紧急健康保障",
  ),
  contextFields: ["province", "familyIncome"],
  check: buildCheck([
    { test: AB, hard: true, passReason: abPass, failReason: abFail, missingField: "province" },
    {
      test: atMost((c) => c.familyIncome, 34000),
      hard: false,
      passReason: tri(
        "Your income is in the low range this coverage is for.",
        "你的收入屬此保障針對的低收入範圍。",
        "你的收入属此保障针对的低收入范围。",
      ),
      missingField: "familyIncome",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through Alberta Supports", "透過 Alberta Supports 申請", "通过 Alberta Supports 申请"),
      description: tri(
        "Complete the Adult Health Benefit application. If you qualify, coverage is provided through a benefit card.",
        "填寫成人健康福利申請。如合資格，會透過福利卡提供保障。",
        "填写成人健康福利申请。如合资格，会通过福利卡提供保障。",
      ),
      actionUrl: "https://www.alberta.ca/alberta-adult-health-benefit",
    },
  ],
  requiredDocuments: [
    tri("Proof of income", "收入證明", "收入证明"),
  ],
  applicationUrl: "https://www.alberta.ca/alberta-adult-health-benefit",
  officialInfoUrl: "https://www.alberta.ca/alberta-adult-health-benefit",
  paymentFrequency: tri("Ongoing coverage", "持續保障", "持续保障"),
  tags: ["alberta", "health", "drugs", "dental", "low-income"],
  relatedBenefits: ["alberta-income-support", "aish"],
  lastUpdated: "2026-09-01",
};

export const albertaBenefits: Benefit[] = [
  aish,
  albertaSeniorsBenefit,
  acfb,
  albertaIncomeSupport,
  albertaAdultHealthBenefit,
];
