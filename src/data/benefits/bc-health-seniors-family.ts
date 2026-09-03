import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, atMostOf, buildCheck, isTrue, oneOf } from "@/lib/checks";

export const fairPharmacare: Benefit = {
  id: "fair-pharmacare",
  name: tri("Fair PharmaCare", "公平藥物保障", "公平药物保障"),
  shortName: "Fair PharmaCare",
  category: "health",
  level: "provincial-bc",
  description: tri(
    "BC's main drug plan. It helps pay for prescription drugs and some medical supplies, based on your family income. Lower-income families pay a lower deductible — sometimes zero.",
    "卑詩省主要藥物計劃，按家庭收入協助支付處方藥及部分醫療用品。低收入家庭自付額較低，有時為零。",
    "不列颠哥伦比亚省主要药物计划，按家庭收入帮助支付处方药及部分医疗用品。低收入家庭自付额较低，有时为零。",
  ),
  estimatedValue: tri(
    "Prescription drug coverage with an income-based deductible",
    "處方藥保障，自付額按收入計算",
    "处方药保障，自付额按收入计算",
  ),
  contextFields: ["province", "familyIncome"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri(
        "You live in BC and have MSP, so you can register.",
        "你居住在卑詩省並有 MSP，因此可登記。",
        "你居住在不列颠哥伦比亚省并有 MSP，因此可登记。",
      ),
      failReason: tri(
        "Fair PharmaCare is for BC residents enrolled in MSP.",
        "公平藥物保障適用於已參加 MSP 的卑詩省居民。",
        "公平药物保障适用于已参加 MSP 的不列颠哥伦比亚省居民。",
      ),
      missingField: "province",
    },
    {
      test: atMost((c) => c.familyIncome, 45000),
      hard: false,
      passReason: tri(
        "At your income, your deductible is likely low or zero.",
        "以你的收入，自付額很可能較低或為零。",
        "以你的收入，自付额很可能较低或为零。",
      ),
      missingField: "familyIncome",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Register online", "網上登記", "网上登记"),
      description: tri(
        "Register for Fair PharmaCare online. Registration is free and lowers your deductible — do it even if you rarely buy medication.",
        "網上登記公平藥物保障。登記免費並可降低自付額 — 即使你甚少買藥也應登記。",
        "网上登记公平药物保障。登记免费并可降低自付额 — 即使你甚少买药也应登记。",
      ),
      actionUrl:
        "https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/pharmacare-for-bc-residents/who-we-cover/fair-pharmacare-plan",
      tips: [
        tri(
          "If you do not register, your deductible defaults to $10,000. Registering is worth it.",
          "如不登記，自付額預設為 $10,000。登記很值得。",
          "如不登记，自付额默认为 $10,000。登记很值得。",
        ),
      ],
    },
  ],
  requiredDocuments: [
    tri("Social Insurance Number and MSP details", "社會保險號碼及 MSP 資料", "社会保险号码及 MSP 资料"),
  ],
  applicationUrl:
    "https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/pharmacare-for-bc-residents/who-we-cover/fair-pharmacare-plan",
  officialInfoUrl:
    "https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/pharmacare-for-bc-residents/who-we-cover/fair-pharmacare-plan",
  processingTime: tri("Same day", "即日", "即日"),
  paymentFrequency: tri("Ongoing coverage", "持續保障", "持续保障"),
  tags: ["health", "prescriptions", "drugs", "bc", "low-income"],
  relatedBenefits: ["cdcp", "msp-supplementary"],
  lastUpdated: "2026-09-01",
};

