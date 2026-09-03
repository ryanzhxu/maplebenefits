import type { AmountEstimate, AssessmentContext, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, atMostOf, buildCheck, isTrue, lessThan, oneOf } from "@/lib/checks";

const ON = oneOf((c: { province?: string }) => c.province, ["ON"]);
const onFail = tri(
  "This program is for residents of Ontario.",
  "此計劃適用於安大略省居民。",
  "此计划适用于安大略省居民。",
);
const onPass = tri("You live in Ontario.", "你居住在安大略省。", "你居住在安大略省。");

// Ontario amounts verified against ontario.ca on 2026-09-02. The app was
// showing the previous year's figures for both programs.
const ODSP_URL = "https://www.ontario.ca/page/ontario-disability-support-program";
const OCB_URL = "https://www.ontario.ca/page/ontario-child-benefit";

const ODSP_FIGURES = figures({
  maxMonthlySingle: {
    current: {
      value: 1436,
      from: "2026-01-01",
      source: ODSP_URL,
      quote: "You could receive up to $1,436 a month for basic needs and shelter if you are single",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum monthly amount, single",
  },
});

const OCB_FIGURES = figures({
  maxPerChildPerYear: {
    current: {
      value: 1760,
      from: "2026-07-01",
      source: OCB_URL,
      quote:
        "Low-income to moderate-income families can get up to $1,760 per child each year through the Ontario Child Benefit",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum per child per year",
  },
});

const ocbEstimate = (ctx: {
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const n = ctx.numberOfChildren ?? 1;
  const max = val(OCB_FIGURES.maxPerChildPerYear) * n;
  const income = ctx.familyIncome;
  if (income === undefined) return { low: 0, high: max, period: "year" };
  const over = Math.max(0, income - 26865);
  const amount = Math.max(0, Math.round(max - over * 0.08 * n));
  return {
    low: amount,
    high: amount,
    period: "year",
    note: tri(
      "Rough estimate; paid together with the Canada Child Benefit.",
      "粗略估算；與加拿大兒童福利一併發放。",
      "粗略估算；与加拿大儿童福利一并发放。",
    ),
  };
};

// Ontario Trillium Benefit -- the energy and property tax component publishes
// the headline maximums. Source (fetched 2026-09-02):
// https://www.ontario.ca/page/ontario-trillium-benefit
// The app said "about $1,400+", which is vague and below the real senior
// maximum of $1,488. Note that this page also carries a phishing EXAMPLE
// quoting "$258.00"; nothing here is sourced from it.
const OTB_URL = "https://www.ontario.ca/page/ontario-trillium-benefit";

const OTB = figures({
  energyPropertyMax18to64: {
    current: {
      value: 1307,
      from: "2026-07-01",
      source: OTB_URL,
      quote: "$1,307 if you are between 18 and 64 years old",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Energy and property tax credit maximum, ages 18-64",
  },
  energyPropertyMax65Plus: {
    current: {
      value: 1488,
      from: "2026-07-01",
      source: OTB_URL,
      quote: "$1,488 if you are 65 or older",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Energy and property tax credit maximum, 65 and over",
  },
  salesTaxCreditPerAdult: {
    current: {
      value: 378,
      from: "2026-07-01",
      source: OTB_URL,
      quote: "You can receive up to $378",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Sales tax credit per adult",
  },
});

export const ontarioTrillium: Benefit = {
  id: "ontario-trillium",
  name: tri("Ontario Trillium Benefit", "安大略延齡草福利", "安大略延龄草福利"),
  shortName: "OTB",
  category: "tax-credits",
  level: "provincial-on",
  description: tri(
    "A monthly payment that combines three Ontario credits — for energy costs, property tax or rent, and sales tax. You get it just by filing your taxes.",
    "結合三項安大略抵免（能源費用、物業稅或租金、銷售稅）的每月款項。只需報稅即可獲得。",
    "结合三项安大略抵免（能源费用、物业税或租金、销售税）的每月款项。只需报税即可获得。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(OTB.energyPropertyMax18to64)}/year (${fmt(OTB.energyPropertyMax65Plus)} at 65+) for energy and property tax, plus up to ${fmt(OTB.salesTaxCreditPerAdult)} sales tax credit per adult`,
    `能源及物業稅最多每年 ${fmt(OTB.energyPropertyMax18to64)}（65 歲以上 ${fmt(OTB.energyPropertyMax65Plus)}），另加每名成人最多 ${fmt(OTB.salesTaxCreditPerAdult)} 銷售稅抵免`,
    `能源及物业税最多每年 ${fmt(OTB.energyPropertyMax18to64)}（65 岁以上 ${fmt(OTB.energyPropertyMax65Plus)}），另加每名成人最多 ${fmt(OTB.salesTaxCreditPerAdult)} 销售税抵免`,
  ),
  figures: OTB,
  contextFields: ["province", "filedTaxes", "familyIncome"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: true,
      passReason: tri(
        "You file taxes, which is how this credit is paid.",
        "你有報稅，這是發放此抵免的方式。",
        "你有报税，这是发放此抵免的方式。",
      ),
      failReason: tri(
        "You must file a tax return (and the ON-BEN form) to receive it.",
        "你須報稅（並填 ON-BEN 表格）才能領取。",
        "你须报税（并填 ON-BEN 表格）才能领取。",
      ),
      missingField: "filedTaxes",
    },
    {
      test: atMost((c) => c.familyIncome, 55000),
      hard: false,
      passReason: tri(
        "Your income is in the range that receives the credit.",
        "你的收入在可獲此抵免的範圍內。",
        "你的收入在可获此抵免的范围内。",
      ),
      missingField: "familyIncome",
    },
  ]),
  // 1421 appeared on no source page and matched none of this benefit's own
  // figures, so the card and the detail page disagreed. Derived now: the
  // energy and property tax component at the applicant's age band, plus the
  // sales tax credit for one adult.
  estimateAmount: (ctx) => {
    const senior = ctx.age !== undefined && ctx.age >= 65;
    const energyProperty = senior
      ? val(OTB.energyPropertyMax65Plus)
      : val(OTB.energyPropertyMax18to64);
    return {
      low: 0,
      high: energyProperty + val(OTB.salesTaxCreditPerAdult),
      period: "year",
      note: tri(
        "Combines three credits; the exact amount depends on your rent or property tax and energy costs.",
        "合併三項抵免；實際金額視乎你的租金或物業稅及能源開支。",
        "合并三项抵免；实际金额视乎你的租金或物业税及能源开支。",
      ),
    };
  },
  applicationSteps: [
    {
      order: 1,
      title: tri("File taxes and the ON-BEN form", "報稅並填 ON-BEN 表格", "报税并填 ON-BEN 表格"),
      description: tri(
        "Complete the ON-BEN application with your tax return each year, reporting your rent or property tax and energy costs.",
        "每年隨報稅填寫 ON-BEN 申請，申報你的租金或物業稅及能源費用。",
        "每年随报税填写 ON-BEN 申请，申报你的租金或物业税及能源费用。",
      ),
      actionUrl: "https://www.ontario.ca/page/ontario-trillium-benefit",
    },
  ],
  requiredDocuments: [
    tri("Filed tax return with the ON-BEN form", "已報稅表及 ON-BEN 表格", "已报税表及 ON-BEN 表格"),
    tri("Rent or property tax amounts", "租金或物業稅金額", "租金或物业税金额"),
  ],
  officialInfoUrl: "https://www.ontario.ca/page/ontario-trillium-benefit",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "tax", "rent", "energy", "low-income"],
  relatedBenefits: ["cgeb"],
  lastUpdated: "2026-09-01",
};

export const ontarioWorks: Benefit = {
  id: "ontario-works",
  name: tri("Ontario Works", "安大略工作援助", "安大略工作援助"),
  shortName: "OW",
  category: "income-support",
  level: "provincial-on",
  description: tri(
    "Last-resort monthly financial help for people in Ontario in financial need, plus support to find work. Covers basic needs and shelter.",
    "為安大略有經濟需要人士提供的最後保障每月援助，並協助求職。涵蓋基本需要及住屋。",
    "为安大略有经济需要人士提供的最后保障每月援助，并帮助求职。涵盖基本需要及住房。",
  ),
  estimatedValue: tri(
    "Up to about $733/month for a single person, plus benefits",
    "單身人士最多約每月 $733，另加福利",
    "单身人士最多约每月 $733，另加福利",
  ),
  contextFields: ["province", "annualIncome"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
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
        "Ontario Works is a last resort for people with very little income and assets.",
        "安大略工作援助是為收入及資產極少人士而設的最後保障。",
        "安大略工作援助是为收入及资产极少人士而设的最后保障。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 733, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply online or by phone", "網上或電話申請", "网上或电话申请"),
      description: tri(
        "Start your application on the Ontario government website or by phone. You will answer questions about income, assets, and housing.",
        "在安大略政府網站或致電開始申請，需回答有關收入、資產及住屋的問題。",
        "在安大略政府网站或致电开始申请，需回答有关收入、资产及住房的问题。",
      ),
      actionUrl: "https://www.ontario.ca/page/ontario-works",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income, assets, and housing costs", "收入、資產及住屋費用證明", "收入、资产及住房费用证明"),
  ],
  applicationUrl: "https://www.ontario.ca/page/ontario-works",
  officialInfoUrl: "https://www.ontario.ca/page/ontario-works",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "low-income", "assistance", "last-resort"],
  relatedBenefits: ["odsp", "ontario-trillium"],
  lastUpdated: "2026-09-01",
};

export const odsp: Benefit = {
  id: "odsp",
  name: tri(
    "Ontario Disability Support Program",
    "安大略殘障支援計劃",
    "安大略残障支援计划",
  ),
  shortName: "ODSP",
  category: "disability",
  level: "provincial-on",
  description: tri(
    "Monthly income and benefits for people in Ontario with a disability who are in financial need. It includes money for living costs, shelter, and drug and dental coverage.",
    "為安大略有經濟需要的殘障人士提供每月收入及福利，包括生活費、住屋，以及藥物和牙科保障。",
    "为安大略有经济需要的残障人士提供每月收入及福利，包括生活费、住房，以及药物和牙科保障。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(ODSP_FIGURES.maxMonthlySingle)}/month for a single person, plus drug and dental coverage`,
    `單身人士最多每月 ${fmt(ODSP_FIGURES.maxMonthlySingle)}，另加藥物及牙科保障`,
    `单身人士最多每月 ${fmt(ODSP_FIGURES.maxMonthlySingle)}，另加药物及牙科保障`,
  ),
  figures: ODSP_FIGURES,
  contextFields: ["province", "age", "hasSevereDisability"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 18),
      hard: true,
      passReason: tri("You are 18 or older.", "你已年滿 18 歲。", "你已年满 18 岁。"),
      failReason: tri(
        "ODSP income support is for adults 18 and older.",
        "ODSP 收入支援適用於 18 歲或以上成人。",
        "ODSP 收入支援适用于 18 岁或以上成人。",
      ),
      missingField: "age",
    },
    {
      test: isTrue((c) => c.hasSevereDisability),
      hard: true,
      passReason: tri(
        "Your substantial, long-term disability may meet the ODSP test.",
        "你嚴重且長期的殘障或符合 ODSP 條件。",
        "你严重且长期的残障或符合 ODSP 条件。",
      ),
      failReason: tri(
        "ODSP requires a substantial physical or mental impairment that is expected to last a year or more.",
        "ODSP 要求嚴重且預期持續一年或以上的身體或精神障礙。",
        "ODSP 要求严重且预期持续一年或以上的身体或精神障碍。",
      ),
      missingField: "hasSevereDisability",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: val(ODSP_FIGURES.maxMonthlySingle), period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply and confirm financial need", "申請並確認經濟需要", "申请并确认经济需要"),
      description: tri(
        "Start the ODSP application. First your financial eligibility is checked, then your disability.",
        "開始 ODSP 申請。先審核經濟資格，再審核殘障。",
        "开始 ODSP 申请。先审核经济资格，再审核残障。",
      ),
      actionUrl: "https://www.ontario.ca/page/ontario-disability-support-program",
    },
    {
      order: 2,
      title: tri("Complete the Disability Determination Package", "填寫殘障評定文件", "填写残障评定文件"),
      description: tri(
        "A health professional completes forms about your condition. Approval gives you income support and health benefits.",
        "由醫療專業人員填寫有關你狀況的表格。獲批後可得收入支援及健康福利。",
        "由医疗专业人员填写有关你状况的表格。获批后可得收入支援及健康福利。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Disability Determination Package (medical forms)", "殘障評定文件（醫療表格）", "残障评定文件（医疗表格）"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl: "https://www.ontario.ca/page/ontario-disability-support-program",
  officialInfoUrl: "https://www.ontario.ca/page/ontario-disability-support-program",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "disability", "income", "assistance"],
  relatedBenefits: ["dtc", "cdb", "ontario-works"],
  lastUpdated: "2026-09-01",
};

export const ontarioChildBenefit: Benefit = {
  id: "ontario-child-benefit",
  name: tri("Ontario Child Benefit", "安大略兒童福利", "安大略儿童福利"),
  shortName: "OCB",
  category: "family",
  level: "provincial-on",
  description: tri(
    "A tax-free monthly payment for lower- and moderate-income families in Ontario with children under 18, paid together with the Canada Child Benefit.",
    "為安大略低至中等收入、有 18 歲以下子女家庭提供的免稅每月款項，與加拿大兒童福利一併發放。",
    "为安大略低至中等收入、有 18 岁以下子女家庭提供的免税每月款项，与加拿大儿童福利一并发放。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(OCB_FIGURES.maxPerChildPerYear)}/year per child`,
    `每名子女最多每年 ${fmt(OCB_FIGURES.maxPerChildPerYear)}`,
    `每名子女最多每年 ${fmt(OCB_FIGURES.maxPerChildPerYear)}`,
  ),
  figures: OCB_FIGURES,
  contextFields: ["province", "hasChildren", "numberOfChildren", "familyIncome"],
  prerequisites: ["ccb"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
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
  estimateAmount: (ctx) => ocbEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("Get the Canada Child Benefit and file taxes", "領取加拿大兒童福利並報稅", "领取加拿大儿童福利并报税"),
      description: tri(
        "If you receive the Canada Child Benefit and file your taxes, you are assessed for the Ontario Child Benefit automatically.",
        "如你領取加拿大兒童福利並報稅，便會自動評估安大略兒童福利。",
        "如你领取加拿大儿童福利并报税，便会自动评估安大略儿童福利。",
      ),
      actionUrl: "https://www.ontario.ca/page/ontario-child-benefit",
    },
  ],
  requiredDocuments: [
    tri("Filed tax returns (both parents)", "已報稅表（父母雙方）", "已报税表（父母双方）"),
  ],
  officialInfoUrl: "https://www.ontario.ca/page/ontario-child-benefit",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "family", "children", "low-income"],
  relatedBenefits: ["ccb", "canada-learning-bond"],
  lastUpdated: "2026-09-01",
};

