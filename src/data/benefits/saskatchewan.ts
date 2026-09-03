import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, atMostOf, buildCheck, isTrue, oneOf } from "@/lib/checks";

const SK = oneOf((c: { province?: string }) => c.province, ["SK"]);
const skFail = tri(
  "This program is for residents of Saskatchewan.",
  "此計劃適用於薩斯喀徹溫省居民。",
  "此计划适用于萨斯喀彻温省居民。",
);
const skPass = tri("You live in Saskatchewan.", "你居住在薩斯喀徹溫省。", "你居住在萨斯喀彻温省。");

// SLITC -- July 2026 to June 2027 amounts, all from one CRA sentence.
// Source (fetched 2026-09-02): province-saskatchewan.html
// Every amount here was a year stale: $429/$429/$169/$1,196 against the
// current $460/$460/$181/$1,282. The phase-out threshold was also stale
// ($38,588 against $39,345).
const SLITC_URL =
  "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-saskatchewan.html";
const SLITC_SENTENCE =
  "For July 2026 to June 2027, this program provides $460 for an individual, $460 for a spouse or common-law partner (or for an eligible dependant), and $181 per child (maximum of two children), or an annual credit of up to $1,282 per family.";

const SLITC = figures({
  perAdult: {
    current: { value: 460, from: "2026-07-01", source: SLITC_URL, quote: SLITC_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Amount per adult",
  },
  perChild: {
    current: { value: 181, from: "2026-07-01", source: SLITC_URL, quote: SLITC_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Amount per child (maximum two)",
  },
  familyMax: {
    current: { value: 1282, from: "2026-07-01", source: SLITC_URL, quote: SLITC_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum per family",
  },
  reductionStartsAt: {
    current: {
      value: 39345,
      from: "2026-07-01",
      source: SLITC_URL,
      quote: "The credit starts to be reduced when the adjusted family net income is more than $39,345",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income where the credit starts to be reduced",
  },
});

const slitcEstimate = (ctx: {
  maritalStatus?: string;
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate => {
  let amount = val(SLITC.perAdult);
  if (ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law")
    amount += val(SLITC.perAdult);
  if (ctx.hasChildren)
    amount += val(SLITC.perChild) * Math.min(ctx.numberOfChildren ?? 1, 2);
  // The per-person amounts can exceed the published family maximum for a
  // couple with two children, so cap at what the province actually pays.
  amount = Math.min(amount, val(SLITC.familyMax));
  const income = ctx.familyIncome;
  if (income === undefined) return { low: 0, high: amount, period: "year" };
  const over = Math.max(0, income - val(SLITC.reductionStartsAt));
  const reduced = Math.max(0, Math.round(amount - over * 0.025));
  return { low: reduced, high: reduced, period: "year" };
};

// SAID -- Saskatchewan restructured this program effective September 1, 2026.
// Source (fetched 2026-09-03): saskatchewan.ca/.../income-support-for-people-with-disabilities
// The app showed a flat "$1,229/month" cap, but the program's own page now
// states verbatim: "SAID benefits vary depending on an individual's specific
// situation and needs, and has different payment tiers with no set maximum
// monthly benefit." The only dollar figures left on that page are annual
// earned-income exemptions ($7,500/$8,700/$9,500), not the benefit itself; a
// current rate table exists only as a PDF the crawler cannot extract a
// verifiable quote from, so the stale number was removed rather than
// replaced with an unsourced one.
export const said: Benefit = {
  id: "said",
  name: tri(
    "Assured Income for Disability (SAID)",
    "殘障保障收入 (SAID)",
    "残障保障收入 (SAID)",
  ),
  shortName: "SAID",
  category: "disability",
  level: "provincial-sk",
  description: tri(
    "Monthly income and benefits for Saskatchewan residents with a significant and enduring disability. It is designed to be more stable and less restrictive than general assistance.",
    "為有重大且持久殘障的薩斯喀徹溫省居民提供每月收入及福利，較一般援助更穩定、限制更少。",
    "为有重大且持久残障的萨斯喀彻温省居民提供每月收入及福利，较一般援助更稳定、限制更少。",
  ),
  estimatedValue: tri(
    "Pays in tiers based on your individual needs, plus benefits — Saskatchewan sets no fixed monthly maximum",
    "按個人需要分級發放，另加福利 — 薩斯喀徹溫省並未設定固定每月上限",
    "按个人需要分级发放，另加福利 — 萨斯喀彻温省并未设定固定每月上限",
  ),
  contextFields: ["province", "age", "hasSevereDisability"],
  check: buildCheck([
    { test: SK, hard: true, passReason: skPass, failReason: skFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 18),
      hard: true,
      passReason: tri("You are 18 or older.", "你已年滿 18 歲。", "你已年满 18 岁。"),
      failReason: tri(
        "SAID is for adults 18 and older.",
        "SAID 適用於 18 歲或以上成人。",
        "SAID 适用于 18 岁或以上成人。",
      ),
      missingField: "age",
    },
    {
      test: isTrue((c) => c.hasSevereDisability),
      hard: true,
      passReason: tri(
        "Your significant, enduring disability may meet the SAID test.",
        "你重大且持久的殘障或符合 SAID 條件。",
        "你重大且持久的残障或符合 SAID 条件。",
      ),
      failReason: tri(
        "SAID requires a significant and enduring disability.",
        "SAID 要求重大且持久的殘障。",
        "SAID 要求重大且持久的残障。",
      ),
      missingField: "hasSevereDisability",
    },
  ]),
  // No estimateAmount: as of the Sept 1, 2026 SAID restructuring, the
  // program's own page states it "has different payment tiers with no set
  // maximum monthly benefit" -- the prior flat $1,229/month figure no longer
  // matches the source and no replacement ceiling is published in HTML (only
  // a PDF rate card, which this codebase cannot verify a quote from).
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply and complete the disability assessment", "申請並完成殘障評估", "申请并完成残障评估"),
      description: tri(
        "Apply through the Ministry of Social Services. A disability impact assessment confirms your eligibility.",
        "透過社會服務部申請。殘障影響評估會確認你的資格。",
        "通过社会服务部申请。残障影响评估会确认你的资格。",
      ),
      actionUrl:
        "https://www.saskatchewan.ca/residents/family-and-social-support/people-with-disabilities/income-support-for-people-with-disabilities",
    },
  ],
  requiredDocuments: [
    tri("Disability impact assessment", "殘障影響評估", "残障影响评估"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl:
    "https://www.saskatchewan.ca/residents/family-and-social-support/people-with-disabilities/income-support-for-people-with-disabilities",
  officialInfoUrl:
    "https://www.saskatchewan.ca/residents/family-and-social-support/people-with-disabilities/income-support-for-people-with-disabilities",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["saskatchewan", "disability", "income", "assistance"],
  relatedBenefits: ["dtc", "cdb"],
  lastUpdated: "2026-09-01",
};

// SIS -- benefit scales with household, not a flat ceiling.
// Source (fetched 2026-09-02): .../financial-help/saskatchewan-income-support-sis
// The app capped everyone at $900/month, which a single person in
// Saskatoon already exceeds ($375 basic + $675 shelter = $1,050).
const SIS_URL =
  "https://www.saskatchewan.ca/residents/family-and-social-support/financial-help/saskatchewan-income-support-sis";
const SIS_RATES =
  "Adult Basic Benefit $375 Adult Basic Benefit $445 Children's Basic Benefit $65/child Shelter Benefit - includes rent, mortgage payments, utilities, taxes and all other shelter-related costs (monthly rate) Singles Couples (without dependent children) Families (1-2 children) Families (3+ children) Saskatoon/Regina $675 $865 $1,105 $1,287";

const SIS_FIGURES = figures({
  adultBasic: {
    current: { value: 375, from: "2026-05-01", source: SIS_URL, quote: SIS_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Adult basic benefit, monthly",
  },
  childBasic: {
    current: { value: 65, from: "2026-05-01", source: SIS_URL, quote: SIS_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Children's basic benefit, per child, monthly",
  },
  shelterSingle: {
    current: { value: 675, from: "2026-05-01", source: SIS_URL, quote: SIS_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Shelter benefit, single (Saskatoon/Regina)",
  },
  shelterCouple: {
    current: { value: 865, from: "2026-05-01", source: SIS_URL, quote: SIS_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Shelter benefit, couple without children (Saskatoon/Regina)",
  },
  shelterFamilySmall: {
    current: { value: 1105, from: "2026-05-01", source: SIS_URL, quote: SIS_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Shelter benefit, family with 1-2 children (Saskatoon/Regina)",
  },
  shelterFamilyLarge: {
    current: { value: 1287, from: "2026-05-01", source: SIS_URL, quote: SIS_RATES },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Shelter benefit, family with 3+ children (Saskatoon/Regina)",
  },
});

/**
 * Monthly SIS ceiling for this household.
 *
 * Uses the Saskatoon/Regina shelter rates, which are the higher of the two
 * bands the province publishes, so this is an upper bound rather than a
 * promise. Rates outside those cities are lower.
 */
const sisMonthly = (ctx: {
  maritalStatus?: string;
  hasChildren?: boolean;
  numberOfChildren?: number;
}): number => {
  const couple = ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
  const kids = ctx.hasChildren === true ? Math.max(0, ctx.numberOfChildren ?? 0) : 0;
  const basic = val(SIS_FIGURES.adultBasic) * (couple ? 2 : 1) + val(SIS_FIGURES.childBasic) * kids;
  const shelter =
    kids >= 3
      ? val(SIS_FIGURES.shelterFamilyLarge)
      : kids >= 1
        ? val(SIS_FIGURES.shelterFamilySmall)
        : couple
          ? val(SIS_FIGURES.shelterCouple)
          : val(SIS_FIGURES.shelterSingle);
  return basic + shelter;
};

export const sis: Benefit = {
  id: "sis",
  figures: SIS_FIGURES,
  name: tri(
    "Saskatchewan Income Support (SIS)",
    "薩斯喀徹溫收入援助 (SIS)",
    "萨斯喀彻温收入援助 (SIS)",
  ),
  shortName: "SIS",
  category: "income-support",
  level: "provincial-sk",
  description: tri(
    "Monthly help for Saskatchewan residents who cannot meet their basic needs, covering food, shelter, and other essentials.",
    "為無法滿足基本需要的薩斯喀徹溫省居民提供每月援助，涵蓋食物、住屋及其他必需品。",
    "为无法满足基本需要的萨斯喀彻温省居民提供每月援助，涵盖食物、住房及其他必需品。",
  ),
  estimatedValue: tri(
    "Covers basic needs and shelter for those in financial need",
    "為有經濟需要人士涵蓋基本需要及住屋",
    "为有经济需要人士涵盖基本需要及住房",
  ),
  contextFields: ["province", "annualIncome", "maritalStatus", "hasChildren", "numberOfChildren"],
  check: buildCheck([
    { test: SK, hard: true, passReason: skPass, failReason: skFail, missingField: "province" },
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
        "SIS is a last resort for people with very little income and assets.",
        "SIS 是為收入及資產極少人士而設的最後保障。",
        "SIS 是为收入及资产极少人士而设的最后保障。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: (ctx) => ({
    low: 0,
    high: sisMonthly(ctx),
    period: "month",
    note: tri(
      "Upper bound using the Saskatoon/Regina shelter rates; rates elsewhere are lower.",
      "以薩斯卡通／里賈納的住屋津貼計算的上限；其他地區較低。",
      "以萨斯卡通／里贾纳的住屋津贴计算的上限；其他地区较低。",
    ),
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through Social Services", "透過社會服務部申請", "通过社会服务部申请"),
      description: tri(
        "Apply online or by phone. Your income, assets, and household are assessed.",
        "網上或電話申請，會評估你的收入、資產及家庭。",
        "网上或电话申请，会评估你的收入、资产及家庭。",
      ),
      actionUrl:
        "https://www.saskatchewan.ca/residents/family-and-social-support/financial-help/saskatchewan-income-support-sis",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl:
    "https://www.saskatchewan.ca/residents/family-and-social-support/financial-help/saskatchewan-income-support-sis",
  officialInfoUrl:
    "https://www.saskatchewan.ca/residents/family-and-social-support/financial-help/saskatchewan-income-support-sis",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["saskatchewan", "low-income", "assistance", "last-resort"],
  relatedBenefits: ["said", "slitc"],
  lastUpdated: "2026-09-01",
};

export const slitc: Benefit = {
  id: "slitc",
  name: tri(
    "Saskatchewan Low-Income Tax Credit (SLITC)",
    "薩斯喀徹溫低收入稅務抵免 (SLITC)",
    "萨斯喀彻温低收入税务抵免 (SLITC)",
  ),
  shortName: "SLITC",
  category: "tax-credits",
  level: "provincial-sk",
  description: tri(
    "A tax-free quarterly payment for low- and modest-income Saskatchewan residents. You get it automatically by filing your taxes.",
    "為薩斯喀徹溫低及中等收入居民提供的免稅季度款項。報稅即自動獲得。",
    "为萨斯喀彻温低及中等收入居民提供的免税季度款项。报税即自动获得。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(SLITC.familyMax)}/year for a family (${fmt(SLITC.perAdult)} adult, ${fmt(SLITC.perAdult)} spouse, ${fmt(SLITC.perChild)}/child up to 2)`,
    `家庭最多每年 ${fmt(SLITC.familyMax)}（成人 ${fmt(SLITC.perAdult)}、配偶 ${fmt(SLITC.perAdult)}、每名子女 ${fmt(SLITC.perChild)}，最多 2 名）`,
    `家庭最多每年 ${fmt(SLITC.familyMax)}（成人 ${fmt(SLITC.perAdult)}、配偶 ${fmt(SLITC.perAdult)}、每名子女 ${fmt(SLITC.perChild)}，最多 2 名）`,
  ),
  figures: SLITC,
  contextFields: ["province", "filedTaxes", "maritalStatus", "hasChildren", "numberOfChildren", "familyIncome"],
  check: buildCheck([
    { test: SK, hard: true, passReason: skPass, failReason: skFail, missingField: "province" },
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
      test: atMost((c) => c.familyIncome, 81668),
      hard: false,
      passReason: tri(
        "Your income is within the range that receives the credit.",
        "你的收入在可獲此抵免的範圍內。",
        "你的收入在可获此抵免的范围内。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: (ctx) => slitcEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("Just file your taxes", "只需報稅", "只需报税"),
      description: tri(
        "There is no separate application. The CRA pays it automatically with the GST credit if you qualify.",
        "無需另行申請。如合資格，稅務局會與 GST 抵免一併自動發放。",
        "无需另行申请。如合资格，税务局会与 GST 抵免一并自动发放。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-saskatchewan.html",
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/provincial-territorial-programs/province-saskatchewan.html",
  paymentFrequency: tri("Quarterly", "每季", "每季"),
  tags: ["saskatchewan", "tax", "low-income", "quarterly"],
  relatedBenefits: ["cgeb"],
  lastUpdated: "2026-09-01",
};

// Seniors Income Plan -- Saskatchewan's own income cutoffs, not the federal
// GIS figure. Source (fetched 2026-09-02): .../seniors-services/seniors-income-plan
//
// The app gated SIP on $22,488, which is the federal GIS eligibility number
// and has nothing to do with SIP. Saskatchewan's own table shows the benefit
// reaching $0 at $4,560 for a single recipient — a fifth of what the app used.
// This OVER-promised: seniors well past the cutoff were told they qualified.
const SIP_URL =
  "https://www.saskatchewan.ca/residents/family-and-social-support/seniors-services/seniors-income-plan";
const SIP_TABLE =
  "Single OAS/GIS Recipient $360 $4,560 Married - Both OAS/GIS Recipients $325 $7,440 Married - Spouse less than 60 years of age $360 $11,568";

const SIP = figures({
  maxMonthlySingle: {
    current: { value: 360, from: "2023-07-01", source: SIP_URL, quote: SIP_TABLE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum monthly benefit, single recipient",
  },
  zeroAtIncomeSingle: {
    current: { value: 4560, from: "2026-04-01", source: SIP_URL, quote: SIP_TABLE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Annual taxable income at which SIP reaches $0, single",
  },
  zeroAtIncomeCoupleWidest: {
    current: { value: 11568, from: "2026-04-01", source: SIP_URL, quote: SIP_TABLE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Widest couple income cutoff (spouse under 60)",
  },
});

/**
 * Income at which SIP reaches zero for this household.
 *
 * Saskatchewan publishes three separate couple cutoffs depending on whether
 * the spouse receives OAS/GIS, is under 60, or is 60-64 on the Allowance. The
 * intake does not ask about a spouse's age or pension status, so couples are
 * measured against the WIDEST of the three. That can suggest checking a
 * benefit someone turns out not to get; the alternative wrongly excludes them.
 */
const sipIncomeCeiling = (c: { maritalStatus?: string }): number =>
  c.maritalStatus === "married" || c.maritalStatus === "common-law"
    ? val(SIP.zeroAtIncomeCoupleWidest)
    : val(SIP.zeroAtIncomeSingle);

export const sip: Benefit = {
  id: "sip",
  figures: SIP,
  name: tri("Seniors Income Plan (SIP)", "長者收入計劃 (SIP)", "长者收入计划 (SIP)"),
  shortName: "SIP",
  category: "seniors",
  level: "provincial-sk",
  description: tri(
    "A monthly top-up for low-income Saskatchewan seniors who receive the federal Guaranteed Income Supplement.",
    "為領取聯邦保證收入補助金的薩斯喀徹溫低收入長者提供的每月補助。",
    "为领取联邦保证收入补助金的萨斯喀彻温低收入长者提供的每月补助。",
  ),
  estimatedValue: tri(
    "Up to about $360/month for a single senior",
    "單身長者最多約每月 $360",
    "单身长者最多约每月 $360",
  ),
  contextFields: ["province", "age", "annualIncome"],
  prerequisites: ["gis"],
  check: buildCheck([
    { test: SK, hard: true, passReason: skPass, failReason: skFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 65),
      hard: true,
      passReason: tri("You are 65 or older.", "你已年滿 65 歲。", "你已年满 65 岁。"),
      failReason: tri(
        "SIP is for seniors 65+ who receive the federal GIS.",
        "SIP 適用於領取聯邦 GIS 的 65 歲以上長者。",
        "SIP 适用于领取联邦 GIS 的 65 岁以上长者。",
      ),
      missingField: "age",
    },
    {
      test: atMostOf((c) => c.annualIncome, sipIncomeCeiling),
      hard: true,
      passReason: tri(
        "Your income is low enough to receive GIS, which triggers SIP.",
        "你的收入足夠低以領取 GIS，並會觸發 SIP。",
        "你的收入足够低以领取 GIS，并会触发 SIP。",
      ),
      failReason: tri(
        "You must receive the federal Guaranteed Income Supplement.",
        "你必須領取聯邦保證收入補助金。",
        "你必须领取联邦保证收入补助金。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 360, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("No application needed", "無需申請", "无需申请"),
      description: tri(
        "Saskatchewan states no application is required. Eligibility and the amount are worked out from your tax return and your OAS/GIS application with Service Canada.",
        "薩斯喀徹溫省表明無需申請。資格及金額會根據你的稅表及向 Service Canada 申請的 OAS/GIS 自動釐定。",
        "萨斯喀彻温省表明无需申请。资格及金额会根据你的税表及向 Service Canada 申请的 OAS/GIS 自动厘定。",
      ),
      actionUrl:
        "https://www.saskatchewan.ca/residents/family-and-social-support/seniors-services/seniors-income-plan",
    },
  ],
  requiredDocuments: [
    tri("Proof of OAS/GIS", "OAS／GIS 證明", "OAS／GIS 证明"),
  ],
  applicationUrl:
    "https://www.saskatchewan.ca/residents/family-and-social-support/seniors-services/seniors-income-plan",
  officialInfoUrl:
    "https://www.saskatchewan.ca/residents/family-and-social-support/seniors-services/seniors-income-plan",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["saskatchewan", "seniors", "65+", "low-income"],
  relatedBenefits: ["gis", "oas"],
  lastUpdated: "2026-09-01",
};

export const saskatchewanBenefits: Benefit[] = [said, sis, slitc, sip];