export const mspSupplementary: Benefit = {
  id: "msp-supplementary",
  name: tri(
    "MSP Supplementary Benefits",
    "MSP 補充福利",
    "MSP 补充福利",
  ),
  shortName: "MSP Supplementary",
  category: "health",
  level: "provincial-bc",
  description: tri(
    "For lower-income BC residents, MSP helps pay for some visits to physiotherapists, chiropractors, massage therapists, naturopaths, and podiatrists.",
    "為低收入卑詩省居民提供部分物理治療、脊醫、按摩治療、自然療法及足病診療的費用。",
    "为低收入不列颠哥伦比亚省居民提供部分物理治疗、脊医、按摩治疗、自然疗法及足病诊疗的费用。",
  ),
  estimatedValue: tri(
    "Partial coverage for several therapy visits each year",
    "每年若干次治療的部分費用",
    "每年若干次治疗的部分费用",
  ),
  contextFields: ["province", "familyIncome"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "These benefits are for BC residents enrolled in MSP.",
        "此福利適用於已參加 MSP 的卑詩省居民。",
        "此福利适用于已参加 MSP 的不列颠哥伦比亚省居民。",
      ),
      missingField: "province",
    },
    {
      test: atMost((c) => c.familyIncome, 42000),
      hard: true,
      passReason: tri(
        "Your income is within the range for supplementary benefits.",
        "你的收入在補充福利的範圍內。",
        "你的收入在补充福利的范围内。",
      ),
      failReason: tri(
        "Supplementary benefits are income-tested and aimed at lower-income residents.",
        "補充福利按收入審查，主要面向較低收入居民。",
        "补充福利按收入审查，主要面向较低收入居民。",
      ),
      missingField: "familyIncome",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Check your MSP status", "查看你的 MSP 狀況", "查看你的 MSP 状况"),
      description: tri(
        "If you qualify for MSP premium assistance based on income, supplementary benefits are applied automatically. Register for premium assistance if you have not.",
        "如你按收入符合 MSP 保費援助資格，補充福利會自動適用。如尚未登記保費援助，請登記。",
        "如你按收入符合 MSP 保费援助资格，补充福利会自动适用。如尚未登记保费援助，请登记。",
      ),
      actionUrl:
        "https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp/bc-residents/benefits/services-covered-by-msp/supplementary-benefits",
    },
  ],
  requiredDocuments: [
    tri("MSP enrolment", "MSP 登記", "MSP 登记"),
  ],
  officialInfoUrl:
    "https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp/bc-residents/benefits/services-covered-by-msp/supplementary-benefits",
  paymentFrequency: tri("Per visit coverage", "按次覆蓋", "按次覆盖"),
  tags: ["health", "therapy", "physio", "bc", "low-income"],
  relatedBenefits: ["fair-pharmacare", "cdcp"],
  lastUpdated: "2026-09-01",
};

// BC Seniors Supplement -- paid to GIS recipients, so its income test should
// follow the GIS thresholds rather than a single flat number. The app used
// $22,488 for everyone; Service Canada's limits run from $22,800 for a single
// person to $54,624 for a couple whose spouse receives no OAS.
const BCSS_GIS_URL =
  "https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/eligibility.html";
const BCSS_URL =
  "https://www2.gov.bc.ca/gov/content/family-social-supports/seniors/financial-legal-matters/income-security-programs/seniors-supplement";