// GAINS -- payment maximum and income limits from the ontario.ca program page.
// Source (fetched 2026-09-03):
// https://www.ontario.ca/page/guaranteed-annual-income-system-payments-seniors
//
// The income gate hard-coded a flat $22,488 for everyone -- the federal GIS
// threshold, not GAINS's own. GAINS publishes much lower, tiered private-income
// limits ($4,416 single / $8,832 couple, which exclude OAS and GIS itself), so
// a senior with income between those numbers and $22,488 was wrongly told they
// qualified. Fixed with atMostOf, following the GIS/OAS pattern above.
const GAINS_URL =
  "https://www.ontario.ca/page/guaranteed-annual-income-system-payments-seniors";
const GAINS_INCOME_SENTENCE =
  "have an annual private income of up to $4,416 if you are a single senior or up to $8,832 if you are a senior couple";

const GAINS_FIGURES = figures({
  maxMonthlySingle: {
    current: {
      value: 92,
      from: "2026-07-01",
      source: GAINS_URL,
      quote:
        "Eligible seniors can receive up to $92 per month through GAINS for the 2026 benefit year",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Maximum monthly GAINS payment, single senior",
  },
  incomeMaxSingle: {
    current: { value: 4416, from: "2026-07-01", source: GAINS_URL, quote: GAINS_INCOME_SENTENCE },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Private income limit, single senior",
  },
  incomeMaxCouple: {
    current: { value: 8832, from: "2026-07-01", source: GAINS_URL, quote: GAINS_INCOME_SENTENCE },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Private income limit, senior couple",
  },
});

/** A couple's COMBINED private income is measured against the couple limit. */
const gainsIsCouple = (c: { maritalStatus?: string }) =>
  c.maritalStatus === "married" || c.maritalStatus === "common-law";

const gainsIncomeCeiling = (c: { maritalStatus?: string }) =>
  gainsIsCouple(c) ? val(GAINS_FIGURES.incomeMaxCouple) : val(GAINS_FIGURES.incomeMaxSingle);

export const ontarioGains: Benefit = {
  id: "ontario-gains",
  name: tri(
    "Guaranteed Annual Income System (GAINS)",
    "保證年度收入制度 (GAINS)",
    "保证年度收入制度 (GAINS)",
  ),
  shortName: "GAINS",
  category: "seniors",
  level: "provincial-on",
  description: tri(
    "A monthly, non-taxable top-up for low-income Ontario seniors who receive the federal Guaranteed Income Supplement. For most people it is automatic.",
    "為領取聯邦保證收入補助金的安大略低收入長者提供的每月免稅補助。對大多數人而言是自動的。",
    "为领取联邦保证收入补助金的安大略低收入长者提供的每月免税补助。对大多数人而言是自动的。",
  ),
  estimatedValue: tri(
    `Up to about ${fmt(GAINS_FIGURES.maxMonthlySingle)}/month for a single senior`,
    `單身長者最多約每月 ${fmt(GAINS_FIGURES.maxMonthlySingle)}`,
    `单身长者最多约每月 ${fmt(GAINS_FIGURES.maxMonthlySingle)}`,
  ),
  figures: GAINS_FIGURES,
  contextFields: ["province", "age", "annualIncome", "familyIncome", "maritalStatus"],
  prerequisites: ["gis"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 65),
      hard: true,
      passReason: tri("You are 65 or older.", "你已年滿 65 歲。", "你已年满 65 岁。"),
      failReason: tri(
        "GAINS is for seniors aged 65+ who receive the federal GIS.",
        "GAINS 適用於領取聯邦 GIS 的 65 歲以上長者。",
        "GAINS 适用于领取联邦 GIS 的 65 岁以上长者。",
      ),
      missingField: "age",
    },
    {
      test: atMostOf(
        (c) => (gainsIsCouple(c) ? c.familyIncome : c.annualIncome),
        gainsIncomeCeiling,
      ),
      hard: true,
      passReason: tri(
        "Your private income is low enough for GAINS.",
        "你的私人收入足夠低，符合 GAINS 資格。",
        "你的私人收入足够低，符合 GAINS 资格。",
      ),
      failReason: tri(
        `GAINS is for seniors with annual private income (not counting OAS or GIS) up to ${fmt(GAINS_FIGURES.incomeMaxSingle)} if single, or ${fmt(GAINS_FIGURES.incomeMaxCouple)} combined for a couple.`,
        `GAINS 適用於私人年收入（不含 OAS 或 GIS）單身不超過 ${fmt(GAINS_FIGURES.incomeMaxSingle)}、夫婦合計不超過 ${fmt(GAINS_FIGURES.incomeMaxCouple)} 的長者。`,
        `GAINS 适用于私人年收入（不含 OAS 或 GIS）单身不超过 ${fmt(GAINS_FIGURES.incomeMaxSingle)}、夫妇合计不超过 ${fmt(GAINS_FIGURES.incomeMaxCouple)} 的长者。`,
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: val(GAINS_FIGURES.maxMonthlySingle), period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("No application needed", "無需申請", "无需申请"),
      description: tri(
        "Once you receive the federal GIS and file your Ontario taxes, GAINS is added automatically.",
        "一旦領取聯邦 GIS 並在安大略報稅，GAINS 便會自動加入。",
        "一旦领取联邦 GIS 并在安大略报税，GAINS 便会自动加入。",
      ),
      actionUrl: "https://www.ontario.ca/page/guaranteed-annual-income-system-payments-seniors",
    },
  ],
  requiredDocuments: [],
  officialInfoUrl: "https://www.ontario.ca/page/guaranteed-annual-income-system-payments-seniors",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "seniors", "65+", "low-income", "automatic"],
  relatedBenefits: ["gis", "oas"],
  lastUpdated: "2026-09-01",
};

