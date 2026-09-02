import type { Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, buildCheck, inRange, isTrue, oneOf } from "@/lib/checks";

export const oas: Benefit = {
  id: "oas",
  name: tri("Old Age Security", "老年保障金", "老年保障金"),
  shortName: "OAS",
  category: "seniors",
  level: "federal",
  description: tri(
    "A monthly pension for most people aged 65 and older who have lived in Canada for at least 10 years. It is based on residence, not on work history.",
    "為大部分 65 歲或以上、在加拿大居住滿 10 年人士提供的每月退休金。以居住年期計算，與工作紀錄無關。",
    "为大部分 65 岁或以上、在加拿大居住满 10 年人士提供的每月退休金。以居住年期计算，与工作纪录无关。",
  ),
  estimatedValue: tri(
    "Up to $751.97/month (age 65-74) or $827.17/month (75+)",
    "最多每月 $751.97（65-74 歲）或 $827.17（75 歲以上）",
    "最多每月 $751.97（65-74 岁）或 $827.17（75 岁以上）",
  ),
  contextFields: ["age", "residency", "annualIncome"],
  check: buildCheck([
    {
      test: atLeast((c) => c.age, 65),
      hard: true,
      passReason: tri(
        "You are 65 or older.",
        "你已年滿 65 歲。",
        "你已年满 65 岁。",
      ),
      failReason: tri(
        "Old Age Security starts at age 65. You can apply up to 11 months before your 65th birthday.",
        "老年保障金由 65 歲開始。你可在 65 歲生日前最多 11 個月申請。",
        "老年保障金由 65 岁开始。你可在 65 岁生日前最多 11 个月申请。",
      ),
      missingField: "age",
    },
    {
      test: oneOf((c) => c.residency, ["citizen", "pr"]),
      hard: false,
      passReason: tri(
        "You are a citizen or permanent resident, and generally need 10+ years in Canada.",
        "你是公民或永久居民，一般需在加拿大居住滿 10 年。",
        "你是公民或永久居民，一般需在加拿大居住满 10 年。",
      ),
      missingField: "residency",
    },
    {
      test: atMost((c) => c.annualIncome, 148451),
      hard: false,
      passReason: tri(
        "Your income is below the level where OAS is fully clawed back.",
        "你的收入低於老年保障金被全數收回的水平。",
        "你的收入低于老年保障金被全数收回的水平。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: (ctx) => {
    const high = ctx.age !== undefined && ctx.age >= 75 ? 827 : 752;
    return { low: 0, high, period: "month" };
  },
  applicationSteps: [
    {
      order: 1,
      title: tri(
        "Check if you were enrolled automatically",
        "查看你是否已自動登記",
        "查看你是否已自动登记",
      ),
      description: tri(
        "Many people are enrolled automatically. Service Canada sends a letter. If you did not get one, you need to apply.",
        "很多人會被自動登記，Service Canada 會寄信通知。如未收到，則須自行申請。",
        "很多人会被自动登记，Service Canada 会寄信通知。如未收到，则须自行申请。",
      ),
    },
    {
      order: 2,
      title: tri("Apply through Service Canada", "透過 Service Canada 申請", "通过 Service Canada 申请"),
      description: tri(
        "Apply online through My Service Canada Account or on paper, ideally 6 months before you want payments to start.",
        "透過 My Service Canada Account 網上或紙本申請，最好在希望開始領取前 6 個月辦理。",
        "通过 My Service Canada Account 网上或纸本申请，最好在希望开始领取前 6 个月办理。",
      ),
      actionUrl:
        "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/apply.html",
    },
  ],
  requiredDocuments: [
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
    tri("Banking information for direct deposit", "直接存款的銀行資料", "直接存款的银行资料"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/apply.html",
  officialInfoUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security.html",
  processingTime: tri("Varies", "視情況而定", "视情况而定"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["seniors", "65+", "pension", "retirement"],
  relatedBenefits: ["gis", "bc-seniors-supplement", "safer", "cpp-retirement"],
  lastUpdated: "2026-09-01",
};

// GIS -- 2026 maximums from the program page.
// Source (fetched 2026-09-02):
// https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement.html
// This benefit carried THREE different numbers for one amount: $1,108 in the
// copy, $1,097 in the estimator, and the real figure of $1,123.17 on the page.
// Declaring it once is the point.
//
// Not yet sourced: the income cutoff, written as 22488 in the rule and
// "$22,500" in the copy. The real cutoff varies by marital status and is not
// on this page, so fixing it needs marital-status tiers -- the same shape as
// the Manitoba family-size bug. Left as-is and flagged rather than half-fixed.
const GIS_URL =
  "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement.html";

const GIS = figures({
  maxMonthlySingle: {
    current: {
      value: 1123.17,
      from: "2026-07-01",
      source: GIS_URL,
      quote: "Single, widowed, or divorced: up to $1,123.17/month",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Maximum monthly GIS, single",
  },
  maxMonthlyWithSpouseOnOas: {
    current: {
      value: 676.09,
      from: "2026-07-01",
      source: GIS_URL,
      quote: "Spouse/common-law partner receives full OAS: up to $676.09/month",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Maximum monthly GIS, spouse receives full OAS",
  },
});

export const gis: Benefit = {
  id: "gis",
  name: tri(
    "Guaranteed Income Supplement",
    "保證收入補助金",
    "保证收入补助金",
  ),
  shortName: "GIS",
  category: "seniors",
  level: "federal",
  description: tri(
    "A monthly, non-taxable top-up for low-income seniors who already receive Old Age Security. File your taxes each year to keep getting it.",
    "為已領取老年保障金的低收入長者提供的每月免稅補助。每年報稅以持續領取。",
    "为已领取老年保障金的低收入长者提供的每月免税补助。每年报税以持续领取。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(GIS.maxMonthlySingle)}/month for a single senior`,
    `單身長者最多每月 ${fmt(GIS.maxMonthlySingle)}`,
    `单身长者最多每月 ${fmt(GIS.maxMonthlySingle)}`,
  ),
  figures: GIS,
  contextFields: ["age", "annualIncome", "familyIncome", "maritalStatus", "filedTaxes"],
  prerequisites: ["oas"],
  check: buildCheck([
    {
      test: atLeast((c) => c.age, 65),
      hard: true,
      passReason: tri("You are 65 or older.", "你已年滿 65 歲。", "你已年满 65 岁。"),
      failReason: tri(
        "GIS is for OAS recipients aged 65 and older.",
        "保證收入補助金適用於 65 歲或以上的老年保障金領取者。",
        "保证收入补助金适用于 65 岁或以上的老年保障金领取者。",
      ),
      missingField: "age",
    },
    {
      test: atMost((c) => c.annualIncome, 22488),
      hard: true,
      passReason: tri(
        "Your income is in the low-income range GIS is designed for.",
        "你的收入屬於保證收入補助金針對的低收入範圍。",
        "你的收入属于保证收入补助金针对的低收入范围。",
      ),
      failReason: tri(
        "GIS is for seniors with low income (roughly under $22,500 for a single person).",
        "保證收入補助金適用於低收入長者（單身約 $22,500 以下）。",
        "保证收入补助金适用于低收入长者（单身约 $22,500 以下）。",
      ),
      missingField: "annualIncome",
    },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: false,
      passReason: tri(
        "You file taxes, which keeps GIS flowing automatically.",
        "你有報稅，可自動持續領取。",
        "你有报税，可自动持续领取。",
      ),
      missingField: "filedTaxes",
    },
  ]),
  estimateAmount: (ctx) => {
    // GIS is reduced by other income: ~$1 for every $2 (single) or $4 (couple).
    const couple =
      ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
    const maxG = couple
      ? val(GIS.maxMonthlyWithSpouseOnOas)
      : val(GIS.maxMonthlySingle);
    const income = couple ? ctx.familyIncome : ctx.annualIncome;
    if (income === undefined) return { low: 0, high: maxG, period: "month" };
    const divisor = couple ? 48 : 24;
    const monthly = Math.max(0, Math.round(maxG - income / divisor));
    return {
      low: monthly,
      high: monthly,
      period: "month",
      note: tri(
        "Estimated from your income. GIS drops as other income rises.",
        "根據你的收入估算。其他收入增加，GIS 會減少。",
        "根据你的收入估算。其他收入增加，GIS 会减少。",
      ),
    };
  },
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply with or after your OAS", "與 OAS 一同或之後申請", "与 OAS 一同或之后申请"),
      description: tri(
        "You can apply for GIS at the same time as OAS. Many people are considered automatically once they file taxes.",
        "你可與 OAS 同時申請保證收入補助金。很多人報稅後便會被自動考慮。",
        "你可与 OAS 同时申请保证收入补助金。很多人报税后便会被自动考虑。",
      ),
      actionUrl:
        "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/apply.html",
    },
    {
      order: 2,
      title: tri("File taxes every year", "每年報稅", "每年报税"),
      description: tri(
        "Filing on time each year is how the government recalculates your GIS. Miss it and payments can stop.",
        "每年準時報稅是政府重新計算補助的方式，錯過可能令款項停止。",
        "每年准时报税是政府重新计算补助的方式，错过可能令款项停止。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
    tri("Filed income tax return", "已報的所得稅表", "已报的所得税表"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/apply.html",
  officialInfoUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement.html",
  processingTime: tri("Varies", "視情況而定", "视情况而定"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["seniors", "65+", "low-income", "supplement"],
  relatedBenefits: ["oas", "bc-seniors-supplement", "safer", "bc-bus-pass"],
  lastUpdated: "2026-09-01",
};

// CPP retirement -- 2026 amounts from the program page.
// Source (fetched 2026-09-02):
// https://www.canada.ca/en/services/benefits/publicpensions/cpp.html
// The app showed the 2025 figures ($1,433 maximum, $900 average) after the
// page had moved to 2026.
const CPP_URL = "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html";

const CPP_RETIREMENT = figures({
  maxMonthlyAt65: {
    current: {
      value: 1507.65,
      from: "2026-01-01",
      source: CPP_URL,
      quote: "Maximum CPP retirement pension at age 65 (January 2026): $1,507.65/month",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Maximum monthly pension at 65",
  },
  averageMonthlyAt65: {
    current: {
      value: 877.01,
      from: "2026-07-01",
      source: CPP_URL,
      quote:
        "Average CPP retirement pension at age 65 for new beneficiaries (July to September 2026): $877.01/month",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Average monthly pension at 65 for new beneficiaries",
  },
});

export const cppRetirement: Benefit = {
  id: "cpp-retirement",
  name: tri(
    "CPP Retirement Pension",
    "CPP 退休金",
    "CPP 退休金",
  ),
  shortName: "CPP",
  category: "seniors",
  level: "federal",
  description: tri(
    "A monthly pension you earned by paying into the Canada Pension Plan while working. You can start it as early as 60 or as late as 70.",
    "你在工作時繳付加拿大退休金計劃而賺取的每月退休金。可最早 60 歲、最遲 70 歲開始領取。",
    "你在工作时缴付加拿大退休金计划而赚取的每月退休金。可最早 60 岁、最迟 70 岁开始领取。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(CPP_RETIREMENT.maxMonthlyAt65)}/month (2026); average about ${fmt(CPP_RETIREMENT.averageMonthlyAt65)}/month for new pensioners`,
    `最多每月 ${fmt(CPP_RETIREMENT.maxMonthlyAt65)}（2026）；新領取者平均約 ${fmt(CPP_RETIREMENT.averageMonthlyAt65)}`,
    `最多每月 ${fmt(CPP_RETIREMENT.maxMonthlyAt65)}（2026）；新领取者平均约 ${fmt(CPP_RETIREMENT.averageMonthlyAt65)}`,
  ),
  figures: CPP_RETIREMENT,
  contextFields: ["age", "hasRecentCppContributions"],
  check: buildCheck([
    {
      test: atLeast((c) => c.age, 60),
      hard: true,
      passReason: tri(
        "You are old enough to start CPP (as early as 60).",
        "你已達可開始領取 CPP 的年齡（最早 60 歲）。",
        "你已达可开始领取 CPP 的年龄（最早 60 岁）。",
      ),
      failReason: tri(
        "You can start the CPP retirement pension as early as age 60.",
        "你可最早於 60 歲開始領取 CPP 退休金。",
        "你可最早于 60 岁开始领取 CPP 退休金。",
      ),
      missingField: "age",
    },
    {
      test: isTrue((c) => c.hasRecentCppContributions),
      hard: false,
      passReason: tri(
        "You paid into CPP while working, so you have a pension to claim.",
        "你工作時有繳付 CPP，因此有退休金可領取。",
        "你工作时有缴付 CPP，因此有退休金可领取。",
      ),
      missingField: "hasRecentCppContributions",
    },
  ]),
  estimateAmount: () => ({
    low: val(CPP_RETIREMENT.averageMonthlyAt65),
    high: val(CPP_RETIREMENT.maxMonthlyAt65),
    period: "month",
    note: tri(
      "Your amount depends on how much and how long you contributed.",
      "金額取決於你的供款額與供款年期。",
      "金额取决于你的供款额与供款年期。",
    ),
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri(
        "Check your CPP statement of contributions",
        "查看你的 CPP 供款紀錄",
        "查看你的 CPP 供款纪录",
      ),
      description: tri(
        "Sign in to My Service Canada Account to see your estimated pension at different ages.",
        "登入 My Service Canada Account 查看不同年齡的預估退休金。",
        "登入 My Service Canada Account 查看不同年龄的预估退休金。",
      ),
    },
    {
      order: 2,
      title: tri("Apply about 6 months ahead", "約提前 6 個月申請", "约提前 6 个月申请"),
      description: tri(
        "CPP is not automatic — you must apply. Apply online or on paper, ideally 6 months before you want it to start.",
        "CPP 並非自動發放 — 你必須申請。可網上或紙本申請，最好提前 6 個月。",
        "CPP 并非自动发放 — 你必须申请。可网上或纸本申请，最好提前 6 个月。",
      ),
      actionUrl:
        "https://www.canada.ca/en/services/benefits/publicpensions/cpp/cpp-benefit/apply.html",
    },
  ],
  requiredDocuments: [
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
    tri("Banking information for direct deposit", "直接存款的銀行資料", "直接存款的银行资料"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/cpp/cpp-benefit/apply.html",
  officialInfoUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html",
  processingTime: tri("Usually within 4 months", "通常 4 個月內", "通常 4 个月内"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["seniors", "60+", "pension", "retirement", "cpp"],
  relatedBenefits: ["oas", "gis"],
  lastUpdated: "2026-09-01",
};

// OAS Allowance -- 2026 maximum from the program page.
// Source (fetched 2026-09-02):
// https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance.html
// The app showed $1,411 (2025) after the page moved to $1,428.06.
const ALLOWANCE_URL =
  "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance.html";

const ALLOWANCE = figures({
  maxMonthly: {
    current: {
      value: 1428.06,
      from: "2026-07-01",
      source: ALLOWANCE_URL,
      quote: "Spouse/common-law partner receives GIS and full OAS: up to $1,428.06/month",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Maximum monthly Allowance",
  },
});

export const allowance: Benefit = {
  id: "oas-allowance",
  name: tri("Allowance (for 60 to 64)", "津貼（60 至 64 歲）", "津贴（60 至 64 岁）"),
  shortName: "Allowance",
  category: "seniors",
  level: "federal",
  description: tri(
    "A monthly payment for low-income people aged 60 to 64 whose spouse or partner receives the Guaranteed Income Supplement. It bridges the gap until you reach 65.",
    "為 60 至 64 歲、配偶或伴侶領取保證收入補助金的低收入人士提供的每月款項，銜接至 65 歲。",
    "为 60 至 64 岁、配偶或伴侣领取保证收入补助金的低收入人士提供的每月款项，衔接至 65 岁。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(ALLOWANCE.maxMonthly)}/month`,
    `最多每月 ${fmt(ALLOWANCE.maxMonthly)}`,
    `最多每月 ${fmt(ALLOWANCE.maxMonthly)}`,
  ),
  figures: ALLOWANCE,
  contextFields: ["age", "maritalStatus", "familyIncome", "residency"],
  check: buildCheck([
    {
      test: inRange((c) => c.age, 60, 64),
      hard: true,
      passReason: tri(
        "You are aged 60 to 64.",
        "你介乎 60 至 64 歲。",
        "你介乎 60 至 64 岁。",
      ),
      failReason: tri(
        "The Allowance is for people aged 60 to 64. At 65 you can apply for OAS and GIS instead.",
        "此津貼適用於 60 至 64 歲人士。65 歲時可改為申請 OAS 及 GIS。",
        "此津贴适用于 60 至 64 岁人士。65 岁时可改为申请 OAS 及 GIS。",
      ),
      missingField: "age",
    },
    {
      test: oneOf((c) => c.maritalStatus, ["married", "common-law"]),
      hard: true,
      passReason: tri(
        "You have a spouse or partner who may receive the GIS.",
        "你有可能領取 GIS 的配偶或伴侶。",
        "你有可能领取 GIS 的配偶或伴侣。",
      ),
      failReason: tri(
        "Your spouse or common-law partner must receive the Guaranteed Income Supplement.",
        "你的配偶或同居伴侶須領取保證收入補助金。",
        "你的配偶或同居伴侣须领取保证收入补助金。",
      ),
      missingField: "maritalStatus",
    },
    {
      test: atMost((c) => c.familyIncome, 41616),
      hard: true,
      passReason: tri(
        "Your combined income is within the limit.",
        "你的合計收入在上限之內。",
        "你的合计收入在上限之内。",
      ),
      failReason: tri(
        "Combined income must be under about $41,616.",
        "合計收入須低於約 $41,616。",
        "合计收入须低于约 $41,616。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: val(ALLOWANCE.maxMonthly), period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through Service Canada", "透過 Service Canada 申請", "通过 Service Canada 申请"),
      description: tri(
        "Apply on paper or online. Your spouse or partner should already receive OAS and the GIS.",
        "以紙本或網上申請。你的配偶或伴侶應已領取 OAS 及 GIS。",
        "以纸本或网上申请。你的配偶或伴侣应已领取 OAS 及 GIS。",
      ),
      actionUrl:
        "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance.html",
    },
  ],
  requiredDocuments: [
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
    tri("Your spouse's OAS/GIS details", "配偶的 OAS／GIS 資料", "配偶的 OAS／GIS 资料"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance.html",
  officialInfoUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["seniors", "60+", "low-income", "spouse"],
  relatedBenefits: ["gis", "oas", "allowance-survivor"],
  lastUpdated: "2026-09-01",
};

export const allowanceSurvivor: Benefit = {
  id: "allowance-survivor",
  name: tri(
    "Allowance for the Survivor",
    "遺屬津貼",
    "遗属津贴",
  ),
  shortName: "Survivor Allowance",
  category: "seniors",
  level: "federal",
  description: tri(
    "A monthly payment for low-income people aged 60 to 64 whose spouse or partner has died and who have not remarried.",
    "為 60 至 64 歲、配偶或伴侶已離世且未再婚的低收入人士提供的每月款項。",
    "为 60 至 64 岁、配偶或伴侣已离世且未再婚的低收入人士提供的每月款项。",
  ),
  estimatedValue: tri(
    "Up to about $1,702/month",
    "最多約每月 $1,702",
    "最多约每月 $1,702",
  ),
  contextFields: ["age", "maritalStatus", "annualIncome"],
  check: buildCheck([
    {
      test: inRange((c) => c.age, 60, 64),
      hard: true,
      passReason: tri(
        "You are aged 60 to 64.",
        "你介乎 60 至 64 歲。",
        "你介乎 60 至 64 岁。",
      ),
      failReason: tri(
        "This is for people aged 60 to 64. At 65 you can apply for OAS and GIS.",
        "此津貼適用於 60 至 64 歲人士。65 歲時可申請 OAS 及 GIS。",
        "此津贴适用于 60 至 64 岁人士。65 岁时可申请 OAS 及 GIS。",
      ),
      missingField: "age",
    },
    {
      test: oneOf((c) => c.maritalStatus, ["widowed"]),
      hard: true,
      passReason: tri(
        "Your spouse or partner has died and you have not remarried.",
        "你的配偶或伴侶已離世，且你未再婚。",
        "你的配偶或伴侣已离世，且你未再婚。",
      ),
      failReason: tri(
        "This is for a widowed person who has not remarried or found a new common-law partner.",
        "此津貼適用於喪偶且未再婚或未有新同居伴侶的人士。",
        "此津贴适用于丧偶且未再婚或未有新同居伴侣的人士。",
      ),
      missingField: "maritalStatus",
    },
    {
      test: atMost((c) => c.annualIncome, 28944),
      hard: true,
      passReason: tri(
        "Your income is within the limit.",
        "你的收入在上限之內。",
        "你的收入在上限之内。",
      ),
      failReason: tri(
        "Income must be under about $28,944.",
        "收入須低於約 $28,944。",
        "收入须低于约 $28,944。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 1702, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through Service Canada", "透過 Service Canada 申請", "通过 Service Canada 申请"),
      description: tri(
        "Apply on paper or online. You may need to provide proof of your spouse's death.",
        "以紙本或網上申請。你可能需要提供配偶的死亡證明。",
        "以纸本或网上申请。你可能需要提供配偶的死亡证明。",
      ),
      actionUrl:
        "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance-survivor.html",
    },
  ],
  requiredDocuments: [
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
    tri("Proof of your spouse's death (if asked)", "配偶死亡證明（如需要）", "配偶死亡证明（如需要）"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance-survivor.html",
  officialInfoUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance-survivor.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["seniors", "60+", "low-income", "widowed", "survivor"],
  relatedBenefits: ["gis", "oas", "oas-allowance"],
  lastUpdated: "2026-09-01",
};

export const federalSeniorsBenefits: Benefit[] = [
  oas,
  gis,
  cppRetirement,
  allowance,
  allowanceSurvivor,
];
