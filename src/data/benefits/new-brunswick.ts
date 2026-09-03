import type { AmountEstimate, AssessmentContext, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, buildCheck, isTrue, oneOf } from "@/lib/checks";

const NB = oneOf((c: { province?: string }) => c.province, ["NB"]);
const nbFail = tri(
  "This program is for residents of New Brunswick.",
  "此計劃適用於新不倫瑞克省居民。",
  "此计划适用于新不伦瑞克省居民。",
);
const nbPass = tri("You live in New Brunswick.", "你居住在新不倫瑞克省。", "你居住在新不伦瑞克省。");

// New Brunswick Low-Income Seniors Benefit -- the province states the annual
// amount for the current year on its own page. The app showed $616 (2025)
// after the page moved to the 2026 figure.
const NB_SENIORS_URL =
  "https://www2.gnb.ca/content/gnb/en/corporate/promo/new-brunswick-low-income-seniors-benefit.html";

const NB_SENIORS = figures({
  annualBenefit: {
    current: {
      value: 629,
      from: "2026-01-01",
      source: NB_SENIORS_URL,
      quote: "To qualify for the 2026 annual benefit of $629",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Annual benefit",
  },
});

export const nbSeniorsBenefit: Benefit = {
  id: "nb-seniors-benefit",
  name: tri(
    "New Brunswick Low-Income Seniors' Benefit",
    "新不倫瑞克低收入長者福利",
    "新不伦瑞克低收入长者福利",
  ),
  shortName: "NB Seniors' Benefit",
  category: "seniors",
  level: "provincial-nb",
  description: tri(
    "A yearly payment for low-income New Brunswick seniors who receive a federal Old Age Security benefit such as the Guaranteed Income Supplement or the Allowance.",
    "為領取聯邦老年保障福利（如保證收入補助金或津貼）的新不倫瑞克低收入長者提供的年度款項。",
    "为领取联邦老年保障福利（如保证收入补助金或津贴）的新不伦瑞克低收入长者提供的年度款项。",
  ),
  estimatedValue: tri(
    `${fmt(NB_SENIORS.annualBenefit)} per year`,
    `每年 ${fmt(NB_SENIORS.annualBenefit)}`,
    `每年 ${fmt(NB_SENIORS.annualBenefit)}`,
  ),
  figures: NB_SENIORS,
  contextFields: ["province", "age", "annualIncome"],
  prerequisites: ["gis"],
  check: buildCheck([
    { test: NB, hard: true, passReason: nbPass, failReason: nbFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 60),
      hard: true,
      passReason: tri(
        "You are old enough to receive a federal OAS benefit.",
        "你已達可領取聯邦 OAS 福利的年齡。",
        "你已达可领取联邦 OAS 福利的年龄。",
      ),
      failReason: tri(
        "You must receive a federal OAS benefit (GIS at 65+, or the Allowance at 60-64).",
        "你須領取聯邦 OAS 福利（65 歲以上的 GIS，或 60-64 歲的津貼）。",
        "你须领取联邦 OAS 福利（65 岁以上的 GIS，或 60-64 岁的津贴）。",
      ),
      missingField: "age",
    },
    {
      test: atMost((c) => c.annualIncome, 30000),
      hard: true,
      passReason: tri(
        "Your income is low enough to receive a federal GIS or Allowance.",
        "你的收入足夠低以領取聯邦 GIS 或津貼。",
        "你的收入足够低以领取联邦 GIS 或津贴。",
      ),
      failReason: tri(
        "This benefit is for seniors receiving the income-tested federal GIS or Allowance.",
        "此福利適用於領取按收入審查的聯邦 GIS 或津貼的長者。",
        "此福利适用于领取按收入审查的联邦 GIS 或津贴的长者。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({
    low: val(NB_SENIORS.annualBenefit),
    high: val(NB_SENIORS.annualBenefit),
    period: "year",
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply each year", "每年申請", "每年申请"),
      description: tri(
        "Apply through the Province during the application period. You must reapply every year.",
        "在申請期內向省政府申請。你每年都須重新申請。",
        "在申请期内向省政府申请。你每年都须重新申请。",
      ),
      actionUrl:
        "https://www2.gnb.ca/content/gnb/en/corporate/promo/new-brunswick-low-income-seniors-benefit.html",
    },
  ],
  requiredDocuments: [
    tri("Proof you receive OAS/GIS or the Allowance", "領取 OAS／GIS 或津貼的證明", "领取 OAS／GIS 或津贴的证明"),
  ],
  applicationUrl:
    "https://www2.gnb.ca/content/gnb/en/corporate/promo/new-brunswick-low-income-seniors-benefit.html",
  officialInfoUrl:
    "https://www2.gnb.ca/content/gnb/en/corporate/promo/new-brunswick-low-income-seniors-benefit.html",
  paymentFrequency: tri("Yearly", "每年", "每年"),
  tags: ["new-brunswick", "seniors", "low-income"],
  relatedBenefits: ["gis", "oas", "oas-allowance"],
  lastUpdated: "2026-09-01",
};

export const nbSocialAssistance: Benefit = {
  id: "nb-social-assistance",
  name: tri(
    "New Brunswick Social Assistance",
    "新不倫瑞克社會援助",
    "新不伦瑞克社会援助",
  ),
  shortName: "Social Assistance",
  category: "income-support",
  level: "provincial-nb",
  description: tri(
    "Monthly financial help for New Brunswickers in need, through the Transitional Assistance Program (general) or the Extended Benefits Program (for people with a long-term disability).",
    "為有需要的新不倫瑞克居民提供每月援助，透過過渡援助計劃（一般）或延伸福利計劃（長期殘障人士）。",
    "为有需要的新不伦瑞克居民提供每月援助，通过过渡援助计划（一般）或延伸福利计划（长期残障人士）。",
  ),
  estimatedValue: tri(
    "Around $940/month for a single person, depending on your situation",
    "單身人士約每月 $940，視情況而定",
    "单身人士约每月 $940，视情况而定",
  ),
  contextFields: ["province", "annualIncome"],
  check: buildCheck([
    { test: NB, hard: true, passReason: nbPass, failReason: nbFail, missingField: "province" },
    {
      test: atMost((c) => c.annualIncome, 12000),
      hard: true,
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
  estimateAmount: () => ({ low: 0, high: 940, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through Social Development", "透過社會發展部申請", "通过社会发展部申请"),
      description: tri(
        "Apply online or by phone. Your income, assets, and household are assessed. People with a long-term disability may qualify for the Extended Benefits Program.",
        "網上或電話申請，會評估你的收入、資產及家庭。長期殘障人士可能符合延伸福利計劃。",
        "网上或电话申请，会评估你的收入、资产及家庭。长期残障人士可能符合延伸福利计划。",
      ),
      actionUrl:
        "https://www2.gnb.ca/content/gnb/en/departments/social_development/social_assistance.html",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl:
    "https://www2.gnb.ca/content/gnb/en/departments/social_development/social_assistance.html",
  officialInfoUrl:
    "https://www2.gnb.ca/content/gnb/en/departments/social_development/social_assistance.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["new-brunswick", "low-income", "assistance", "disability"],
  relatedBenefits: ["nb-child-tax-benefit"],
  lastUpdated: "2026-09-01",
};

export const nbChildTaxBenefit: Benefit = {
  id: "nb-child-tax-benefit",
  name: tri(
    "New Brunswick Child Tax Benefit",
    "新不倫瑞克兒童稅務福利",
    "新不伦瑞克儿童税务福利",
  ),
  shortName: "NBCTB",
  category: "family",
  level: "provincial-nb",
  description: tri(
    "A tax-free monthly amount for low-income New Brunswick families with children under 18, paid with the Canada Child Benefit. A working-income supplement may add more.",
    "為新不倫瑞克低收入、有 18 歲以下子女家庭提供的免稅每月款項，與加拿大兒童福利一併發放。工作收入補助或會增加金額。",
    "为新不伦瑞克低收入、有 18 岁以下子女家庭提供的免税每月款项，与加拿大儿童福利一并发放。工作收入补助或会增加金额。",
  ),
  estimatedValue: tri(
    "About $250/year per child, plus a possible working-income supplement",
    "每名子女約每年 $250，另可能有工作收入補助",
    "每名子女约每年 $250，另可能有工作收入补助",
  ),
  contextFields: ["province", "hasChildren", "numberOfChildren", "familyIncome"],
  prerequisites: ["ccb"],
  check: buildCheck([
    { test: NB, hard: true, passReason: nbPass, failReason: nbFail, missingField: "province" },
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
      test: atMost((c) => c.familyIncome, 25000),
      hard: false,
      passReason: tri(
        "Your income is in the low range this benefit is for.",
        "你的收入屬此福利針對的低收入範圍。",
        "你的收入属此福利针对的低收入范围。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: (ctx) => ({
    low: 0,
    high: 250 * (ctx.numberOfChildren ?? 1),
    period: "year",
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("File your taxes", "報稅", "报税"),
      description: tri(
        "No separate application. File your taxes and receive the Canada Child Benefit; the NB Child Tax Benefit is assessed automatically.",
        "無需另行申請。報稅並領取加拿大兒童福利後，會自動評估新不倫瑞克兒童稅務福利。",
        "无需另行申请。报税并领取加拿大儿童福利后，会自动评估新不伦瑞克儿童税务福利。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-new-brunswick.html",
    },
  ],
  requiredDocuments: [tri("Filed tax returns", "已報稅表", "已报税表")],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-new-brunswick.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["new-brunswick", "family", "children", "low-income"],
  relatedBenefits: ["ccb"],
  lastUpdated: "2026-09-01",
};

// New Brunswick HST Credit, added 2026-09-02. The broadest thing New Brunswick
// was missing: no age, employment, disability or homeownership gate — anyone
// with low-to-modest income gets it just by filing a return. Structurally the
// provincial twin of the federal CGEB.
//
// Source (fetched 2026-09-02): the CRA's provincial-programs page for NB, which
// is where the amounts are actually stated.
const NB_HST_URL =
  "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-new-brunswick.html";
const NB_HST_AMOUNTS =
  "The program provides for a maximum annual amount of $300 for an individual, $300 for a spouse or common-law partner, and $100 per child under 19 years of age ($300 for the first child in a single parent family).";
const NB_HST_PHASEOUT = "The credit is reduced by 2% of the adjusted family net income over $35,000.";

const NB_HST = figures({
  perAdult: {
    current: { value: 300, from: "2026-07-01", source: NB_HST_URL, quote: NB_HST_AMOUNTS },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum per adult",
  },
  perChild: {
    current: { value: 100, from: "2026-07-01", source: NB_HST_URL, quote: NB_HST_AMOUNTS },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum per child under 19",
  },
  reductionStartsAt: {
    current: { value: 35000, from: "2026-07-01", source: NB_HST_URL, quote: NB_HST_PHASEOUT },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income where the credit starts to be reduced",
  },
  reductionRate: {
    current: { value: 2, from: "2026-07-01", source: NB_HST_URL, quote: NB_HST_PHASEOUT },
    history: [],
    verifiedAt: "2026-09-02",
    format: "percent",
    label: "Reduction rate above the threshold",
  },
});

const nbHstEstimate = (ctx: AssessmentContext): AmountEstimate => {
  const couple = ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
  const children = ctx.hasChildren === true ? Math.max(0, ctx.numberOfChildren ?? 0) : 0;

  let base = val(NB_HST.perAdult);
  if (couple) base += val(NB_HST.perAdult);
  if (children > 0) {
    // A single parent's FIRST child counts at the adult rate, not the child rate.
    const firstChildAtAdultRate = !couple;
    base += firstChildAtAdultRate ? val(NB_HST.perAdult) : val(NB_HST.perChild);
    base += val(NB_HST.perChild) * (children - 1);
  }

  const income = ctx.familyIncome ?? ctx.annualIncome;
  if (income === undefined) return { low: 0, high: base, period: "year" };
  const over = Math.max(0, income - val(NB_HST.reductionStartsAt));
  const amount = Math.max(0, Math.round(base - (val(NB_HST.reductionRate) / 100) * over));
  return { low: amount, high: amount, period: "year" };
};

export const nbHstCredit: Benefit = {
  id: "nb-hst-credit",
  name: tri(
    "New Brunswick Harmonized Sales Tax Credit",
    "新不倫瑞克統一銷售稅抵免",
    "新不伦瑞克统一销售税抵免",
  ),
  shortName: "NB HST Credit",
  category: "tax-credits",
  level: "provincial-nb",
  description: tri(
    "A tax-free quarterly payment that offsets sales tax for New Brunswick residents with low or modest income. You get it automatically by filing your tax return.",
    "為低至中等收入的新不倫瑞克居民抵銷銷售稅的免稅季度款項。報稅後自動發放。",
    "为低至中等收入的新不伦瑞克居民抵销销售税的免税季度款项。报税后自动发放。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(NB_HST.perAdult)}/year per adult, plus ${fmt(NB_HST.perChild)} per child`,
    `每名成人每年最多 ${fmt(NB_HST.perAdult)}，每名子女另加 ${fmt(NB_HST.perChild)}`,
    `每名成人每年最多 ${fmt(NB_HST.perAdult)}，每名子女另加 ${fmt(NB_HST.perChild)}`,
  ),
  figures: NB_HST,
  contextFields: [
    "province",
    "maritalStatus",
    "hasChildren",
    "numberOfChildren",
    "familyIncome",
    "filedTaxes",
  ],
  check: buildCheck([
    { test: NB, hard: true, passReason: nbPass, failReason: nbFail, missingField: "province" },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: true,
      passReason: tri(
        "You filed a tax return, which is all that is needed.",
        "你已報稅，這是唯一需要做的事。",
        "你已报税，这是唯一需要做的事。",
      ),
      failReason: tri(
        "You must file a tax return to receive this credit, even with no income.",
        "即使沒有收入，也必須報稅才能獲得此抵免。",
        "即使没有收入，也必须报税才能获得此抵免。",
      ),
      missingField: "filedTaxes",
    },
  ]),
  estimateAmount: nbHstEstimate,
  applicationSteps: [
    {
      order: 1,
      title: tri("File your tax return", "報稅", "报税"),
      description: tri(
        "There is no application. The CRA works out the credit from your return and pays it with the federal credit.",
        "無需申請。加拿大稅務局會根據你的稅表計算，並與聯邦抵免一併發放。",
        "无需申请。加拿大税务局会根据你的税表计算，并与联邦抵免一并发放。",
      ),
      actionUrl: NB_HST_URL,
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  officialInfoUrl: NB_HST_URL,
  paymentFrequency: tri("Quarterly", "每季", "每季"),
  tags: ["new-brunswick", "tax-credit", "sales-tax", "low-income", "broad"],
  relatedBenefits: ["cgeb"],
  lastUpdated: "2026-09-02",
};

export const newBrunswickBenefits: Benefit[] = [
  nbSeniorsBenefit,
  nbSocialAssistance,
  nbChildTaxBenefit,
  nbHstCredit,
];