export const ontarioDrugBenefit: Benefit = {
  id: "ontario-drug-benefit",
  name: tri(
    "Ontario Prescription Drug Coverage",
    "安大略處方藥保障",
    "安大略处方药保障",
  ),
  shortName: "ODB / Trillium",
  category: "health",
  level: "provincial-on",
  description: tri(
    "Ontario helps pay for prescription drugs. Seniors 65+ are covered automatically (Ontario Drug Benefit); younger residents with high drug costs and no insurance can use the Trillium Drug Program.",
    "安大略協助支付處方藥。65 歲以上長者自動獲保障（安大略藥物福利）；藥費高且無保險的較年輕居民可使用延齡草藥物計劃。",
    "安大略帮助支付处方药。65 岁以上长者自动获保障（安大略药物福利）；药费高且无保险的较年轻居民可使用延龄草药物计划。",
  ),
  estimatedValue: tri(
    "Most prescription drug costs, with a small co-payment",
    "大部分處方藥費用，只需小額共付",
    "大部分处方药费用，只需小额共付",
  ),
  contextFields: ["province"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("At 65, coverage is automatic", "65 歲時自動獲保障", "65 岁时自动获保障"),
      description: tri(
        "If you are 65+, the Ontario Drug Benefit starts automatically. Low-income seniors can apply to the Seniors Co-Payment Program to lower costs further.",
        "如你 65 歲以上，安大略藥物福利自動生效。低收入長者可申請長者共付計劃以進一步降低費用。",
        "如你 65 岁以上，安大略药物福利自动生效。低收入长者可申请长者共付计划以进一步降低费用。",
      ),
      actionUrl: "https://www.ontario.ca/page/get-coverage-prescription-drugs",
    },
    {
      order: 2,
      title: tri("Under 65: apply to Trillium Drug Program", "65 歲以下：申請延齡草藥物計劃", "65 岁以下：申请延龄草药物计划"),
      description: tri(
        "If you have high drug costs relative to your income and no private plan, register for the Trillium Drug Program.",
        "如你藥費相對收入偏高且無私人計劃，可登記延齡草藥物計劃。",
        "如你药费相对收入偏高且无私人计划，可登记延龄草药物计划。",
      ),
      actionUrl: "https://www.ontario.ca/page/get-help-high-prescription-drug-costs",
    },
  ],
  requiredDocuments: [
    tri("Ontario health card (OHIP)", "安大略健康卡 (OHIP)", "安大略健康卡 (OHIP)"),
  ],
  officialInfoUrl: "https://www.ontario.ca/page/get-coverage-prescription-drugs",
  paymentFrequency: tri("Ongoing coverage", "持續保障", "持续保障"),
  tags: ["ontario", "health", "drugs", "prescriptions", "seniors"],
  relatedBenefits: ["cdcp"],
  lastUpdated: "2026-09-01",
};

