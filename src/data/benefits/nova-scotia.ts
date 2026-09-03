import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, val } from "@/lib/figures";
import { atLeast, atMost, buildCheck, isTrue, oneOf } from "@/lib/checks";

const NS = oneOf((c: { province?: string }) => c.province, ["NS"]);
const nsFail = tri(
  "This program is for residents of Nova Scotia.",
  "此計劃適用於新斯科舍省居民。",
  "此计划适用于新斯科舍省居民。",
);
const nsPass = tri("You live in Nova Scotia.", "你居住在新斯科舍省。", "你居住在新斯科舍省。");

const nscbEstimate = (ctx: {
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const n = ctx.numberOfChildren ?? 1;
  const income = ctx.familyIncome;
  if (income === undefined) return { low: 0, high: 1525 * n, period: "year" };
  if (income < 26000) return { low: 1525 * n, high: 1525 * n, period: "year" };
  if (income < 34000) {
    const amt = 1525 + 762.5 * (n - 1);
    return { low: Math.round(amt), high: Math.round(amt), period: "year" };
  }
  return { low: 0, high: 0, period: "year" };
};

export const nsChildBenefit: Benefit = {
  id: "ns-child-benefit",
  name: tri("Nova Scotia Child Benefit", "新斯科舍兒童福利", "新斯科舍儿童福利"),
  shortName: "NSCB",
  category: "family",
  level: "provincial-ns",
  description: tri(
    "A tax-free monthly payment for low-income Nova Scotia families with children under 18, paid with the Canada Child Benefit.",
    "為新斯科舍低收入、有 18 歲以下子女家庭提供的免稅每月款項，與加拿大兒童福利一併發放。",
    "为新斯科舍低收入、有 18 岁以下子女家庭提供的免税每月款项，与加拿大儿童福利一并发放。",
  ),
  estimatedValue: tri(
    "Up to $1,525/year per child",
    "每名子女最多每年 $1,525",
    "每名子女最多每年 $1,525",
  ),
  contextFields: ["province", "hasChildren", "numberOfChildren", "familyIncome"],
  prerequisites: ["ccb"],
  check: buildCheck([
    { test: NS, hard: true, passReason: nsPass, failReason: nsFail, missingField: "province" },
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
      test: atMost((c) => c.familyIncome, 34000),
      hard: true,
      passReason: tri(
        "Your income is within the range for this benefit.",
        "你的收入在此福利的範圍內。",
        "你的收入在此福利的范围内。",
      ),
      failReason: tri(
        "The Nova Scotia Child Benefit is for families with income under $34,000.",
        "新斯科舍兒童福利適用於收入低於 $34,000 的家庭。",
        "新斯科舍儿童福利适用于收入低于 $34,000 的家庭。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: (ctx) => nscbEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("File your taxes", "報稅", "报税"),
      description: tri(
        "No separate application. File your taxes and receive the Canada Child Benefit; the Nova Scotia Child Benefit is assessed automatically.",
        "無需另行申請。報稅並領取加拿大兒童福利後，會自動評估新斯科舍兒童福利。",
        "无需另行申请。报税并领取加拿大儿童福利后，会自动评估新斯科舍儿童福利。",
      ),
      actionUrl: "https://novascotia.ca/coms/families/ChildBenefit.html",
    },
  ],
  requiredDocuments: [tri("Filed tax returns", "已報稅表", "已报税表")],
  officialInfoUrl: "https://novascotia.ca/coms/families/ChildBenefit.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["nova-scotia", "family", "children", "low-income"],
  relatedBenefits: ["ccb"],
  lastUpdated: "2026-09-01",
};

export const nsAffordableLiving: Benefit = {
  id: "ns-affordable-living",
  name: tri(
    "Nova Scotia Affordable Living Tax Credit",
    "新斯科舍可負擔生活稅務抵免",
    "新斯科舍可负担生活税务抵免",
  ),
  shortName: "NSALTC",
  category: "tax-credits",
  level: "provincial-ns",
  description: tri(
    "A tax-free quarterly payment that helps low- and modest-income Nova Scotians with the cost of living. You get it automatically by filing your taxes.",
    "協助新斯科舍低及中等收入居民應付生活費的免稅季度款項。報稅即自動獲得。",
    "帮助新斯科舍低及中等收入居民应付生活费的免税季度款项。报税即自动获得。",
  ),
  estimatedValue: tri(
    "Up to $255/year per individual or couple, plus $60/year per child",
    "個人或夫婦最多每年 $255，另每名子女每年 $60",
    "个人或夫妇最多每年 $255，另每名子女每年 $60",
  ),
  contextFields: ["province", "filedTaxes", "hasChildren", "numberOfChildren", "familyIncome"],
  check: buildCheck([
    { test: NS, hard: true, passReason: nsPass, failReason: nsFail, missingField: "province" },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: true,
      passReason: tri(
        "You file taxes, which is how this credit is paid.",
        "你有報稅，這是發放此抵免的方式。",
        "你有报税，这是发放此抵免的方式。",
      ),
      failReason: tri(
        "You must file a tax return to receive it.",
        "你須報稅才能領取。",
        "你须报税才能领取。",
      ),
      missingField: "filedTaxes",
    },
    {
      test: atMost((c) => c.familyIncome, 45000),
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
    const base = 255;
    const kids = ctx.hasChildren ? 60 * (ctx.numberOfChildren ?? 1) : 0;
    const total = base + kids;
    const income = ctx.familyIncome;
    if (income === undefined) return { low: 0, high: total, period: "year" };
    const reduced = Math.max(0, Math.round(total - Math.max(0, income - 30000) * 0.05));
    return { low: reduced, high: reduced, period: "year" };
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
        "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-nova-scotia.html",
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-nova-scotia.html",
  paymentFrequency: tri("Quarterly", "每季", "每季"),
  tags: ["nova-scotia", "tax", "low-income", "quarterly"],
  relatedBenefits: ["cgeb"],
  lastUpdated: "2026-09-01",
};

// NS Income Assistance -- the Standard Household Rate scales with household.
// Source (fetched 2026-09-02):
// https://novascotia.ca/coms/employment/income_assistance/what-you-receive.html
// The app showed a flat $950/month ceiling to everyone. Nova Scotia's own
// table runs from $738 for a single recipient to $1,497 for two recipients
// with a dependent — so a couple with children was shown a ceiling about a
// third below what they can actually receive.
const NSIA_URL =
  "https://novascotia.ca/coms/employment/income_assistance/what-you-receive.html";
const NSIA_TABLE =
  "Household Composition Standard Household Rate (Monthly) Recipient Dependent Child/Student Family Member Rent/Own Board 1 0 $738 $655 1 1 $1,035 $674 1 2 or more $1,090 $719 2 0 $1,442 $1,085 2 1 or more $1,497 $1,128";

const NSIA = figures({
  oneAdultNoChildren: {
    current: { value: 738, from: "2026-01-01", source: NSIA_URL, quote: NSIA_TABLE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Monthly rate, one recipient, no dependents (rent/own)",
  },
  oneAdultOneChild: {
    current: { value: 1035, from: "2026-01-01", source: NSIA_URL, quote: NSIA_TABLE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Monthly rate, one recipient, one dependent (rent/own)",
  },
  oneAdultTwoPlusChildren: {
    current: { value: 1090, from: "2026-01-01", source: NSIA_URL, quote: NSIA_TABLE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Monthly rate, one recipient, two or more dependents (rent/own)",
  },
  twoAdultsNoChildren: {
    current: { value: 1442, from: "2026-01-01", source: NSIA_URL, quote: NSIA_TABLE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Monthly rate, two recipients, no dependents (rent/own)",
  },
  twoAdultsWithChildren: {
    current: { value: 1497, from: "2026-01-01", source: NSIA_URL, quote: NSIA_TABLE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Monthly rate, two recipients, one or more dependents (rent/own)",
  },
});

/** Standard Household Rate for this household, at the rent/own rate. */
const nsiaMonthly = (ctx: {
  maritalStatus?: string;
  hasChildren?: boolean;
  numberOfChildren?: number;
}): number => {
  const couple = ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
  const kids = ctx.hasChildren === true ? Math.max(0, ctx.numberOfChildren ?? 1) : 0;
  if (couple) {
    return kids >= 1 ? val(NSIA.twoAdultsWithChildren) : val(NSIA.twoAdultsNoChildren);
  }
  if (kids >= 2) return val(NSIA.oneAdultTwoPlusChildren);
  if (kids === 1) return val(NSIA.oneAdultOneChild);
  return val(NSIA.oneAdultNoChildren);
};

export const nsIncomeAssistance: Benefit = {
  id: "ns-income-assistance",
  figures: NSIA,
  name: tri(
    "Nova Scotia Income Assistance (ESIA)",
    "新斯科舍收入援助 (ESIA)",
    "新斯科舍收入援助 (ESIA)",
  ),
  shortName: "ESIA",
  category: "income-support",
  level: "provincial-ns",
  description: tri(
    "Monthly help for Nova Scotians who cannot meet their basic needs, through the Employment Support and Income Assistance program, plus a disability supplement and health benefits.",
    "透過就業支援及收入援助計劃，為無法滿足基本需要的新斯科舍居民提供每月援助，並附殘障補助及健康福利。",
    "通过就业支援及收入援助计划，为无法满足基本需要的新斯科舍居民提供每月援助，并附残障补助及健康福利。",
  ),
  estimatedValue: tri(
    "A standard household rate for basic needs and shelter, plus supplements",
    "涵蓋基本需要及住屋的標準家庭標準，另加補助",
    "涵盖基本需要及住房的标准家庭标准，另加补助",
  ),
  contextFields: ["province", "annualIncome", "maritalStatus", "hasChildren", "numberOfChildren", "age"],
  check: buildCheck([
    {
      // Nova Scotia states "are 19 years old or over ( sometimes 16 to 18 )".
      // Soft, because the exception is real and a 17-year-old in the listed
      // circumstances can still apply.
      test: atLeast((c) => c.age, 19),
      hard: false,
      passReason: tri(
        "You are 19 or older.",
        "你已年滿 19 歲。",
        "你已年满 19 岁。",
      ),
      failReason: tri(
        "Income Assistance is normally for people 19 and over, though 16 to 18 year olds can apply in some circumstances.",
        "收入援助一般適用於 19 歲或以上人士，惟 16 至 18 歲在特定情況下亦可申請。",
        "收入援助一般适用于 19 岁或以上人士，惟 16 至 18 岁在特定情况下亦可申请。",
      ),
      missingField: "age",
    },
    { test: NS, hard: true, passReason: nsPass, failReason: nsFail, missingField: "province" },
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
        "Income Assistance is a last resort for people with very little income and assets.",
        "收入援助是為收入及資產極少人士而設的最後保障。",
        "收入援助是为收入及资产极少人士而设的最后保障。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: (ctx) => ({
    low: 0,
    high: nsiaMonthly(ctx),
    period: "month",
    note: tri(
      "The rent/own rate for your household. Boarding rates are lower, and special-needs help may be added.",
      "此為你家庭情況的租住／自有住屋標準金額。寄宿金額較低，另可能有特殊需要補助。",
      "此为你家庭情况的租住／自有住屋标准金额。寄宿金额较低，另可能有特殊需要补助。",
    ),
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through Community Services", "透過社區服務部申請", "通过社区服务部申请"),
      description: tri(
        "Apply online or by phone. Your income, assets, and household are assessed.",
        "網上或電話申請，會評估你的收入、資產及家庭。",
        "网上或电话申请，会评估你的收入、资产及家庭。",
      ),
      actionUrl: "https://novascotia.ca/coms/employment/income_assistance/index.html",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl: "https://novascotia.ca/coms/employment/income_assistance/index.html",
  officialInfoUrl: "https://novascotia.ca/coms/employment/income_assistance/index.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["nova-scotia", "low-income", "assistance", "disability"],
  relatedBenefits: ["ns-disability-support"],
  lastUpdated: "2026-09-01",
};

export const nsDisabilitySupport: Benefit = {
  id: "ns-disability-support",
  name: tri(
    "Nova Scotia Disability Support Program",
    "新斯科舍殘障支援計劃",
    "新斯科舍残障支援计划",
  ),
  shortName: "DSP",
  category: "disability",
  level: "provincial-ns",
  description: tri(
    "Support for Nova Scotians with a disability — including income (the standard household rate), residential options, and community support to live as independently as possible.",
    "為新斯科舍殘障人士提供支援 — 包括收入（標準家庭標準）、居住安排及社區支援，讓他們盡量獨立生活。",
    "为新斯科舍残障人士提供支援 — 包括收入（标准家庭标准）、居住安排及社区支援，让他们尽量独立生活。",
  ),
  estimatedValue: tri(
    "Income support plus disability-related and residential supports",
    "收入支援及與殘障相關的居住支援",
    "收入支援及与残障相关的居住支援",
  ),
  contextFields: ["province", "hasDisability"],
  check: buildCheck([
    { test: NS, hard: true, passReason: nsPass, failReason: nsFail, missingField: "province" },
    {
      test: isTrue((c) => c.hasDisability),
      hard: true,
      passReason: tri(
        "You have a disability the program supports.",
        "你有此計劃支援的殘障。",
        "你有此计划支援的残障。",
      ),
      failReason: tri(
        "This program is for people with a disability who need support to live independently.",
        "此計劃適用於需要支援以獨立生活的殘障人士。",
        "此计划适用于需要支援以独立生活的残障人士。",
      ),
      missingField: "hasDisability",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through Community Services", "透過社區服務部申請", "通过社区服务部申请"),
      description: tri(
        "Contact the Disability Support Program. An assessment identifies the supports you need.",
        "聯絡殘障支援計劃。評估會找出你所需的支援。",
        "联系残障支援计划。评估会找出你所需的支援。",
      ),
      actionUrl: "https://novascotia.ca/coms/disabilities/",
    },
  ],
  requiredDocuments: [
    tri("Information about your disability and support needs", "有關你殘障及支援需要的資料", "有关你残障及支援需要的资料"),
  ],
  applicationUrl: "https://novascotia.ca/coms/disabilities/",
  officialInfoUrl: "https://novascotia.ca/coms/disabilities/",
  paymentFrequency: tri("Monthly / ongoing", "每月／持續", "每月／持续"),
  tags: ["nova-scotia", "disability", "income", "support"],
  relatedBenefits: ["dtc", "cdb", "ns-income-assistance"],
  lastUpdated: "2026-09-01",
};

export const novaScotiaBenefits: Benefit[] = [
  nsChildBenefit,
  nsAffordableLiving,
  nsIncomeAssistance,
  nsDisabilitySupport,
];
