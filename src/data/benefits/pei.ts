import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { atLeast, atMost, buildCheck, isTrue, oneOf } from "@/lib/checks";
import { figures, fmt, val } from "@/lib/figures";

const PEI_CRA_URL =
  "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-prince-edward-island.html";

const PEI_STC = figures({
  individualMax: {
    current: {
      value: 310,
      from: "2026-07-01",
      source: PEI_CRA_URL,
      quote:
        "The program provides an annual credit of up to $310 for an individual or up to $365 for couples and single parents.",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Maximum annual credit, individual",
  },
  coupleMax: {
    current: {
      value: 365,
      from: "2026-07-01",
      source: PEI_CRA_URL,
      quote:
        "The program provides an annual credit of up to $310 for an individual or up to $365 for couples and single parents.",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Maximum annual credit, couples and single parents",
  },
});

const PE = oneOf((c: { province?: string }) => c.province, ["PE"]);
const peFail = tri(
  "This program is for residents of Prince Edward Island.",
  "此計劃適用於愛德華王子島省居民。",
  "此计划适用于爱德华王子岛省居民。",
);
const pePass = tri(
  "You live in Prince Edward Island.",
  "你居住在愛德華王子島省。",
  "你居住在爱德华王子岛省。",
);

const PEICB = figures({
  lowerBandMonthly: {
    current: {
      value: 34.16,
      from: "2026-07-01",
      source: PEI_CRA_URL,
      quote:
        "$34.16 per month for each child under 18 years of age if your adjusted family net income is less than $45000",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency-cents",
    label: "Monthly amount per child, income under $45,000",
  },
  higherBandMonthly: {
    current: {
      value: 24.16,
      from: "2026-07-01",
      source: PEI_CRA_URL,
      quote:
        "$24.16 per month for each child under 18 years of age if your adjusted family net income is between $45000 and $80000",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency-cents",
    label: "Monthly amount per child, income $45,000-$80,000",
  },
  lowerBandCeiling: {
    current: {
      value: 45000,
      from: "2026-07-01",
      source: PEI_CRA_URL,
      quote: "if your adjusted family net income is less than $45000",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Income under which the higher monthly rate applies",
  },
  phaseOutCeiling: {
    current: {
      value: 80000,
      from: "2026-07-01",
      source: PEI_CRA_URL,
      quote:
        "If your adjusted family net income is greater than $80000, the amount is reduced to zero.",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Income above which the benefit is zero",
  },
});

const PEICB_LOW_ANNUAL = Math.round(val(PEICB.higherBandMonthly) * 12);
const PEICB_HIGH_ANNUAL = Math.round(val(PEICB.lowerBandMonthly) * 12);

const peiChildEstimate = (ctx: {
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const n = ctx.numberOfChildren ?? 1;
  const income = ctx.familyIncome;
  if (income === undefined)
    return { low: 0, high: PEICB_HIGH_ANNUAL * n, period: "year" };
  if (income < val(PEICB.lowerBandCeiling))
    return { low: PEICB_HIGH_ANNUAL * n, high: PEICB_HIGH_ANNUAL * n, period: "year" };
  if (income < val(PEICB.phaseOutCeiling))
    return { low: PEICB_LOW_ANNUAL * n, high: PEICB_LOW_ANNUAL * n, period: "year" };
  return { low: 0, high: 0, period: "year" };
};

export const peiSalesTaxCredit: Benefit = {
  id: "pei-sales-tax-credit",
  name: tri(
    "PEI Sales Tax Credit",
    "愛德華王子島銷售稅抵免",
    "爱德华王子岛销售税抵免",
  ),
  shortName: "PEI STC",
  category: "tax-credits",
  level: "provincial-pe",
  description: tri(
    "A tax-free payment that helps low- and modest-income Islanders with the sales tax. You get it automatically by filing your taxes.",
    "協助愛德華王子島低及中等收入居民應付銷售稅的免稅款項。報稅即自動獲得。",
    "帮助爱德华王子岛低及中等收入居民应付销售税的免税款项。报税即自动获得。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(PEI_STC.individualMax)}/year (individual) or ${fmt(PEI_STC.coupleMax)}/year (couples and single parents)`,
    `個人最多每年 ${fmt(PEI_STC.individualMax)}，夫婦及單親家庭最多 ${fmt(PEI_STC.coupleMax)}`,
    `个人最多每年 ${fmt(PEI_STC.individualMax)}，夫妇及单亲家庭最多 ${fmt(PEI_STC.coupleMax)}`,
  ),
  contextFields: ["province", "filedTaxes", "maritalStatus", "hasChildren", "familyIncome"],
  check: buildCheck([
    { test: PE, hard: true, passReason: pePass, failReason: peFail, missingField: "province" },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: true,
      passReason: tri(
        "You file taxes, which is how this credit is paid.",
        "你有報稅，這是發放此抵免的方式。",
        "你有报税，这是发放此抵免的方式。",
      ),
      failReason: tri("You must file a tax return to receive it.", "你須報稅才能領取。", "你须报税才能领取。"),
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
  estimateAmount: (ctx) => {
    const higher =
      ctx.maritalStatus === "married" ||
      ctx.maritalStatus === "common-law" ||
      ctx.hasChildren === true;
    return {
      low: 0,
      high: higher ? val(PEI_STC.coupleMax) : val(PEI_STC.individualMax),
      period: "year",
    };
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
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-prince-edward-island.html",
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-prince-edward-island.html",
  paymentFrequency: tri("Quarterly", "每季", "每季"),
  tags: ["pei", "tax", "low-income", "quarterly"],
  relatedBenefits: ["cgeb"],
  figures: PEI_STC,
  lastUpdated: "2026-09-03",
};

export const peiChildBenefit: Benefit = {
  id: "pei-child-benefit",
  name: tri("PEI Child Benefit", "愛德華王子島兒童福利", "爱德华王子岛儿童福利"),
  shortName: "PEICB",
  category: "family",
  level: "provincial-pe",
  description: tri(
    "A tax-free monthly amount for low- and middle-income PEI families with children under 18, paid with the Canada Child Benefit. It began in 2025.",
    "為愛德華王子島低及中等收入、有 18 歲以下子女家庭提供的免稅每月款項，與加拿大兒童福利一併發放。2025 年起實施。",
    "为爱德华王子岛低及中等收入、有 18 岁以下子女家庭提供的免税每月款项，与加拿大儿童福利一并发放。2025 年起实施。",
  ),
  estimatedValue: tri(
    `Up to about $${PEICB_HIGH_ANNUAL}/year per child (income under ${fmt(PEICB.lowerBandCeiling)}); less up to ${fmt(PEICB.phaseOutCeiling)}`,
    `每名子女最多約每年 $${PEICB_HIGH_ANNUAL}（收入低於 ${fmt(PEICB.lowerBandCeiling)}）；至 ${fmt(PEICB.phaseOutCeiling)} 較少`,
    `每名子女最多约每年 $${PEICB_HIGH_ANNUAL}（收入低于 ${fmt(PEICB.lowerBandCeiling)}）；至 ${fmt(PEICB.phaseOutCeiling)} 较少`,
  ),
  contextFields: ["province", "hasChildren", "numberOfChildren", "familyIncome"],
  prerequisites: ["ccb"],
  check: buildCheck([
    { test: PE, hard: true, passReason: pePass, failReason: peFail, missingField: "province" },
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
      test: atMost((c) => c.familyIncome, val(PEICB.phaseOutCeiling)),
      hard: true,
      passReason: tri(
        "Your income is within the range for this benefit.",
        "你的收入在此福利的範圍內。",
        "你的收入在此福利的范围内。",
      ),
      failReason: tri(
        `The PEI Child Benefit phases out above ${fmt(PEICB.phaseOutCeiling)} of family income.`,
        `愛德華王子島兒童福利在家庭收入 ${fmt(PEICB.phaseOutCeiling)} 以上逐步取消。`,
        `爱德华王子岛儿童福利在家庭收入 ${fmt(PEICB.phaseOutCeiling)} 以上逐步取消。`,
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: (ctx) => peiChildEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("File your taxes", "報稅", "报税"),
      description: tri(
        "No separate application. Receive the Canada Child Benefit and file taxes; the PEI Child Benefit is added automatically.",
        "無需另行申請。領取加拿大兒童福利並報稅後，會自動加入愛德華王子島兒童福利。",
        "无需另行申请。领取加拿大儿童福利并报税后，会自动加入爱德华王子岛儿童福利。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-prince-edward-island.html",
    },
  ],
  requiredDocuments: [tri("Filed tax returns", "已報稅表", "已报税表")],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-prince-edward-island.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["pei", "family", "children", "low-income"],
  relatedBenefits: ["ccb"],
  figures: PEICB,
  lastUpdated: "2026-09-03",
};

export const peiSocialAssistance: Benefit = {
  id: "pei-social-assistance",
  name: tri(
    "PEI Social Assistance",
    "愛德華王子島社會援助",
    "爱德华王子岛社会援助",
  ),
  shortName: "Social Assistance",
  category: "income-support",
  level: "provincial-pe",
  description: tri(
    "Monthly help for Islanders who cannot meet their basic needs, covering food, shelter, and other essentials, plus help returning to work.",
    "為無法滿足基本需要的愛德華王子島居民提供每月援助，涵蓋食物、住屋及其他必需品，並協助重投工作。",
    "为无法满足基本需要的爱德华王子岛居民提供每月援助，涵盖食物、住房及其他必需品，并帮助重投工作。",
  ),
  estimatedValue: tri(
    "Covers basic needs and shelter for those in financial need",
    "為有經濟需要人士涵蓋基本需要及住屋",
    "为有经济需要人士涵盖基本需要及住房",
  ),
  contextFields: ["province", "annualIncome"],
  check: buildCheck([
    { test: PE, hard: true, passReason: pePass, failReason: peFail, missingField: "province" },
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
        "Social Assistance is a last resort for people with very little income and assets.",
        "社會援助是為收入及資產極少人士而設的最後保障。",
        "社会援助是为收入及资产极少人士而设的最后保障。",
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
        "Apply by phone or in person. Your income, assets, and household are assessed.",
        "以電話或親身申請，會評估你的收入、資產及家庭。",
        "以电话或亲身申请，会评估你的收入、资产及家庭。",
      ),
      actionUrl:
        "https://www.princeedwardisland.ca/en/information/social-development-and-seniors/social-assistance-program",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl:
    "https://www.princeedwardisland.ca/en/information/social-development-and-seniors/social-assistance-program",
  officialInfoUrl:
    "https://www.princeedwardisland.ca/en/information/social-development-and-seniors/social-assistance-program",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["pei", "low-income", "assistance", "last-resort"],
  relatedBenefits: ["pei-accessability"],
  lastUpdated: "2026-09-01",
};

export const peiAccessAbility: Benefit = {
  id: "pei-accessability",
  name: tri(
    "AccessAbility Supports (PEI)",
    "AccessAbility 支援（愛德華王子島）",
    "AccessAbility 支援（爱德华王子岛）",
  ),
  shortName: "AccessAbility",
  category: "disability",
  level: "provincial-pe",
  description: tri(
    "Support for Islanders with a disability — including an Assured Income for basic needs, and funding for disability-related supports and equipment.",
    "為愛德華王子島殘障人士提供支援 — 包括基本需要的保障收入，以及與殘障相關的支援及設備資助。",
    "为爱德华王子岛残障人士提供支援 — 包括基本需要的保障收入，以及与残障相关的支援及设备资助。",
  ),
  estimatedValue: tri(
    "Assured Income plus disability-related supports",
    "保障收入及與殘障相關的支援",
    "保障收入及与残障相关的支援",
  ),
  contextFields: ["province", "hasDisability"],
  check: buildCheck([
    { test: PE, hard: true, passReason: pePass, failReason: peFail, missingField: "province" },
    {
      test: isTrue((c) => c.hasDisability),
      hard: true,
      passReason: tri(
        "You have a disability the program supports.",
        "你有此計劃支援的殘障。",
        "你有此计划支援的残障。",
      ),
      failReason: tri(
        "This program is for people with a disability.",
        "此計劃適用於殘障人士。",
        "此计划适用于残障人士。",
      ),
      missingField: "hasDisability",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply for AccessAbility Supports", "申請 AccessAbility 支援", "申请 AccessAbility 支援"),
      description: tri(
        "Contact the Province. An assessment identifies the income and disability supports you need.",
        "聯絡省政府。評估會找出你所需的收入及殘障支援。",
        "联系省政府。评估会找出你所需的收入及残障支援。",
      ),
      actionUrl:
        "https://www.princeedwardisland.ca/en/information/social-development-and-seniors/accessability-supports",
    },
  ],
  requiredDocuments: [
    tri("Information about your disability and support needs", "有關你殘障及支援需要的資料", "有关你残障及支援需要的资料"),
  ],
  applicationUrl:
    "https://www.princeedwardisland.ca/en/information/social-development-and-seniors/accessability-supports",
  officialInfoUrl:
    "https://www.princeedwardisland.ca/en/information/social-development-and-seniors/accessability-supports",
  paymentFrequency: tri("Monthly / as needed", "每月／按需要", "每月／按需要"),
  tags: ["pei", "disability", "income", "support"],
  relatedBenefits: ["dtc", "cdb"],
  lastUpdated: "2026-09-01",
};

export const peiBenefits: Benefit[] = [
  peiSalesTaxCredit,
  peiChildBenefit,
  peiSocialAssistance,
  peiAccessAbility,
];