// Ontario Senior Homeowners' Property Tax Grant -- income limits differ by
// marital status. Source (fetched 2026-09-02):
// https://www.ontario.ca/page/senior-homeowners-property-tax-grant
// The app applied the SINGLE limit ($50,000) to everyone, so a married couple
// earning between $50,000 and $60,000 was told they did not qualify when
// Ontario says they do.
const SHG_URL = "https://www.ontario.ca/page/senior-homeowners-property-tax-grant";
const SHG_SENTENCE =
  "you were single, divorced or widowed and earned less than $50,000 you were married or living common-law and you and your spouse/common-law partner earned a combined income of less than $60,000";

const SHG = figures({
  incomeLimitSingle: {
    current: { value: 50000, from: "2026-01-01", source: SHG_URL, quote: SHG_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income limit, single/divorced/widowed",
  },
  incomeLimitCouple: {
    current: { value: 60000, from: "2026-01-01", source: SHG_URL, quote: SHG_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Combined income limit, married or common-law",
  },
});

/** A couple is measured on combined income against the higher limit. */
const shgIsCouple = (c: { maritalStatus?: string }) =>
  c.maritalStatus === "married" || c.maritalStatus === "common-law";

export const ontarioSeniorHomeownerGrant: Benefit = {
  id: "ontario-senior-homeowner-grant",
  name: tri(
    "Ontario Senior Homeowners' Property Tax Grant",
    "安大略長者業主物業稅津貼",
    "安大略长者业主物业税津贴",
  ),
  shortName: "OSHPTG",
  category: "housing",
  level: "provincial-on",
  description: tri(
    "A yearly grant that helps low- to moderate-income senior homeowners in Ontario with their property taxes.",
    "協助安大略低至中等收入長者業主支付物業稅的年度津貼。",
    "帮助安大略低至中等收入长者业主支付物业税的年度津贴。",
  ),
  estimatedValue: tri(
    "Up to $500 per year",
    "每年最多 $500",
    "每年最多 $500",
  ),
  figures: SHG,
  contextFields: [
    "province",
    "isHomeowner",
    "age",
    "annualIncome",
    "familyIncome",
    "maritalStatus",
  ],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: isTrue((c) => c.isHomeowner),
      hard: true,
      passReason: tri("You own and live in your home.", "你擁有並居住於自己的住所。", "你拥有并居住于自己的住所。"),
      failReason: tri(
        "This grant is for senior homeowners who own their principal residence.",
        "此津貼適用於擁有主要住所的長者業主。",
        "此津贴适用于拥有主要住所的长者业主。",
      ),
      missingField: "isHomeowner",
    },
    {
      test: atLeast((c) => c.age, 64),
      hard: true,
      passReason: tri("You are 64 or older.", "你已年滿 64 歲。", "你已年满 64 岁。"),
      failReason: tri(
        "You must be 64 or older by the end of the year.",
        "你須在年底時年滿 64 歲。",
        "你须在年底时年满 64 岁。",
      ),
      missingField: "age",
    },
    {
      test: atMostOf(
        (c) => (shgIsCouple(c) ? c.familyIncome ?? c.annualIncome : c.annualIncome),
        (c) => (shgIsCouple(c) ? val(SHG.incomeLimitCouple) : val(SHG.incomeLimitSingle)),
      ),
      hard: false,
      passReason: tri(
        "Your income is within the range for the grant.",
        "你的收入在津貼範圍內。",
        "你的收入在津贴范围内。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 500, period: "year" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Claim it on your tax return", "於報稅表申索", "于报税表申索"),
      description: tri(
        "Apply on your income tax return (Form ON-BEN) for the year, reporting the property tax you paid.",
        "於當年的報稅表（ON-BEN 表格）申請，申報你已繳的物業稅。",
        "于当年的报税表（ON-BEN 表格）申请，申报你已缴的物业税。",
      ),
      actionUrl: "https://www.ontario.ca/page/senior-homeowners-property-tax-grant",
    },
  ],
  requiredDocuments: [
    tri("Property tax paid", "已繳物業稅", "已缴物业税"),
    tri("Filed tax return (ON-BEN)", "已報稅表 (ON-BEN)", "已报税表 (ON-BEN)"),
  ],
  officialInfoUrl: "https://www.ontario.ca/page/senior-homeowners-property-tax-grant",
  paymentFrequency: tri("Yearly", "每年", "每年"),
  tags: ["ontario", "seniors", "homeowner", "property-tax"],
  relatedBenefits: ["ontario-trillium"],
  lastUpdated: "2026-09-01",
};

