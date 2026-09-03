import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, buildCheck, isTrue, oneOf } from "@/lib/checks";

// Canada Groceries and Essentials Benefit (formerly the GST/HST credit).
// Source (fetched 2026-09-02):
// https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit/how-much.html
//
// The benefit cited only the old GST/HST credit page, which states no amounts,
// so all three figures went unchecked and fell a full year behind: $533/$698/
// $184 against the current $679/$890/$234. That understated a single person's
// entitlement by 27%.
const CGEB_URL =
  "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit/how-much.html";
const CGEB_SENTENCE =
  "You could get up to: $679 if you are a single individual $890 if you are married or have a common-law partner $234 for each eligible child under the age of 19";

// The reduction formula and eligibility cutoff were bare, unsourced literals
// (45521 in the code, 65000/56000 in copy) that appear on neither cited page --
// confirmed via probe.ts, both state no amounts beyond the three above. The
// real, current-year phase-out threshold lives in this benefit's own linked
// "payment amounts" table (2025 base year row, the period this app is in).
const CGEB_PAYMENT_AMOUNTS_URL =
  "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit/how-much/payment-amounts.html";
const CGEB_PHASE_OUT_QUOTE =
  "2025 ( July 2026 - June 2027) $445 $445 $234 $445 $234 $11,564 $46,432";