const BCSS = figures({
  gisIncomeLimitSingle: {
    current: {
      value: 22800,
      from: "2026-07-01",
      source: BCSS_GIS_URL,
      quote: "I am single, divorced, or widowed. Less than $22,800",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "GIS income limit, single",
  },
  gisIncomeLimitCoupleWidest: {
    current: {
      value: 54624,
      from: "2026-07-01",
      source: BCSS_GIS_URL,
      quote:
        "I have a spouse or common-law partner who does not receive OAS. Less than $54,624 (combined annual income of couple)",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Widest GIS combined income limit for a couple",
  },
  maxMonthlySingle: {
    current: {
      value: 99.3,
      from: "2026-07-01",
      source: BCSS_URL,
      quote: "you could receive: $1.00 to $99.30 for single seniors",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Maximum monthly supplement, single senior",
  },
  maxMonthlyCouple: {
    current: {
      value: 220.5,
      from: "2026-07-01",
      source: BCSS_URL,
      quote: "$2.00 to $220.50 for senior couples",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Maximum monthly supplement, senior couple",
  },
});

/** Same widest-couple-threshold rule used for GIS itself, for the same reason. */
const bcssIncomeCeiling = (c: { maritalStatus?: string }): number =>
  c.maritalStatus === "married" || c.maritalStatus === "common-law"
    ? val(BCSS.gisIncomeLimitCoupleWidest)
    : val(BCSS.gisIncomeLimitSingle);

export const bcSeniorsSupplement: Benefit = {
  id: "bc-seniors-supplement",
  figures: BCSS,
  name: tri(
    "BC Seniors Supplement",
    "卑詩省長者補助金",
    "不列颠哥伦比亚省长者补助金",
  ),
  shortName: "Seniors Supplement",
  category: "seniors",
  level: "provincial-bc",
  description: tri(
    "An automatic monthly top-up for BC seniors who receive the federal Guaranteed Income Supplement. You do not need to apply — it is paid automatically.",
    "為領取聯邦保證收入補助金的卑詩省長者提供的自動每月補助。無需申請，自動發放。",
    "为领取联邦保证收入补助金的不列颠哥伦比亚省长者提供的自动每月补助。无需申请，自动发放。",
  ),
  estimatedValue: tri(
    `Up to about ${fmt(BCSS.maxMonthlySingle)}/month for a single senior, or ${fmt(BCSS.maxMonthlyCouple)}/month for a couple (paid automatically)`,
    `單身長者最多約每月 ${fmt(BCSS.maxMonthlySingle)}，夫婦最多約每月 ${fmt(BCSS.maxMonthlyCouple)}（自動發放）`,
    `单身长者最多约每月 ${fmt(BCSS.maxMonthlySingle)}，夫妇最多约每月 ${fmt(BCSS.maxMonthlyCouple)}（自动发放）`,
  ),
  contextFields: ["province", "age", "annualIncome"],
  prerequisites: ["gis"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "The supplement is for BC seniors on GIS.",
        "此補助適用於領取 GIS 的卑詩省長者。",
        "此补助适用于领取 GIS 的不列颠哥伦比亚省长者。",
      ),
      missingField: "province",
    },
    {
      test: atLeast((c) => c.age, 65),
      hard: true,
      passReason: tri("You are 65 or older.", "你已年滿 65 歲。", "你已年满 65 岁。"),
      failReason: tri(
        "This supplement is for seniors aged 65 and older who receive GIS.",
        "此補助適用於 65 歲或以上、領取 GIS 的長者。",
        "此补助适用于 65 岁或以上、领取 GIS 的长者。",
      ),
      missingField: "age",
    },
    {
      test: atMostOf(
        (c) => (bcssIncomeCeiling(c) === val(BCSS.gisIncomeLimitSingle) ? c.annualIncome : c.familyIncome ?? c.annualIncome),
        bcssIncomeCeiling,
      ),
      hard: true,
      passReason: tri(
        "Your income is low enough to receive GIS, which triggers this supplement.",
        "你的收入足夠低以領取 GIS，並會觸發此補助。",
        "你的收入足够低以领取 GIS，并会触发此补助。",
      ),
      failReason: tri(
        "You must receive the federal GIS, which is for low-income seniors.",
        "你必須領取聯邦 GIS（面向低收入長者）。",
        "你必须领取联邦 GIS（面向低收入长者）。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: (ctx) => {
    const high =
      ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law"
        ? val(BCSS.maxMonthlyCouple)
        : val(BCSS.maxMonthlySingle);
    return { low: 0, high, period: "month" };
  },
  applicationSteps: [
    {
      order: 1,
      title: tri("No application needed", "無需申請", "无需申请"),
      description: tri(
        "Once you receive the federal Guaranteed Income Supplement, the BC Seniors Supplement is added automatically. Just keep filing your taxes.",
        "一旦領取聯邦保證收入補助金，卑詩省長者補助金便會自動加入。只需持續報稅即可。",
        "一旦领取联邦保证收入补助金，不列颠哥伦比亚省长者补助金便会自动加入。只需持续报税即可。",
      ),
      actionUrl:
        "https://www2.gov.bc.ca/gov/content/family-social-supports/seniors/financial-legal-matters/income-security-programs/seniors-supplement",
    },
  ],
  requiredDocuments: [],
  officialInfoUrl:
    "https://www2.gov.bc.ca/gov/content/family-social-supports/seniors/financial-legal-matters/income-security-programs/seniors-supplement",
  processingTime: tri("Automatic with GIS", "隨 GIS 自動辦理", "随 GIS 自动办理"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["seniors", "65+", "low-income", "bc", "automatic"],
  relatedBenefits: ["gis", "oas", "safer"],
  lastUpdated: "2026-09-01",
};

const bcFamilyEstimate = (ctx: {
  hasChildren?: boolean;
  numberOfChildren?: number;
  maritalStatus?: string;
  familyIncome?: number;
}): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const n = ctx.numberOfChildren ?? 1;
  let max = 1750;
  if (n >= 2) max += 1100;
  if (n > 2) max += (n - 2) * 900;
  const lone =
    ctx.maritalStatus === "single" ||
    ctx.maritalStatus === "separated" ||
    ctx.maritalStatus === "divorced" ||
    ctx.maritalStatus === "widowed"
      ? 500
      : 0;
  const income = ctx.familyIncome;
  if (income === undefined) {
    return { low: 0, high: max + lone, period: "year" };
  }
  const floor = bcfbFloor(n);
  const taperStart = val(BCFB.reductionStartsAt);
  const floorEnd = val(BCFB.floorResumesTaperAt);

  let amount: number;
  if (income <= taperStart) {
    amount = max;
  } else if (income <= floorEnd) {
    // Reduced by 4% of income over the threshold, but never below the floor.
    amount = Math.max(floor, Math.round(max - (income - taperStart) * 0.04));
  } else {
    // Above the upper threshold the floor itself tapers at 4%.
    amount = Math.max(0, Math.round(floor - (income - floorEnd) * 0.04));
  }
  return {
    low: amount > 0 ? amount + lone : 0,
    high: amount > 0 ? amount + lone : 0,
    period: "year",
    note: tri(
      "Rough estimate. The exact amount depends on your family net income.",
      "粗略估算。實際金額視乎家庭淨收入。",
      "粗略估算。实际金额视乎家庭净收入。",
    ),
  };
};

// BC Family Benefit -- BC's reduction has a FLOOR, which the app was missing.
// Source (fetched 2026-09-02):
// https://www2.gov.bc.ca/gov/content/family-social-supports/affordability/family-benefit
//
// The province reduces the maximum by 4% of income over $30,176 but never
// below a guaranteed minimum of $775 / $750 / $725 per child, and only resumes
// tapering above $96,562. The app applied the 4% straight down to zero, so a
// one-child family on $70,000 was shown about $157 when they are entitled to
// at least $775, and a family on $100,000 was shown $0 when they still receive
// several hundred dollars. Under-promising, on a benefit reaching most BC
// families with children.
const BCFB_URL =
  "https://www2.gov.bc.ca/gov/content/family-social-supports/affordability/family-benefit";
const BCFB_FLOOR_SENTENCE =
  "If your adjusted family net income for the 2025 tax year is between $30,176 and $96,562, you'll receive a reduced amount of at least: $775 for your first child $750 for your second child $725 for each additional child";

const BCFB = figures({
  reductionStartsAt: {
    current: { value: 30176, from: "2026-07-01", source: BCFB_URL, quote: BCFB_FLOOR_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income where the reduction begins",
  },
  floorResumesTaperAt: {
    current: { value: 96562, from: "2026-07-01", source: BCFB_URL, quote: BCFB_FLOOR_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Income above which the guaranteed minimum starts tapering",
  },
  floorFirstChild: {
    current: { value: 775, from: "2026-07-01", source: BCFB_URL, quote: BCFB_FLOOR_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Guaranteed minimum, first child",
  },
  floorSecondChild: {
    current: { value: 750, from: "2026-07-01", source: BCFB_URL, quote: BCFB_FLOOR_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Guaranteed minimum, second child",
  },
  floorAdditionalChild: {
    current: { value: 725, from: "2026-07-01", source: BCFB_URL, quote: BCFB_FLOOR_SENTENCE },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Guaranteed minimum, each additional child",
  },
});

/** The guaranteed minimum for a family of this size. */
const bcfbFloor = (children: number): number => {
  if (children <= 0) return 0;
  let floor = val(BCFB.floorFirstChild);
  if (children >= 2) floor += val(BCFB.floorSecondChild);
  if (children > 2) floor += (children - 2) * val(BCFB.floorAdditionalChild);
  return floor;
};

export const bcFamilyBenefit: Benefit = {
  id: "bc-family-benefit",
  figures: BCFB,
  name: tri("BC Family Benefit", "卑詩省家庭福利", "不列颠哥伦比亚省家庭福利"),
  shortName: "BC Family Benefit",
  category: "family",
  level: "provincial-bc",
  description: tri(
    "A tax-free monthly payment for BC families with children under 18, paid together with the Canada Child Benefit. Single parents get an extra amount.",
    "為有 18 歲以下子女的卑詩省家庭提供的免稅每月款項，與加拿大兒童福利一併發放。單親父母可獲額外款項。",
    "为有 18 岁以下子女的不列颠哥伦比亚省家庭提供的免税每月款项，与加拿大儿童福利一并发放。单亲父母可获额外款项。",
  ),
  estimatedValue: tri(
    "Up to $1,750/year first child, $1,100 second, $900 each additional; +$500 for single parents",
    "首名子女最多每年 $1,750、次名 $1,100、其後每名 $900；單親家庭另加 $500",
    "首名子女最多每年 $1,750、次名 $1,100、其后每名 $900；单亲家庭另加 $500",
  ),
  contextFields: ["province", "hasChildren", "numberOfChildren", "maritalStatus", "familyIncome"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "The BC Family Benefit is for BC residents.",
        "卑詩省家庭福利適用於卑詩省居民。",
        "不列颠哥伦比亚省家庭福利适用于不列颠哥伦比亚省居民。",
      ),
      missingField: "province",
    },
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
  estimateAmount: (ctx) => bcFamilyEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("No separate application", "無需另行申請", "无需另行申请"),
      description: tri(
        "If you get the Canada Child Benefit, you are automatically assessed for the BC Family Benefit. Just file your taxes each year.",
        "如你領取加拿大兒童福利，便會自動評估卑詩省家庭福利。每年報稅即可。",
        "如你领取加拿大儿童福利，便会自动评估不列颠哥伦比亚省家庭福利。每年报税即可。",
      ),
      actionUrl:
        "https://www2.gov.bc.ca/gov/content/family-social-supports/affordability/family-benefit",
    },
  ],
  requiredDocuments: [
    tri("Filed income tax return", "已報的所得稅表", "已报的所得税表"),
  ],
  officialInfoUrl:
    "https://www2.gov.bc.ca/gov/content/family-social-supports/affordability/family-benefit",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["family", "children", "bc", "low-income"],
  relatedBenefits: ["ccb", "rap"],
  lastUpdated: "2026-09-01",
};

export const bcClimateActionCredit: Benefit = {
  id: "bc-climate-action-credit",
  name: tri(
    "BC Climate Action Tax Credit",
    "卑詩省氣候行動稅務抵免",
    "不列颠哥伦比亚省气候行动税务抵免",
  ),
  shortName: "BC CATC",
  category: "tax-credits",
  level: "provincial-bc",
  description: tri(
    "A quarterly payment that offset BC's carbon tax for low- and moderate-income residents. This program has ended.",
    "為低收入及中等收入居民抵銷卑詩省碳稅的季度款項。此計劃已結束。",
    "为低收入及中等收入居民抵销不列颠哥伦比亚省碳税的季度款项。此计划已结束。",
  ),
  estimatedValue: tri("Ended — no longer paid", "已結束 — 不再發放", "已结束 — 不再发放"),
  discontinued: true,
  discontinuedNote: tri(
    "BC's carbon tax was repealed on April 1, 2025, and the final Climate Action Tax Credit payment was issued in April 2025. There are no new payments.",
    "卑詩省碳稅已於 2025 年 4 月 1 日廢除，最後一次氣候行動稅務抵免於 2025 年 4 月發放。不再有新款項。",
    "不列颠哥伦比亚省碳税已于 2025 年 4 月 1 日废除，最后一次气候行动税务抵免于 2025 年 4 月发放。不再有新款项。",
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
    "https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/credits/climate-action",
  tags: ["ended", "carbon", "bc", "tax-credits"],
  relatedBenefits: [],
  lastUpdated: "2026-09-01",
};

export const bcHealthSeniorsFamilyBenefits: Benefit[] = [
  fairPharmacare,
  mspSupplementary,
  bcSeniorsSupplement,
  bcFamilyBenefit,
  bcClimateActionCredit,
];
