import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { buildCheck, isFalse, isTrue, lessThan, oneOf } from "@/lib/checks";

// Canada Child Benefit -- 2026-27 two-tier calculation.
// Source (fetched 2026-09-02):
// https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit/how-much.html
//
// The benefit cites the CCB overview page, which states no amounts at all --
// they live on "How much you can get". That is why the second phase-out
// threshold sat at $81,222 while the CRA had moved to $82,847: nothing was
// pointing at the page that would have shown the difference.
const CCB_AMOUNTS_URL =
  "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit/how-much.html";

const CCB_FIGURES = figures({
  maxUnder6: {
    current: {
      value: 8157,
      from: "2026-07-01",
      source: CCB_AMOUNTS_URL,
      quote: "under 6 years of age: $8,157 per year",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum per year, child under 6",
  },
  max6to17: {
    current: {
      value: 6883,
      from: "2026-07-01",
      source: CCB_AMOUNTS_URL,
      quote: "6 to 17 years of age: $6,883 per year",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum per year, child aged 6 to 17",
  },
  reductionStartsAt: {
    current: {
      value: 38237,
      from: "2026-07-01",
      source: CCB_AMOUNTS_URL,
      quote: "If your AFNI is under $38,237, you get the maximum amount for each child",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "AFNI below which the maximum is paid",
  },
  secondTierStartsAt: {
    current: {
      value: 82847,
      from: "2026-07-01",
      source: CCB_AMOUNTS_URL,
      quote:
        "Greater than $82,847 Your benefit is reduced by a fixed amount plus an additional percentage of your income greater than $82,847",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "AFNI where the second reduction tier begins",
  },
});

// Reduction rates by number of children, tier 1 then tier 2.
const CCB_RATES: Record<number, [number, number]> = {
  1: [0.07, 0.032],
  2: [0.135, 0.057],
  3: [0.19, 0.08],
  4: [0.23, 0.095],
};

const ccbEstimate = (ctx: {
  hasChildren?: boolean;
  numberOfChildren?: number;
  childrenUnder6?: number;
  youngestChildAge?: number;
  familyIncome?: number;
}): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const n = Math.max(1, ctx.numberOfChildren ?? 1);
  const under6 = Math.min(
    n,
    ctx.childrenUnder6 ??
      (ctx.youngestChildAge !== undefined && ctx.youngestChildAge < 6 ? 1 : 0),
  );
  const over6 = n - under6;
  const maxAmt =
    val(CCB_FIGURES.maxUnder6) * under6 + val(CCB_FIGURES.max6to17) * over6;
  const income = ctx.familyIncome;
  if (income === undefined) return { low: 0, high: maxAmt, period: "year" };

  const t1 = val(CCB_FIGURES.reductionStartsAt);
  const t2 = val(CCB_FIGURES.secondTierStartsAt);
  const [r1, r2] = CCB_RATES[Math.min(n, 4)];
  let reduction = 0;
  if (income > t1 && income <= t2) {
    reduction = r1 * (income - t1);
  } else if (income > t2) {
    reduction = r1 * (t2 - t1) + r2 * (income - t2);
  }
  const amount = Math.max(0, Math.round(maxAmt - reduction));
  return {
    low: amount,
    high: amount,
    period: "year",
    note: tri(
      "Calculated from your family income and how many children are under 6.",
      "根據你的家庭收入及未滿 6 歲子女人數計算。",
      "根据你的家庭收入及未满 6 岁子女人数计算。",
    ),
  };
};

export const ccb: Benefit = {
  id: "ccb",
  figures: CCB_FIGURES,
  name: tri("Canada Child Benefit", "加拿大兒童福利", "加拿大儿童福利"),
  shortName: "CCB",
  category: "family",
  level: "federal",
  description: tri(
    "A tax-free monthly payment to help families with the cost of raising children under 18. Lower-income families receive more. Children with a disability can get an extra amount.",
    "免稅的每月款項，協助家庭負擔養育 18 歲以下子女的開支。低收入家庭獲得較多。有殘障的子女可獲額外款項。",
    "免税的每月款项，帮助家庭负担养育 18 岁以下子女的开支。低收入家庭获得较多。有残障的子女可获额外款项。",
  ),
  estimatedValue: tri(
    "Up to $8,157/year per child under 6, $6,883/year per child 6-17",
    "每名 6 歲以下子女最多每年 $8,157，6-17 歲每年 $6,883",
    "每名 6 岁以下子女最多每年 $8,157，6-17 岁每年 $6,883",
  ),
  contextFields: ["hasChildren", "numberOfChildren", "childrenUnder6", "youngestChildAge", "familyIncome", "filedTaxes"],
  check: buildCheck([
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: tri(
        "You have children under 18 in your care.",
        "你有 18 歲以下的子女受你照顧。",
        "你有 18 岁以下的子女受你照顾。",
      ),
      failReason: tri(
        "The Canada Child Benefit is for people caring for a child under 18.",
        "加拿大兒童福利適用於照顧 18 歲以下子女的人士。",
        "加拿大儿童福利适用于照顾 18 岁以下子女的人士。",
      ),
      missingField: "hasChildren",
    },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: false,
      passReason: tri(
        "You file taxes, which is how the benefit is calculated.",
        "你有報稅，這是計算福利的方式。",
        "你有报税，这是计算福利的方式。",
      ),
      missingField: "filedTaxes",
    },
  ]),
  estimateAmount: (ctx) => ccbEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri(
        "Register the birth or apply online",
        "登記出生或網上申請",
        "登记出生或网上申请",
      ),
      description: tri(
        "For a newborn, you can apply through the provincial birth registration. Otherwise apply through CRA My Account or Form RC66.",
        "新生兒可透過省級出生登記申請；其他情況可透過 CRA My Account 或 RC66 表格申請。",
        "新生儿可通过省级出生登记申请；其他情况可通过 CRA My Account 或 RC66 表格申请。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview/canada-child-benefit-apply.html",
    },
    {
      order: 2,
      title: tri("File taxes every year", "每年報稅", "每年报税"),
      description: tri(
        "Both parents must file taxes each year, even with no income, so the CRA can keep paying the benefit.",
        "父母雙方每年都必須報稅（即使沒有收入），稅務局才能持續發放福利。",
        "父母双方每年都必须报税（即使没有收入），税务局才能持续发放福利。",
      ),
      tips: [
        tri(
          "If your child is approved for the Disability Tax Credit, you also get the Child Disability Benefit automatically.",
          "如子女獲批殘疾稅務抵免，你亦會自動獲得兒童殘障福利。",
          "如子女获批残疾税务抵免，你亦会自动获得儿童残障福利。",
        ),
      ],
    },
  ],
  requiredDocuments: [
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
    tri("Proof of birth (if asked)", "出生證明（如需要）", "出生证明（如需要）"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview/canada-child-benefit-apply.html",
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview.html",
  processingTime: tri("Usually 8 weeks", "通常 8 星期", "通常 8 星期"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["family", "children", "low-income", "disability"],
  relatedBenefits: ["bc-family-benefit", "cgeb", "dtc"],
  lastUpdated: "2026-09-01",
};

// Two non-refundable credits whose stated "tax reduction" reconciled at no
// current rate: the app claimed $1,700 on an $8,601 credit and $3,200 on a
// $16,129 one. A non-refundable credit is worth its amount times the lowest
// federal personal rate, which fell to 14% for 2026. Both inputs are now
// sourced and the saving is derived, the same correction already applied to
// the DTC and the Home Buyers' Amount.
const FED_RATE_URL =
  "https://www.canada.ca/en/department-finance/services/publications/report-impact-reducing-lowest-marginal-personal-income-tax-rate-non-refundable-tax-credits.html";
const FED_RATE_QUOTE =
  "is legislatively based on the lowest personal income tax rate (14 per cent in 2026)";

const CCC = figures({
  creditAmount: {
    current: {
      value: 8601,
      from: "2025-01-01",
      source:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/canada-caregiver-amount.html",
      quote:
        "You may be able to claim up to $8,601 on line 30450 for each dependant 18 years of age or older",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum claimable amount",
  },
  federalCreditRate: {
    current: { value: 14, from: "2026-01-01", source: FED_RATE_URL, quote: FED_RATE_QUOTE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "percent",
    label: "Federal rate applied to non-refundable credits",
  },
});

const ELIGIBLE_DEP = figures({
  creditAmount: {
    current: {
      value: 16129,
      from: "2025-01-01",
      source:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30000-basic-personal-amount.html",
      quote: "$177,882 or less , claim $16,129",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum claimable amount",
  },
  federalCreditRate: {
    current: { value: 14, from: "2026-01-01", source: FED_RATE_URL, quote: FED_RATE_QUOTE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "percent",
    label: "Federal rate applied to non-refundable credits",
  },
});

/** What a non-refundable credit of this size is worth federally. */
const fedCreditValue = (amount: number, ratePercent: number) =>
  Math.round((ratePercent / 100) * amount);
const fedCreditText = (amount: number, ratePercent: number) =>
  `$${fedCreditValue(amount, ratePercent).toLocaleString("en-CA")}`;

export const ccc: Benefit = {
  id: "ccc",
  figures: CCC,
  name: tri("Canada Caregiver Credit", "加拿大照顧者抵免", "加拿大照顾者抵免"),
  shortName: "CCC",
  category: "tax-credits",
  level: "federal",
  description: tri(
    "A tax credit for people who support a spouse, partner, or family member with a physical or mental impairment. In 'helping someone' mode, this is a credit the helper can claim.",
    "為供養有身體或精神障礙的配偶、伴侶或家人的人士提供的稅務抵免。在「協助他人」模式下，這是協助者可申索的抵免。",
    "为供养有身体或精神障碍的配偶、伴侣或家人的人士提供的税务抵免。在「帮助他人」模式下，这是帮助者可申索的抵免。",
  ),
  estimatedValue: tri(
    `Claim up to ${fmt(CCC.creditAmount)} — about ${fedCreditText(val(CCC.creditAmount), val(CCC.federalCreditRate))}/year off your federal tax`,
    `最多可申報 ${fmt(CCC.creditAmount)}——聯邦稅每年約可減 ${fedCreditText(val(CCC.creditAmount), val(CCC.federalCreditRate))}`,
    `最多可申报 ${fmt(CCC.creditAmount)}——联邦税每年约可减 ${fedCreditText(val(CCC.creditAmount), val(CCC.federalCreditRate))}`,
  ),
  contextFields: ["hasDisability", "helpingSomeoneElse"],
  check: buildCheck([
    {
      test: isTrue((c) => c.hasDisability),
      hard: true,
      passReason: tri(
        "You (or the person you help) support someone with a disability.",
        "你（或你協助的人）供養一位殘障人士。",
        "你（或你帮助的人）供养一位残障人士。",
      ),
      failReason: tri(
        "The caregiver credit is for people supporting a family member with a physical or mental impairment.",
        "照顧者抵免適用於供養有身體或精神障礙家人的人士。",
        "照顾者抵免适用于供养有身体或精神障碍家人的人士。",
      ),
      missingField: "hasDisability",
    },
  ]),
  estimateAmount: () => ({
    low: 0,
    high: fedCreditValue(val(CCC.creditAmount), val(CCC.federalCreditRate)),
    period: "year",
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri(
        "Claim it on your tax return",
        "在報稅表上申索",
        "在报税表上申索",
      ),
      description: tri(
        "Claim the amount on lines 30425 or 30450 of your tax return. The CRA may ask for a signed statement from a medical practitioner.",
        "在報稅表第 30425 或 30450 行申索。稅務局可能要求醫療人員的簽署聲明。",
        "在报税表第 30425 或 30450 行申索。税务局可能要求医疗人员的签署声明。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/canada-caregiver-amount.html",
    },
  ],
  requiredDocuments: [
    tri(
      "A signed statement from a medical practitioner (if requested)",
      "醫療人員的簽署聲明（如被要求）",
      "医疗人员的签署声明（如被要求）",
    ),
  ],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/canada-caregiver-amount.html",
  paymentFrequency: tri("Annual tax credit", "每年稅務抵免", "每年税务抵免"),
  tags: ["caregiver", "disability", "tax", "family"],
  relatedBenefits: ["dtc", "medical-expense", "eligible-dependant"],
  lastUpdated: "2026-09-01",
};

export const medicalExpense: Benefit = {
  id: "medical-expense",
  name: tri(
    "Medical Expense Tax Credit",
    "醫療開支稅務抵免",
    "医疗开支税务抵免",
  ),
  shortName: "METC",
  category: "tax-credits",
  level: "federal",
  description: tri(
    "A tax credit for out-of-pocket medical costs — prescriptions, dental, glasses, travel for care, and more — above a modest threshold. Claimed on your tax return.",
    "為自付醫療開支（處方藥、牙科、眼鏡、就醫交通等）超過一定門檻的部分提供稅務抵免，於報稅時申索。",
    "为自付医疗开支（处方药、牙科、眼镜、就医交通等）超过一定门槛的部分提供税务抵免，于报税时申索。",
  ),
  estimatedValue: tri(
    "Depends on your expenses above the lesser of 3% of net income or about $2,834",
    "視乎超過「淨收入 3% 或約 $2,834（以較低者為準）」的開支",
    "视乎超过「净收入 3% 或约 $2,834（以较低者为准）」的开支",
  ),
  contextFields: ["filedTaxes", "hasDisability"],
  check: buildCheck([
    {
      test: isTrue((c) => c.filedTaxes),
      hard: true,
      passReason: tri(
        "You file taxes, so you can claim eligible medical expenses.",
        "你有報稅，可申索合資格醫療開支。",
        "你有报税，可申索合资格医疗开支。",
      ),
      failReason: tri(
        "This credit is claimed on a tax return, so you need to file taxes.",
        "此抵免於報稅時申索，因此你需要報稅。",
        "此抵免于报税时申索，因此你需要报税。",
      ),
      missingField: "filedTaxes",
    },
    {
      test: isTrue((c) => c.hasDisability),
      hard: false,
      passReason: tri(
        "A health condition often means higher medical costs you can claim.",
        "健康狀況通常代表較高、可申索的醫療開支。",
        "健康状况通常代表较高、可申索的医疗开支。",
      ),
      missingField: "hasDisability",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Keep your receipts", "保留收據", "保留收据"),
      description: tri(
        "Save receipts for prescriptions, dental, vision, and other eligible costs for you and your dependants.",
        "保留你及受養人的處方藥、牙科、視力及其他合資格開支收據。",
        "保留你及受养人的处方药、牙科、视力及其他合资格开支收据。",
      ),
    },
    {
      order: 2,
      title: tri("Claim on line 33099", "在第 33099 行申索", "在第 33099 行申索"),
      description: tri(
        "Total your eligible expenses for a 12-month period and claim them on your tax return.",
        "計算 12 個月內的合資格開支總額，並於報稅表申索。",
        "计算 12 个月内的合资格开支总额，并于报税表申索。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return.html",
    },
  ],
  requiredDocuments: [
    tri("Receipts for medical expenses", "醫療開支收據", "医疗开支收据"),
  ],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return.html",
  paymentFrequency: tri("Annual tax credit", "每年稅務抵免", "每年税务抵免"),
  tags: ["health", "tax", "medical", "dental", "prescriptions"],
  relatedBenefits: ["ccc", "dtc", "cdcp"],
  lastUpdated: "2026-09-01",
};

export const eligibleDependant: Benefit = {
  id: "eligible-dependant",
  figures: ELIGIBLE_DEP,
  name: tri(
    "Amount for an Eligible Dependant",
    "合資格受養人金額",
    "合资格受养人金额",
  ),
  shortName: "Line 30400",
  category: "tax-credits",
  level: "federal",
  description: tri(
    "A tax credit for a single person who supports a dependant — often a single parent claiming for a child. It works like a second basic personal amount.",
    "為供養受養人的單身人士提供的稅務抵免 — 常見於單親父母為子女申索。作用類似第二份基本個人免稅額。",
    "为供养受养人的单身人士提供的税务抵免 — 常见于单亲父母为子女申索。作用类似第二份基本个人免税额。",
  ),
  estimatedValue: tri(
    `Claim up to ${fmt(ELIGIBLE_DEP.creditAmount)} — about ${fedCreditText(val(ELIGIBLE_DEP.creditAmount), val(ELIGIBLE_DEP.federalCreditRate))}/year off your federal tax`,
    `最多可申報 ${fmt(ELIGIBLE_DEP.creditAmount)}——聯邦稅每年約可減 ${fedCreditText(val(ELIGIBLE_DEP.creditAmount), val(ELIGIBLE_DEP.federalCreditRate))}`,
    `最多可申报 ${fmt(ELIGIBLE_DEP.creditAmount)}——联邦税每年约可减 ${fedCreditText(val(ELIGIBLE_DEP.creditAmount), val(ELIGIBLE_DEP.federalCreditRate))}`,
  ),
  contextFields: ["maritalStatus", "hasChildren"],
  check: buildCheck([
    {
      test: oneOf((c) => c.maritalStatus, ["single", "separated", "divorced", "widowed"]),
      hard: true,
      passReason: tri(
        "You are not living with a spouse or partner.",
        "你並無與配偶或伴侶同住。",
        "你并无与配偶或伴侣同住。",
      ),
      failReason: tri(
        "This amount is for a person without a spouse or common-law partner.",
        "此金額適用於沒有配偶或同居伴侶的人士。",
        "此金额适用于没有配偶或同居伴侣的人士。",
      ),
      missingField: "maritalStatus",
    },
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: tri(
        "You support a dependant, such as a child.",
        "你供養一位受養人，例如子女。",
        "你供养一位受养人，例如子女。",
      ),
      failReason: tri(
        "You need a dependant, such as a child, living with you.",
        "你需要有與你同住的受養人，例如子女。",
        "你需要有与你同住的受养人，例如子女。",
      ),
      missingField: "hasChildren",
    },
  ]),
  estimateAmount: () => ({
    low: 0,
    high: fedCreditValue(val(ELIGIBLE_DEP.creditAmount), val(ELIGIBLE_DEP.federalCreditRate)),
    period: "year",
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Claim on line 30400", "在第 30400 行申索", "在第 30400 行申索"),
      description: tri(
        "Claim the amount for an eligible dependant on your tax return. Only one person can claim per dependant.",
        "在報稅表申索合資格受養人金額。每名受養人只可由一人申索。",
        "在报税表申索合资格受养人金额。每名受养人只可由一人申索。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30400-amount-eligible-dependant.html",
    },
  ],
  requiredDocuments: [
    tri("Your tax return", "你的報稅表", "你的报税表"),
  ],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30400-amount-eligible-dependant.html",
  paymentFrequency: tri("Annual tax credit", "每年稅務抵免", "每年税务抵免"),
  tags: ["family", "single-parent", "tax", "children"],
  relatedBenefits: ["ccb", "ccc"],
  lastUpdated: "2026-09-01",
};

// Canada Dental Care Plan -- income limit and coverage bands.
// Sources (fetched 2026-09-02):
//   .../dental-care-plan/qualify.html   income limit
//   .../dental-care-plan/coverage.html  coverage tiers
// The benefit cited only the CDCP landing page and its apply page, neither of
// which states an amount, so its income limit could not be checked.
const CDCP_QUALIFY_URL =
  "https://www.canada.ca/en/services/benefits/dental/dental-care-plan/qualify.html";
const CDCP_COVERAGE_URL =
  "https://www.canada.ca/en/services/benefits/dental/dental-care-plan/coverage.html";

const CDCP = figures({
  incomeLimit: {
    current: {
      value: 90000,
      from: "2026-01-01",
      source: CDCP_QUALIFY_URL,
      quote:
        "To be eligible for the CDCP, your adjusted family net income must be less than $90,000",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Adjusted family net income limit",
  },
  fullCoverageBelow: {
    current: {
      value: 70000,
      from: "2026-01-01",
      source: CDCP_COVERAGE_URL,
      quote: "Lower than $70,000 100% of eligible oral health care service costs will be",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income below which the plan covers 100%",
  },
  partialCoverageFrom: {
    current: {
      value: 79999,
      from: "2026-01-01",
      source: CDCP_COVERAGE_URL,
      quote: "Between $70,000 and $79,999 60% of eligible oral health care service costs",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Top of the 60%-coverage band",
  },
});

export const cdcp: Benefit = {
  id: "cdcp",
  name: tri("Canadian Dental Care Plan", "加拿大牙科保健計劃", "加拿大牙科保健计划"),
  shortName: "CDCP",
  category: "health",
  level: "federal",
  description: tri(
    "Helps pay for dental care for residents with no private dental insurance and family income under $90,000. As of 2025 it is open to all ages.",
    "協助支付牙科費用，適用於沒有私人牙科保險、家庭收入低於 $90,000 的居民。2025 年起開放予所有年齡。",
    "帮助支付牙科费用，适用于没有私人牙科保险、家庭收入低于 $90,000 的居民。2025 年起开放予所有年龄。",
  ),
  estimatedValue: tri(
    `Covers 100% of eligible dental costs under ${fmt(CDCP.fullCoverageBelow)} family income, less above that`,
    `家庭收入低於 ${fmt(CDCP.fullCoverageBelow)} 可獲全額牙科費用保障，收入較高則按比例遞減`,
    `家庭收入低于 ${fmt(CDCP.fullCoverageBelow)} 可获全额牙科费用保障，收入较高则按比例递减`,
  ),
  figures: CDCP,
  contextFields: ["hasPrivateDentalInsurance", "familyIncome", "filedTaxes"],
  check: buildCheck([
    {
      test: isFalse((c) => c.hasPrivateDentalInsurance),
      hard: true,
      passReason: tri(
        "You do not have access to private dental insurance.",
        "你沒有私人牙科保險。",
        "你没有私人牙科保险。",
      ),
      failReason: tri(
        "The plan is only for people without access to private dental insurance.",
        "此計劃只適用於沒有私人牙科保險的人士。",
        "此计划只适用于没有私人牙科保险的人士。",
      ),
      missingField: "hasPrivateDentalInsurance",
    },
    {
      test: lessThan((c) => c.familyIncome, val(CDCP.incomeLimit)),
      hard: true,
      passReason: tri(
        `Your family income is under ${fmt(CDCP.incomeLimit)}.`,
        `你的家庭收入低於 ${fmt(CDCP.incomeLimit)}。`,
        "你的家庭收入低于 $90,000。",
      ),
      failReason: tri(
        "Adjusted family net income must be under $90,000.",
        "經調整的家庭淨收入必須低於 $90,000。",
        "经调整的家庭净收入必须低于 $90,000。",
      ),
      missingField: "familyIncome",
    },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: false,
      passReason: tri(
        "You filed taxes last year, which is required.",
        "你去年有報稅，這是必須的。",
        "你去年有报税，这是必须的。",
      ),
      missingField: "filedTaxes",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply online or by phone", "網上或電話申請", "网上或电话申请"),
      description: tri(
        "Apply through the Government of Canada. You will need your Social Insurance Number and details about your dental insurance.",
        "透過加拿大政府申請。你需要社會保險號碼及牙科保險的資料。",
        "通过加拿大政府申请。你需要社会保险号码及牙科保险的资料。",
      ),
      actionUrl:
        "https://www.canada.ca/en/services/benefits/dental/dental-care-plan/apply.html",
    },
    {
      order: 2,
      title: tri("Wait for your welcome package", "等待歡迎資料", "等待欢迎资料"),
      description: tri(
        "Sun Life mails a welcome package with your coverage start date and member card. Coverage starts on that date, not before.",
        "Sun Life 會郵寄歡迎資料，列明保障生效日期及會員卡。保障由該日開始，不會提前。",
        "Sun Life 会邮寄欢迎资料，列明保障生效日期及会员卡。保障由该日开始，不会提前。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
    tri("Filed income tax return", "已報的所得稅表", "已报的所得税表"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/services/benefits/dental/dental-care-plan/apply.html",
  officialInfoUrl:
    "https://www.canada.ca/en/services/benefits/dental/dental-care-plan.html",
  processingTime: tri("A few weeks", "數星期", "数星期"),
  paymentFrequency: tri(
    "Ongoing coverage",
    "持續保障",
    "持续保障",
  ),
  tags: ["health", "dental", "low-income", "all-ages"],
  relatedBenefits: ["medical-expense", "fair-pharmacare"],
  lastUpdated: "2026-09-01",
};

export const canadaCarbonRebate: Benefit = {
  id: "canada-carbon-rebate",
  name: tri("Canada Carbon Rebate", "加拿大碳退稅", "加拿大碳退税"),
  shortName: "CCR",
  category: "tax-credits",
  level: "federal",
  description: tri(
    "A quarterly payment that returned federal fuel charge proceeds to households. This program has ended.",
    "把聯邦燃料費收入退還家庭的季度款項。此計劃已結束。",
    "把联邦燃料费收入退还家庭的季度款项。此计划已结束。",
  ),
  estimatedValue: tri(
    "Ended — no longer paid",
    "已結束 — 不再發放",
    "已结束 — 不再发放",
  ),
  discontinued: true,
  discontinuedNote: tri(
    "The federal fuel charge was removed on April 1, 2025, and the final Canada Carbon Rebate payment was issued in April 2025. There are no new payments.",
    "聯邦燃料費已於 2025 年 4 月 1 日取消，最後一次加拿大碳退稅於 2025 年 4 月發放。不再有新款項。",
    "联邦燃料费已于 2025 年 4 月 1 日取消，最后一次加拿大碳退税于 2025 年 4 月发放。不再有新款项。",
  ),
  contextFields: [],
  check: () => ({
    status: "ineligible",
    confidence: "definite",
    reasons: [
      tri(
        "This program ended in April 2025 and no new payments are made.",
        "此計劃已於 2025 年 4 月結束，不再發放新款項。",
        "此计划已于 2025 年 4 月结束，不再发放新款项。",
      ),
    ],
    missing: [],
  }),
  applicationSteps: [],
  requiredDocuments: [],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-carbon-rebate.html",
  tags: ["ended", "carbon", "tax-credits"],
  relatedBenefits: [],
  lastUpdated: "2026-09-01",
};

export const federalFamilyTaxBenefits: Benefit[] = [
  ccb,
  ccc,
  medicalExpense,
  eligibleDependant,
  cdcp,
  canadaCarbonRebate,
];