const CGEB = figures({
  maxSingle: {
    current: { value: 679, from: "2026-07-01", source: CGEB_URL, quote: CGEB_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum per year, single",
  },
  maxCouple: {
    current: { value: 890, from: "2026-07-01", source: CGEB_URL, quote: CGEB_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum per year, married or common-law",
  },
  perChild: {
    current: { value: 234, from: "2026-07-01", source: CGEB_URL, quote: CGEB_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum per year, per child under 19",
  },
  phaseOutThreshold: {
    current: {
      value: 46432,
      from: "2026-07-01",
      source: CGEB_PAYMENT_AMOUNTS_URL,
      quote: CGEB_PHASE_OUT_QUOTE,
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Adjusted family net income where the 5% reduction begins",
  },
});

const cgebEstimate = (ctx: {
  maritalStatus?: string;
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate => {
  const couple =
    ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
  let base = couple ? val(CGEB.maxCouple) : val(CGEB.maxSingle);
  if (ctx.hasChildren) base += val(CGEB.perChild) * (ctx.numberOfChildren ?? 1);
  const income = ctx.familyIncome;
  if (income === undefined) return { low: 0, high: base, period: "year" };
  const reduce = Math.max(0, income - val(CGEB.phaseOutThreshold)) * 0.05;
  const amount = Math.max(0, Math.round(base - reduce));
  return {
    low: amount,
    high: amount,
    period: "year",
    note: tri(
      "Estimated from your income, marital status, and number of children.",
      "根據你的收入、婚姻狀況及子女人數估算。",
      "根据你的收入、婚姻状况及子女人数估算。",
    ),
  };
};

export const cgeb: Benefit = {
  id: "cgeb",
  name: tri(
    "Canada Groceries and Essentials Benefit",
    "加拿大雜貨及必需品福利",
    "加拿大杂货及必需品福利",
  ),
  shortName: "CGEB",
  category: "income-support",
  level: "federal",
  description: tri(
    "A tax-free quarterly payment for people with low and modest incomes to help offset sales tax. Formerly the GST/HST credit. You get it just by filing your taxes.",
    "為低收入及中等收入人士提供的免稅季度款項，協助抵銷銷售稅。前稱 GST/HST 抵免。只需報稅即可獲得。",
    "为低收入及中等收入人士提供的免税季度款项，帮助抵销销售税。前称 GST/HST 抵免。只需报税即可获得。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(CGEB.maxSingle)}/year single, ${fmt(CGEB.maxCouple)}/year couple, plus ${fmt(CGEB.perChild)}/year per child`,
    `單身最多每年 ${fmt(CGEB.maxSingle)}、夫婦 ${fmt(CGEB.maxCouple)}，另每名子女每年 ${fmt(CGEB.perChild)}`,
    `单身最多每年 ${fmt(CGEB.maxSingle)}、夫妇 ${fmt(CGEB.maxCouple)}，另每名子女每年 ${fmt(CGEB.perChild)}`,
  ),
  figures: CGEB,
  contextFields: ["annualIncome", "familyIncome", "maritalStatus", "hasChildren", "numberOfChildren", "filedTaxes", "age"],
  check: buildCheck([
    {
      test: atLeast((c) => c.age, 19),
      hard: false,
      passReason: tri("You are 19 or older.", "你已年滿 19 歲。", "你已年满 19 岁。"),
      missingField: "age",
    },
    {
      // Soft, not hard: the 5% reduction's zero-point depends on marital
      // status and number of children (the source publishes one shared
      // starting threshold, not one flat cutoff for every household), so a
      // hard gate at any single income number would wrongly turn away larger
      // families still owed a reduced amount above this threshold.
      test: atMost((c) => c.familyIncome, val(CGEB.phaseOutThreshold)),
      hard: false,
      passReason: tri(
        "Your income is in the low-to-modest range this benefit is for.",
        "你的收入屬於此福利針對的低至中等範圍。",
        "你的收入属于此福利针对的低至中等范围。",
      ),
      failReason: tri(
        `This benefit is reduced 5% for income above ${fmt(CGEB.phaseOutThreshold)}, and may reach $0 depending on your household.`,
        `此福利在收入超過 ${fmt(CGEB.phaseOutThreshold)} 時會按 5% 遞減，視乎家庭狀況可能減至 $0。`,
        `此福利在收入超过 ${fmt(CGEB.phaseOutThreshold)} 时会按 5% 递减，视乎家庭状况可能减至 $0。`,
      ),
      missingField: "familyIncome",
    },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: true,
      passReason: tri(
        "You file taxes, which is all it takes to receive this.",
        "你有報稅，這就是領取此福利的全部條件。",
        "你有报税，这就是领取此福利的全部条件。",
      ),
      failReason: tri(
        "You must file a tax return to get this benefit — even with no income.",
        "你必須報稅才能領取此福利 — 即使沒有收入。",
        "你必须报税才能领取此福利 — 即使没有收入。",
      ),
      missingField: "filedTaxes",
    },
  ]),
  estimateAmount: (ctx) => cgebEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("Just file your taxes", "只需報稅", "只需报税"),
      description: tri(
        "There is no separate application. File your tax return and the CRA decides automatically if you qualify.",
        "無需另行申請。報稅後稅務局會自動判斷你是否合資格。",
        "无需另行申请。报税后税务局会自动判断你是否合资格。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/goods-services-tax-harmonized-sales-tax-gst-hst-credit.html",
    },
  ],
  requiredDocuments: [
    tri("Filed income tax return", "已報的所得稅表", "已报的所得税表"),
  ],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/goods-services-tax-harmonized-sales-tax-gst-hst-credit.html",
  processingTime: tri("After you file taxes", "報稅之後", "报税之后"),
  paymentFrequency: tri("Quarterly", "每季", "每季"),
  tags: ["low-income", "tax", "quarterly", "gst"],
  relatedBenefits: ["ccb", "cwb"],
  lastUpdated: "2026-09-01",
};

// Canada Workers Benefit -- 2025 amounts from the CRA's "How much you can get".
// Source (fetched 2026-09-02): line-45300-canada-workers-benefit-cwb/how-much-you-can-get.html
//
// Every figure here was already CORRECT. The problem was that the benefit
// cited only the CWB landing page, which states no amounts, so nine values sat
// unverifiable -- right today, and with nothing to notice when they index.
// Anchoring them is the point: correctness that cannot be re-checked is
// temporary.
const CWB_URL =
  "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45300-canada-workers-benefit-cwb/how-much-you-can-get.html";

const CWB = figures({
  basicMaxSingle: {
    current: {
      value: 1633,
      from: "2025-01-01",
      source: CWB_URL,
      quote: "The maximum basic amount for the CWB for 2025 is: $1,633 for single individuals",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum basic amount, single",
  },
  basicMaxFamily: {
    current: {
      value: 2813,
      from: "2025-01-01",
      source: CWB_URL,
      quote: "$2,813 for families",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum basic amount, family",
  },
  disabilitySupplement: {
    current: {
      value: 843,
      from: "2025-01-01",
      source: CWB_URL,
      quote: "The maximum amount for the disability supplement is: $843 for single individuals",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum disability supplement",
  },
  basicReductionSingle: {
    current: {
      value: 26855,
      from: "2025-01-01",
      source: CWB_URL,
      quote: "The amount is gradually reduced if your adjusted net income is more than $26,855",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income where the basic amount starts to be reduced, single",
  },
  basicReductionFamily: {
    current: {
      value: 30639,
      from: "2025-01-01",
      source: CWB_URL,
      quote:
        "The amount is gradually reduced if your adjusted family net income is more than $30,639",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income where the basic amount starts to be reduced, family",
  },
  basicZeroSingle: {
    current: {
      value: 37742,
      from: "2025-01-01",
      source: CWB_URL,
      quote: "No basic amount is paid if your adjusted net income is more than $37,742",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income at which the basic amount reaches zero, single",
  },
  disabilityReductionSingle: {
    current: {
      value: 37740,
      from: "2025-01-01",
      source: CWB_URL,
      quote:
        "The CWB disability supplement is gradually reduced if your adjusted net income is more than $37,740",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income where the disability supplement starts to be reduced, single",
  },
  disabilityReductionFamily: {
    current: {
      value: 49389,
      from: "2025-01-01",
      source: CWB_URL,
      quote:
        "The CWB disability supplement is gradually reduced if your adjusted family net income is more than $49,389",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income where the disability supplement starts to be reduced, family",
  },
});

export const cwb: Benefit = {
  id: "cwb",
  name: tri("Canada Workers Benefit", "加拿大工作福利", "加拿大工作福利"),
  shortName: "CWB",
  category: "income-support",
  level: "federal",
  description: tri(
    "A refundable tax credit that tops up the income of people who work but earn a low wage. There is an extra amount for workers with a disability.",
    "為在職但收入偏低人士補貼收入的可退還稅務抵免。殘障工作者可獲額外款項。",
    "为在职但收入偏低人士补贴收入的可退还税务抵免。残障工作者可获额外款项。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(CWB.basicMaxSingle)}/year single or ${fmt(CWB.basicMaxFamily)}/year family, plus ${fmt(CWB.disabilitySupplement)} disability supplement`,
    `單身最多每年 ${fmt(CWB.basicMaxSingle)}、家庭 ${fmt(CWB.basicMaxFamily)}，另殘障補助 ${fmt(CWB.disabilitySupplement)}`,
    `单身最多每年 ${fmt(CWB.basicMaxSingle)}、家庭 ${fmt(CWB.basicMaxFamily)}，另残障补助 ${fmt(CWB.disabilitySupplement)}`,
  ),
  figures: CWB,
  contextFields: ["employmentStatus", "annualIncome", "familyIncome", "maritalStatus", "hasChildren", "hasDisability", "age"],
  check: buildCheck([
    {
      test: atLeast((c) => c.age, 19),
      hard: true,
      passReason: tri("You are 19 or older.", "你已年滿 19 歲。", "你已年满 19 岁。"),
      failReason: tri(
        "You generally must be 19 or older at the end of the year.",
        "你一般須在年底時年滿 19 歲。",
        "你一般须在年底时年满 19 岁。",
      ),
      missingField: "age",
    },
    {
      test: oneOf((c) => c.employmentStatus, ["employed", "self-employed"]),
      hard: true,
      passReason: tri(
        "You have working income, which this benefit rewards.",
        "你有工作收入，正是此福利支持的對象。",
        "你有工作收入，正是此福利支持的对象。",
      ),
      failReason: tri(
        "The Canada Workers Benefit is for people with income from working.",
        "加拿大工作福利適用於有工作收入的人士。",
        "加拿大工作福利适用于有工作收入的人士。",
      ),
      missingField: "employmentStatus",
    },
    {
      test: atMost((c) => c.annualIncome, val(CWB.basicZeroSingle)),
      hard: false,
      passReason: tri(
        "Your income is in the range that receives the benefit.",
        "你的收入在可獲此福利的範圍內。",
        "你的收入在可获此福利的范围内。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: (ctx) => {
    const family =
      ctx.maritalStatus === "married" ||
      ctx.maritalStatus === "common-law" ||
      ctx.hasChildren === true;
    const maxBasic = family ? val(CWB.basicMaxFamily) : val(CWB.basicMaxSingle);
    const maxDisab = ctx.hasDisability ? val(CWB.disabilitySupplement) : 0;
    const income = family ? ctx.familyIncome : ctx.annualIncome;
    if (income === undefined) {
      return { low: 0, high: maxBasic + maxDisab, period: "year" };
    }
    // Basic amount phases out at 15% above the threshold.
    const basicThreshold = family
      ? val(CWB.basicReductionFamily)
      : val(CWB.basicReductionSingle);
    const basic = Math.max(
      0,
      maxBasic - Math.max(0, income - basicThreshold) * 0.15,
    );
    // Disability supplement phases out at 15% above its own threshold.
    const disThreshold = family
      ? val(CWB.disabilityReductionFamily)
      : val(CWB.disabilityReductionSingle);
    const disability =
      maxDisab > 0
        ? Math.max(0, maxDisab - Math.max(0, income - disThreshold) * 0.15)
        : 0;
    const amount = Math.round(basic + disability);
    return {
      low: amount,
      high: amount,
      period: "year",
      note: tri(
        "Estimated from your working income. Rates differ in Quebec, Alberta, and Nunavut.",
        "根據你的工作收入估算。魁北克、亞伯達及努納武特的比率不同。",
        "根据你的工作收入估算。魁北克、阿尔伯塔及努纳武特的比率不同。",
      ),
    };
  },
  applicationSteps: [
    {
      order: 1,
      title: tri("Claim it on your tax return", "在報稅表申索", "在报税表申索"),
      description: tri(
        "File your taxes and complete Schedule 6. Tax software does this automatically. You may also get advance payments through the year.",
        "報稅並填寫附表 6，報稅軟件會自動處理。你亦可於年內獲得預付款項。",
        "报税并填写附表 6，报税软件会自动处理。你亦可于年内获得预付款项。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45300-canada-workers-benefit-cwb.html",
    },
  ],
  requiredDocuments: [
    tri("Filed income tax return", "已報的所得稅表", "已报的所得税表"),
  ],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45300-canada-workers-benefit-cwb.html",
  paymentFrequency: tri(
    "Yearly refund plus advance payments",
    "每年退款及預付款項",
    "每年退款及预付款项",
  ),
  tags: ["low-income", "working", "refundable", "disability"],
  relatedBenefits: ["cgeb", "dtc"],
  lastUpdated: "2026-09-01",
};

// EI regular benefits -- rate and weekly cap from the page that states them.
// Source (fetched 2026-09-02):
// https://www.canada.ca/en/services/benefits/ei/ei-regular-benefit/benefit-amount.html
// The benefit previously cited only the EI overview page, which states no
// dollar amounts, so none of its figures could be checked against anything.
const EI_AMOUNT_URL =
  "https://www.canada.ca/en/services/benefits/ei/ei-regular-benefit/benefit-amount.html";

const EI_FIGURES = figures({
  maxWeekly: {
    current: {
      value: 729,
      from: "2026-01-01",
      source: EI_AMOUNT_URL,
      quote:
        "As of January 1, 2026, the maximum yearly insurable earnings amount is $68,900. This means that you can receive a maximum amount of $729 per week",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum weekly benefit",
  },
  maxInsurableEarnings: {
    current: {
      value: 68900,
      from: "2026-01-01",
      source: EI_AMOUNT_URL,
      quote: "the maximum yearly insurable earnings amount is $68,900",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum yearly insurable earnings",
  },
  rate: {
    current: {
      value: 55,
      from: "2026-01-01",
      source: EI_AMOUNT_URL,
      quote: "to 55% of your earnings",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "percent",
    label: "Benefit rate",
  },
});

export const ei: Benefit = {
  id: "ei",
  name: tri("Employment Insurance", "就業保險", "就业保险"),
  shortName: "EI",
  category: "income-support",
  level: "federal",
  description: tri(
    "Temporary income if you lose your job through no fault of your own (regular benefits) or cannot work because of illness or injury (sickness benefits). You must have paid into EI.",
    "在你非因己過而失業（正常福利）或因病或受傷而無法工作（疾病福利）時提供臨時收入。你必須曾繳付 EI。",
    "在你非因己过而失业（正常福利）或因病或受伤而无法工作（疾病福利）时提供临时收入。你必须曾缴付 EI。",
  ),
  estimatedValue: tri(
    `${fmt(EI_FIGURES.rate)} of earnings, up to ${fmt(EI_FIGURES.maxWeekly)}/week (2026), for up to 45 weeks (regular) or 26 weeks (sickness)`,
    `收入的 ${fmt(EI_FIGURES.rate)}，最多每週 ${fmt(EI_FIGURES.maxWeekly)}（2026），正常福利最多 45 週、疾病福利最多 26 週`,
    `收入的 ${fmt(EI_FIGURES.rate)}，最多每周 ${fmt(EI_FIGURES.maxWeekly)}（2026），正常福利最多 45 周、疾病福利最多 26 周`,
  ),
  figures: EI_FIGURES,
  contextFields: ["hasRecentEiHours", "employmentStatus"],
  check: buildCheck([
    {
      test: isTrue((c) => c.hasRecentEiHours),
      hard: true,
      passReason: tri(
        "You paid into EI while working, which is the main requirement.",
        "你工作時有繳付 EI，這是主要條件。",
        "你工作时有缴付 EI，这是主要条件。",
      ),
      failReason: tri(
        "You need enough recent insurable hours (usually 420-700) paid into EI. Self-employed people usually do not qualify for regular benefits.",
        "你需要足夠的近期可保工時（通常 420-700 小時）並繳付 EI。自僱人士一般不符合正常福利資格。",
        "你需要足够的近期可保工时（通常 420-700 小时）并缴付 EI。自雇人士一般不符合正常福利资格。",
      ),
      missingField: "hasRecentEiHours",
    },
    {
      test: oneOf((c) => c.employmentStatus, ["unemployed", "unable-to-work"]),
      hard: false,
      passReason: tri(
        "You are not working right now, so you may be able to claim.",
        "你目前沒有工作，因此或可申索。",
        "你目前没有工作，因此或可申索。",
      ),
      missingField: "employmentStatus",
    },
  ]),
  estimateAmount: () => ({
    low: 0,
    high: 3157,
    period: "month",
    note: tri(
      `About ${fmt(EI_FIGURES.rate)} of your usual pay, capped at ${fmt(EI_FIGURES.maxWeekly)}/week, and temporary.`,
      `約為你平常薪金的 ${fmt(EI_FIGURES.rate)}，上限每週 ${fmt(EI_FIGURES.maxWeekly)}，屬臨時性質。`,
      `约为你平常薪金的 ${fmt(EI_FIGURES.rate)}，上限每周 ${fmt(EI_FIGURES.maxWeekly)}，属临时性质。`,
    ),
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply as soon as you stop working", "一停止工作即申請", "一停止工作即申请"),
      description: tri(
        "Apply online right away — even before you get your Record of Employment. Waiting more than 4 weeks can cost you benefits.",
        "立即網上申請 — 即使尚未收到就業紀錄 (ROE)。延遲超過 4 週可能損失福利。",
        "立即网上申请 — 即使尚未收到就业纪录 (ROE)。延迟超过 4 周可能损失福利。",
      ),
      actionUrl: "https://www.canada.ca/en/services/benefits/ei/ei-regular-benefit/apply.html",
    },
    {
      order: 2,
      title: tri(
        "Get your Record of Employment",
        "取得就業紀錄 (ROE)",
        "取得就业纪录 (ROE)",
      ),
      description: tri(
        "Your employer sends the Record of Employment to Service Canada, usually electronically. For sickness benefits you also need a medical certificate.",
        "僱主會將就業紀錄（通常以電子方式）交予 Service Canada。申請疾病福利還需醫療證明。",
        "雇主会将就业纪录（通常以电子方式）交予 Service Canada。申请疾病福利还需医疗证明。",
      ),
    },
    {
      order: 3,
      title: tri("Submit reports every 2 weeks", "每兩週提交報告", "每两周提交报告"),
      description: tri(
        "To keep getting paid, submit your reports on time confirming you are still eligible.",
        "為持續獲發款項，請準時提交報告確認你仍然合資格。",
        "为持续获发款项，请准时提交报告确认你仍然合资格。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Record of Employment", "就業紀錄 (ROE)", "就业纪录 (ROE)"),
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
    tri("Banking information for direct deposit", "直接存款的銀行資料", "直接存款的银行资料"),
    tri("Medical certificate (for sickness benefits)", "醫療證明（疾病福利）", "医疗证明（疾病福利）"),
  ],
  applicationUrl: "https://www.canada.ca/en/services/benefits/ei/ei-regular-benefit/apply.html",
  officialInfoUrl: "https://www.canada.ca/en/services/benefits/ei/ei-regular-benefit.html",
  processingTime: tri("First payment usually in 28 days", "首次付款通常 28 日內", "首次付款通常 28 日内"),
  paymentFrequency: tri("Every 2 weeks", "每兩週", "每两周"),
  tags: ["unemployed", "sickness", "income", "temporary", "working"],
  relatedBenefits: ["cwb", "cpp-d"],
  lastUpdated: "2026-09-01",
};

export const federalIncomeBenefits: Benefit[] = [cgeb, cwb, ei];