// Low-Income Workers Tax Credit (LIFT) -- found by the discovery lane sweeping
// ontario.ca's own benefits index. Source (fetched 2026-09-02):
// https://www.ontario.ca/page/low-income-workers-tax-credit
//
// Reaches essentially every low-income worker in Ontario, which is why it
// ranked first in the Ontario queue.
const LIFT_URL = "https://www.ontario.ca/page/low-income-workers-tax-credit";

const LIFT = figures({
  maxCredit: {
    current: {
      value: 875,
      from: "2022-01-01",
      source: LIFT_URL,
      quote: "The maximum credit you can receive is $875",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum credit",
  },
  rateOfEmploymentIncome: {
    current: {
      value: 5.05,
      from: "2022-01-01",
      source: LIFT_URL,
      quote:
        "The maximum credit you can receive is $875 or 5.05% of your employment income, whichever is lower.",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "percent",
    label: "Share of employment income the credit cannot exceed",
  },
  individualIncomeLimit: {
    current: {
      value: 50000,
      from: "2022-01-01",
      source: LIFT_URL,
      quote: "your individual adjusted net income for the year must be below $50,000",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Individual income limit",
  },
  familyIncomeLimit: {
    current: {
      value: 82500,
      from: "2022-01-01",
      source: LIFT_URL,
      quote: "must be below $82,500 (previously $68,500 for the years 2019, 2020 and 2021)",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Family income limit",
  },
  individualReductionFrom: {
    current: {
      value: 32500,
      from: "2022-01-01",
      source: LIFT_URL,
      quote: "adjusted individual net income over $32,500",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Individual income where the credit starts to be reduced",
  },
  familyReductionFrom: {
    current: {
      value: 65000,
      from: "2022-01-01",
      source: LIFT_URL,
      quote: "adjusted family net income over $65,000",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Family income where the credit starts to be reduced",
  },
});

/**
 * Ontario reduces LIFT by 5% of the GREATER of two overages -- individual
 * income above $32,500 or family income above $65,000 -- so a modest household
 * income can reduce the credit even when the individual's own income is low.
 */
const liftEstimate = (ctx: AssessmentContext): AmountEstimate | undefined => {
  const individual = ctx.annualIncome;
  const family = ctx.familyIncome ?? individual;
  // Ontario states the maximum as "$875 or 5.05% of your employment income,
  // whichever is lower". Ignoring the second half overstates the credit for
  // part-time and low-wage workers, who are exactly who this credit is for:
  // at $10,000 of employment income the real cap is $505, not $875.
  const ceiling = val(LIFT.maxCredit);
  if (individual === undefined) return { low: 0, high: ceiling, period: "year" };
  const max = Math.min(ceiling, (val(LIFT.rateOfEmploymentIncome) / 100) * individual);

  const overIndividual = Math.max(0, individual - val(LIFT.individualReductionFrom));
  const overFamily = Math.max(0, (family ?? individual) - val(LIFT.familyReductionFrom));
  const reduction = 0.05 * Math.max(overIndividual, overFamily);
  const amount = Math.max(0, Math.round(max - reduction));
  return { low: amount, high: amount, period: "year" };
};

export const ontarioLift: Benefit = {
  id: "ontario-lift",
  name: tri(
    "Low-Income Workers Tax Credit (LIFT)",
    "低收入工作者稅務抵免 (LIFT)",
    "低收入工作者税务抵免 (LIFT)",
  ),
  shortName: "LIFT",
  category: "tax-credits",
  level: "provincial-on",
  description: tri(
    "A tax credit that lowers or removes the Ontario income tax owed by people with employment income and a low income. You get it by filing your tax return.",
    "為有工作收入的低收入人士減免安大略省入息稅的抵免。報稅即可獲得。",
    "为有工作收入的低收入人士减免安大略省入息税的抵免。报税即可获得。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(LIFT.maxCredit)}/year off your Ontario income tax`,
    `安大略省入息稅最多可減 ${fmt(LIFT.maxCredit)}`,
    `安大略省入息税最多可减 ${fmt(LIFT.maxCredit)}`,
  ),
  figures: LIFT,
  contextFields: ["province", "employmentStatus", "annualIncome", "familyIncome"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: oneOf((c) => c.employmentStatus, ["employed", "self-employed"]),
      hard: true,
      passReason: tri(
        "You have employment income, which this credit is based on.",
        "你有工作收入，此抵免以此為基礎。",
        "你有工作收入，此抵免以此为基础。",
      ),
      failReason: tri(
        "LIFT is for people with employment income.",
        "LIFT 適用於有工作收入的人士。",
        "LIFT 适用于有工作收入的人士。",
      ),
      missingField: "employmentStatus",
    },
    {
      test: lessThan((c) => c.annualIncome, val(LIFT.individualIncomeLimit)),
      hard: true,
      passReason: tri(
        "Your individual income is within the LIFT limit.",
        "你的個人收入在 LIFT 上限之內。",
        "你的个人收入在 LIFT 上限之内。",
      ),
      failReason: tri(
        `Your individual adjusted net income must be below ${fmt(LIFT.individualIncomeLimit)}.`,
        `個人經調整淨收入須低於 ${fmt(LIFT.individualIncomeLimit)}。`,
        `个人经调整净收入须低于 ${fmt(LIFT.individualIncomeLimit)}。`,
      ),
      missingField: "annualIncome",
    },
    {
      test: lessThan((c) => c.familyIncome, val(LIFT.familyIncomeLimit)),
      hard: false,
      passReason: tri(
        "Your family income is within the LIFT limit.",
        "你的家庭收入在 LIFT 上限之內。",
        "你的家庭收入在 LIFT 上限之内。",
      ),
      failReason: tri(
        `Family adjusted net income must be below ${fmt(LIFT.familyIncomeLimit)}.`,
        `家庭經調整淨收入須低於 ${fmt(LIFT.familyIncomeLimit)}。`,
        `家庭经调整净收入须低于 ${fmt(LIFT.familyIncomeLimit)}。`,
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: liftEstimate,
  applicationSteps: [
    {
      order: 1,
      title: tri("File your Ontario tax return", "報安大略省稅表", "报安大略省税表"),
      description: tri(
        "There is no separate application. Complete Schedule ON428-A with your return and the credit is applied automatically.",
        "無需另行申請。報稅時填寫 ON428-A 附表，抵免會自動計算。",
        "无需另行申请。报税时填写 ON428-A 附表，抵免会自动计算。",
      ),
      actionUrl: LIFT_URL,
    },
  ],
  requiredDocuments: [
    tri("T4 slips or self-employment records", "T4 表或自僱收入記錄", "T4 表或自雇收入记录"),
  ],
  officialInfoUrl: LIFT_URL,
  paymentFrequency: tri("Yearly, at tax time", "每年報稅時", "每年报税时"),
  tags: ["ontario", "tax-credit", "workers", "low-income", "employment"],
  relatedBenefits: ["cwb", "ontario-trillium"],
  lastUpdated: "2026-09-02",
};

// ---------------------------------------------------------------------------
// Added 2026-09-02 from the discovery lane's Ontario sweep. Every figure below
// was researched against ontario.ca and re-verified by
// scripts/crawl/validate-spec.ts, which re-fetches each cited page and
// confirms the quote is actually on it.
// ---------------------------------------------------------------------------

const CARE_URL = "https://www.ontario.ca/page/ontario-child-care-tax-credit";

const CARE = figures({
  maxExpensePerChildUnder7: {
    current: {
      value: 6000,
      from: "2022-01-01",
      source: CARE_URL,
      quote: "$6,000 per child under the age of seven (plus a top-up of up to $1,200 for 2021)",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum claimable child care expense, child under 7",
  },
  maxExpensePerChild7to16: {
    current: {
      value: 3750,
      from: "2022-01-01",
      source: CARE_URL,
      quote: "$3,750 per child between the ages of seven and 16 (plus a top-up of up to $750 for 2021)",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum claimable child care expense, child aged 7 to 16",
  },
  familyIncomeCeiling: {
    current: {
      value: 150000,
      from: "2022-01-01",
      source: CARE_URL,
      quote: "have a family income less than or equal to $150,000",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Family income ceiling",
  },
  maxRate: {
    current: {
      value: 75,
      from: "2022-01-01",
      source: CARE_URL,
      quote:
        "Eligible families can claim up to 75% of their eligible child care expenses, including services provided by child care centres, homes and camps.",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "percent",
    label: "Maximum credit rate",
  },
});

/**
 * Best case only. The real credit is a sliding percentage of child care
 * expenses ACTUALLY PAID, and the intake never asks what a family spends, so
 * an exact figure is not computable. The range runs from 0 to the maximum a
 * family of this shape could claim, and the note says why.
 *
 * Ontario's bands are "under 7" and "7 to 16"; the app records childrenUnder6.
 * Six-year-olds are therefore counted in the lower-value band, which
 * understates rather than overstates.
 */
const careEstimate = (ctx: AssessmentContext): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const total = Math.max(1, ctx.numberOfChildren ?? 1);
  const younger = Math.min(total, ctx.childrenUnder6 ?? 0);
  const older = total - younger;
  const expenses =
    val(CARE.maxExpensePerChildUnder7) * younger + val(CARE.maxExpensePerChild7to16) * older;
  const high = Math.round((val(CARE.maxRate) / 100) * expenses);
  return {
    low: 0,
    high,
    period: "year",
    note: tri(
      "Depends on what you actually spend on child care. This is the most a family your size could claim.",
      "視乎你實際支付的托兒費用。此為你家庭人數可申領的上限。",
      "视乎你实际支付的托儿费用。此为你家庭人数可申领的上限。",
    ),
  };
};

export const ontarioChildCareTaxCredit: Benefit = {
  id: "ontario-child-care-tax-credit",
  name: tri(
    "Ontario Child Care Tax Credit (CARE)",
    "安大略兒童托育稅務抵免 (CARE)",
    "安大略儿童托育税务抵免 (CARE)",
  ),
  shortName: "CARE",
  category: "tax-credits",
  level: "provincial-on",
  description: tri(
    "A refundable tax credit that gives back up to 75% of what you spend on child care, with the largest share going to lower-income families. You claim it on your tax return.",
    "可退還的稅務抵免，最多退回你托兒開支的 75%，收入越低退回比例越高。報稅時申領。",
    "可退还的税务抵免，最多退回你托儿开支的 75%，收入越低退回比例越高。报税时申领。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(CARE.maxRate)} of child care costs, on expenses up to ${fmt(CARE.maxExpensePerChildUnder7)} per child under 7`,
    `最多退回托兒開支的 ${fmt(CARE.maxRate)}，未滿 7 歲子女每人開支上限 ${fmt(CARE.maxExpensePerChildUnder7)}`,
    `最多退回托儿开支的 ${fmt(CARE.maxRate)}，未满 7 岁子女每人开支上限 ${fmt(CARE.maxExpensePerChildUnder7)}`,
  ),
  figures: CARE,
  contextFields: ["province", "hasChildren", "numberOfChildren", "childrenUnder6", "familyIncome"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: tri("You have children in your care.", "你有子女需要照顧。", "你有子女需要照顾。"),
      failReason: tri(
        "This credit is for families paying for child care.",
        "此抵免適用於支付托兒費用的家庭。",
        "此抵免适用于支付托儿费用的家庭。",
      ),
      missingField: "hasChildren",
    },
    {
      test: atMost((c) => c.familyIncome, val(CARE.familyIncomeCeiling)),
      hard: true,
      passReason: tri(
        "Your family income is within the limit for this credit.",
        "你的家庭收入在此抵免的上限之內。",
        "你的家庭收入在此抵免的上限之内。",
      ),
      failReason: tri(
        `Family income must be ${fmt(CARE.familyIncomeCeiling)} or less.`,
        `家庭收入須為 ${fmt(CARE.familyIncomeCeiling)} 或以下。`,
        `家庭收入须为 ${fmt(CARE.familyIncomeCeiling)} 或以下。`,
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: careEstimate,
  applicationSteps: [
    {
      order: 1,
      title: tri("Claim it on your tax return", "報稅時申領", "报税时申领"),
      description: tri(
        "You must also be eligible for the federal Child Care Expense Deduction. Keep your child care receipts.",
        "你亦須符合聯邦托兒開支扣除的資格。請保留托兒收據。",
        "你亦须符合联邦托儿开支扣除的资格。请保留托儿收据。",
      ),
      actionUrl: CARE_URL,
    },
  ],
  requiredDocuments: [
    tri("Child care receipts", "托兒收據", "托儿收据"),
    tri("Filed tax return", "已報稅表", "已报税表"),
  ],
  officialInfoUrl: CARE_URL,
  paymentFrequency: tri("Yearly, at tax time", "每年報稅時", "每年报税时"),
  tags: ["ontario", "tax-credit", "child-care", "family", "children"],
  relatedBenefits: ["ontario-child-benefit", "ccb"],
  lastUpdated: "2026-09-02",
};

const HSO_URL = "https://www.ontario.ca/page/get-dental-care";

const HSO = figures({
  maxAge: {
    current: {
      value: 17,
      from: "2026-07-01",
      source: HSO_URL,
      quote: "You can apply for your children if they: are 17 years of age and under",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "number",
    label: "Oldest age a child can be",
  },
  incomeThresholdOneChild: {
    current: {
      value: 29065,
      from: "2026-07-01",
      source: HSO_URL,
      quote: "1 child $29,065 or lower",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Household income limit with one child",
  },
  incomeThresholdPerAdditionalChild: {
    current: {
      value: 2200,
      from: "2026-07-01",
      source: HSO_URL,
      quote:
        "10 or more children $48,865 or lower. Add $2,200 for each additional dependent child to determine the income level at which your family would qualify for Healthy Smiles Ontario.",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Added to the income limit for each additional child",
  },
});

/**
 * Household income limit for a family with this many children.
 *
 * Ontario publishes a ten-row table, but it is an arithmetic series: $29,065
 * for one child, rising $2,200 per additional child, which reproduces every
 * published row up to "10 or more children $48,865" and continues beyond it
 * exactly as the page instructs. Two anchored figures instead of ten, and a
 * test checks the formula against the published table.
 */
export const hsoIncomeLimit = (children: number | undefined): number | undefined => {
  if (children === undefined || Number.isNaN(children) || children < 1) return undefined;
  return (
    val(HSO.incomeThresholdOneChild) +
    val(HSO.incomeThresholdPerAdditionalChild) * (children - 1)
  );
};

export const ontarioHealthySmiles: Benefit = {
  id: "ontario-healthy-smiles",
  name: tri(
    "Healthy Smiles Ontario",
    "安大略健康笑容牙科計劃",
    "安大略健康笑容牙科计划",
  ),
  shortName: "HSO",
  category: "health",
  level: "provincial-on",
  description: tri(
    "Free dental care for children and teenagers 17 and under in lower-income households, including check-ups, cleaning, fillings and urgent care.",
    "為低收入家庭 17 歲或以下兒童及青少年提供免費牙科護理，包括檢查、洗牙、補牙及緊急治療。",
    "为低收入家庭 17 岁或以下儿童及青少年提供免费牙科护理，包括检查、洗牙、补牙及紧急治疗。",
  ),
  estimatedValue: tri(
    "Free dental care for each eligible child",
    "每名合資格子女可獲免費牙科護理",
    "每名合资格子女可获免费牙科护理",
  ),
  figures: HSO,
  contextFields: ["province", "hasChildren", "numberOfChildren", "youngestChildAge", "familyIncome"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: tri("You have children in your care.", "你有子女需要照顧。", "你有子女需要照顾。"),
      failReason: tri(
        "This program covers children 17 and under.",
        "此計劃保障 17 歲或以下兒童。",
        "此计划保障 17 岁或以下儿童。",
      ),
      missingField: "hasChildren",
    },
    {
      test: atMost((c) => c.youngestChildAge, val(HSO.maxAge)),
      hard: true,
      passReason: tri(
        "You have a child 17 or under.",
        "你有 17 歲或以下的子女。",
        "你有 17 岁或以下的子女。",
      ),
      failReason: tri(
        `Children must be ${fmt(HSO.maxAge)} or under.`,
        `子女須為 ${fmt(HSO.maxAge)} 歲或以下。`,
        `子女须为 ${fmt(HSO.maxAge)} 岁或以下。`,
      ),
      missingField: "youngestChildAge",
    },
    {
      // The limit rises with each child, so a fixed ceiling would wrongly
      // exclude larger families.
      test: atMostOf((c) => c.familyIncome, (c) => hsoIncomeLimit(c.numberOfChildren)),
      hard: true,
      passReason: tri(
        "Your household income is within the limit for your family size.",
        "你的家庭收入在你家庭人數對應的上限之內。",
        "你的家庭收入在你家庭人数对应的上限之内。",
      ),
      failReason: tri(
        `The income limit depends on how many children you have — ${fmt(HSO.incomeThresholdOneChild)} for one child, rising ${fmt(HSO.incomeThresholdPerAdditionalChild)} for each additional child.`,
        `收入上限視子女人數而定——一名子女為 ${fmt(HSO.incomeThresholdOneChild)}，每多一名子女增加 ${fmt(HSO.incomeThresholdPerAdditionalChild)}。`,
        `收入上限视子女人数而定——一名子女为 ${fmt(HSO.incomeThresholdOneChild)}，每多一名子女增加 ${fmt(HSO.incomeThresholdPerAdditionalChild)}。`,
      ),
      missingField: "familyIncome",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply online or through your public health unit", "網上或透過公共衞生單位申請", "网上或通过公共卫生单位申请"),
      description: tri(
        "Apply once for all eligible children in the household. Coverage continues while you qualify.",
        "一次過為家中所有合資格子女申請。合資格期間持續獲得保障。",
        "一次过为家中所有合资格子女申请。合资格期间持续获得保障。",
      ),
      actionUrl: HSO_URL,
    },
  ],
  requiredDocuments: [
    tri("Proof of income (notice of assessment)", "收入證明（評稅通知書）", "收入证明（评税通知书）"),
    tri("Ontario address and child's details", "安大略地址及子女資料", "安大略地址及子女资料"),
  ],
  officialInfoUrl: HSO_URL,
  paymentFrequency: tri("Ongoing coverage", "持續保障", "持续保障"),
  tags: ["ontario", "dental", "children", "health", "low-income"],
  relatedBenefits: ["cdcp", "ontario-child-benefit"],
  lastUpdated: "2026-09-02",
};

const SCAH_URL = "https://www.ontario.ca/page/ontario-seniors-care-home-tax-credit";
const SCAH_SENTENCE =
  "The credit provides up to 25% of claimable medical expenses up to $6,000, for a maximum credit of $1,500. This amount is reduced by 5% of family net income over $35,000 and fully phased out by at most $65,000.";

const SCAH = figures({
  maxCredit: {
    current: { value: 1500, from: "2022-01-01", source: SCAH_URL, quote: SCAH_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum credit",
  },
  reductionStartsAt: {
    current: { value: 35000, from: "2022-01-01", source: SCAH_URL, quote: SCAH_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Family net income where the credit starts to be reduced",
  },
  fullyPhasedOutAt: {
    current: { value: 65000, from: "2022-01-01", source: SCAH_URL, quote: SCAH_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Family net income at which the credit reaches zero",
  },
  minAge: {
    current: {
      value: 70,
      from: "2022-01-01",
      source: SCAH_URL,
      quote:
        "turned 70 years of age or older in the year, or have a spouse or common-law partner who turned 70 years of age or older in the year",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "number",
    label: "Minimum age",
  },
});

/**
 * Upper bound only. The credit is 25% of medical expenses actually claimed,
 * which the intake does not collect, so the low end stays at zero.
 */
const scahEstimate = (ctx: AssessmentContext): AmountEstimate | undefined => {
  const max = val(SCAH.maxCredit);
  const income = ctx.familyIncome;
  if (income === undefined) return { low: 0, high: max, period: "year" };
  const over = Math.max(0, income - val(SCAH.reductionStartsAt));
  const high = Math.max(0, Math.round(max - 0.05 * over));
  return {
    low: 0,
    high,
    period: "year",
    note: tri(
      "Depends on the medical expenses you claim. This is the most you could receive at your income.",
      "視乎你申報的醫療開支。此為你收入水平下可獲的上限。",
      "视乎你申报的医疗开支。此为你收入水平下可获的上限。",
    ),
  };
};

export const ontarioSeniorsCareAtHome: Benefit = {
  id: "ontario-seniors-care-at-home",
  name: tri(
    "Ontario Seniors Care at Home Tax Credit",
    "安大略長者居家照護稅務抵免",
    "安大略长者居家照护税务抵免",
  ),
  shortName: "SCAH",
  category: "seniors",
  level: "provincial-on",
  description: tri(
    "A refundable tax credit for lower-income seniors that gives back a quarter of eligible medical expenses, such as attendant care, walkers and hearing aids.",
    "為低收入長者提供的可退還稅務抵免，退回四分之一的合資格醫療開支，例如看護服務、助行器及助聽器。",
    "为低收入长者提供的可退还税务抵免，退回四分之一的合资格医疗开支，例如看护服务、助行器及助听器。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(SCAH.maxCredit)}/year back on medical expenses`,
    `醫療開支每年最多退回 ${fmt(SCAH.maxCredit)}`,
    `医疗开支每年最多退回 ${fmt(SCAH.maxCredit)}`,
  ),
  figures: SCAH,
  contextFields: ["province", "age", "familyIncome"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, val(SCAH.minAge)),
      hard: true,
      passReason: tri("You are 70 or older.", "你已年滿 70 歲。", "你已年满 70 岁。"),
      failReason: tri(
        `You, or your spouse, must turn ${fmt(SCAH.minAge)} or older during the year.`,
        `你或你的配偶須於年內年滿 ${fmt(SCAH.minAge)} 歲。`,
        `你或你的配偶须于年内年满 ${fmt(SCAH.minAge)} 岁。`,
      ),
      missingField: "age",
    },
    {
      test: atMost((c) => c.familyIncome, val(SCAH.fullyPhasedOutAt)),
      hard: true,
      passReason: tri(
        "Your family income is low enough to receive some of this credit.",
        "你的家庭收入足夠低，可獲部分此抵免。",
        "你的家庭收入足够低，可获部分此抵免。",
      ),
      failReason: tri(
        `The credit is fully phased out at ${fmt(SCAH.fullyPhasedOutAt)} family net income.`,
        `家庭淨收入達 ${fmt(SCAH.fullyPhasedOutAt)} 時此抵免會完全取消。`,
        `家庭净收入达 ${fmt(SCAH.fullyPhasedOutAt)} 时此抵免会完全取消。`,
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: scahEstimate,
  applicationSteps: [
    {
      order: 1,
      title: tri("Claim it on your tax return", "報稅時申領", "报税时申领"),
      description: tri(
        "Keep receipts for eligible medical expenses. This credit is on top of the federal and Ontario medical expense credits, not instead of them.",
        "保留合資格醫療開支收據。此抵免可與聯邦及安大略醫療開支抵免同時申領，並非二擇其一。",
        "保留合资格医疗开支收据。此抵免可与联邦及安大略医疗开支抵免同时申领，并非二择其一。",
      ),
      actionUrl: SCAH_URL,
    },
  ],
  requiredDocuments: [
    tri("Receipts for medical expenses", "醫療開支收據", "医疗开支收据"),
    tri("Filed tax return", "已報稅表", "已报税表"),
  ],
  officialInfoUrl: SCAH_URL,
  paymentFrequency: tri("Yearly, at tax time", "每年報稅時", "每年报税时"),
  tags: ["ontario", "seniors", "medical", "tax-credit", "home-care"],
  relatedBenefits: ["medical-expense", "ontario-trillium"],
  lastUpdated: "2026-09-02",
};

export const ontarioBenefits: Benefit[] = [
  ontarioTrillium,
  ontarioWorks,
  odsp,
  ontarioChildBenefit,
  ontarioGains,
  ontarioDrugBenefit,
  ontarioSeniorHomeownerGrant,
  ontarioLift,
  ontarioChildCareTaxCredit,
  ontarioHealthySmiles,
  ontarioSeniorsCareAtHome,
];
