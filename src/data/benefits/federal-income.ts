import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { atLeast, atMost, buildCheck, isTrue, oneOf } from "@/lib/checks";

const cgebEstimate = (ctx: {
  maritalStatus?: string;
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate => {
  const couple =
    ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
  let base = couple ? 698 : 533;
  if (ctx.hasChildren) base += 184 * (ctx.numberOfChildren ?? 1);
  const income = ctx.familyIncome;
  if (income === undefined) return { low: 0, high: base, period: "year" };
  const reduce = Math.max(0, income - 45521) * 0.05;
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
    "Up to $533/year single, $698/year couple, plus $184/year per child",
    "單身最多每年 $533、夫婦 $698，另每名子女每年 $184",
    "单身最多每年 $533、夫妇 $698，另每名子女每年 $184",
  ),
  contextFields: ["annualIncome", "familyIncome", "maritalStatus", "hasChildren", "numberOfChildren", "filedTaxes", "age"],
  check: buildCheck([
    {
      test: atLeast((c) => c.age, 19),
      hard: false,
      passReason: tri("You are 19 or older.", "你已年滿 19 歲。", "你已年满 19 岁。"),
      missingField: "age",
    },
    {
      test: atMost((c) => c.familyIncome, 65000),
      hard: true,
      passReason: tri(
        "Your income is in the low-to-modest range this benefit is for.",
        "你的收入屬於此福利針對的低至中等範圍。",
        "你的收入属于此福利针对的低至中等范围。",
      ),
      failReason: tri(
        "This benefit phases out at higher incomes (roughly above $56,000 for a single person).",
        "此福利在較高收入時逐步取消（單身約 $56,000 以上）。",
        "此福利在较高收入时逐步取消（单身约 $56,000 以上）。",
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
    "Up to $1,633/year single or $2,813/year family, plus $843 disability supplement",
    "單身最多每年 $1,633、家庭 $2,813，另殘障補助 $843",
    "单身最多每年 $1,633、家庭 $2,813，另残障补助 $843",
  ),
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
      test: atMost((c) => c.annualIncome, 37742),
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
    const maxBasic = family ? 2813 : 1633;
    const maxDisab = ctx.hasDisability ? 843 : 0;
    const income = family ? ctx.familyIncome : ctx.annualIncome;
    if (income === undefined) {
      return { low: 0, high: maxBasic + maxDisab, period: "year" };
    }
    // Basic amount phases out at 15% above the threshold.
    const basicThreshold = family ? 30639 : 26855;
    const basic = Math.max(
      0,
      maxBasic - Math.max(0, income - basicThreshold) * 0.15,
    );
    // Disability supplement phases out at 15% above its own threshold.
    const disThreshold = family ? 49389 : 37740;
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
    "55% of earnings, up to $729/week (2026), for up to 45 weeks (regular) or 26 weeks (sickness)",
    "收入的 55%，最多每週 $729（2026），正常福利最多 45 週、疾病福利最多 26 週",
    "收入的 55%，最多每周 $729（2026），正常福利最多 45 周、疾病福利最多 26 周",
  ),
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
      "About 55% of your usual pay, capped at $729/week, and temporary.",
      "約為你平常薪金的 55%，上限每週 $729，屬臨時性質。",
      "约为你平常薪金的 55%，上限每周 $729，属临时性质。",
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
