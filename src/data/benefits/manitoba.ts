import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { atLeast, atMost, buildCheck, isFalse, isTrue, oneOf } from "@/lib/checks";

const MB = oneOf((c: { province?: string }) => c.province, ["MB"]);
const mbFail = tri(
  "This program is for residents of Manitoba.",
  "此計劃適用於緬尼托巴省居民。",
  "此计划适用于曼尼托巴省居民。",
);
const mbPass = tri("You live in Manitoba.", "你居住在緬尼托巴省。", "你居住在曼尼托巴省。");

const mcbEstimate = (ctx: {
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const n = ctx.numberOfChildren ?? 1;
  return { low: 0, high: 420 * n, period: "year" };
};

export const manitobaChildBenefit: Benefit = {
  id: "manitoba-child-benefit",
  name: tri("Manitoba Child Benefit", "緬尼托巴兒童福利", "曼尼托巴儿童福利"),
  shortName: "MCB",
  category: "family",
  level: "provincial-mb",
  description: tri(
    "A tax-free yearly payment for low-income Manitoba families with children under 18 who already receive the Canada Child Benefit.",
    "為已領取加拿大兒童福利、有 18 歲以下子女的緬尼托巴低收入家庭提供的免稅年度款項。",
    "为已领取加拿大儿童福利、有 18 岁以下子女的曼尼托巴低收入家庭提供的免税年度款项。",
  ),
  estimatedValue: tri(
    "Up to $420/year per child",
    "每名子女最多每年 $420",
    "每名子女最多每年 $420",
  ),
  contextFields: ["province", "hasChildren", "numberOfChildren", "familyIncome"],
  prerequisites: ["ccb"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
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
      test: atMost((c) => c.familyIncome, 25864),
      hard: true,
      passReason: tri(
        "Your income is within the range for this benefit.",
        "你的收入在此福利的範圍內。",
        "你的收入在此福利的范围内。",
      ),
      failReason: tri(
        "The Manitoba Child Benefit is for lower-income families (roughly under $25,864).",
        "緬尼托巴兒童福利適用於較低收入家庭（約 $25,864 以下）。",
        "曼尼托巴儿童福利适用于较低收入家庭（约 $25,864 以下）。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: (ctx) => mcbEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply to the Manitoba Child Benefit", "申請緬尼托巴兒童福利", "申请曼尼托巴儿童福利"),
      description: tri(
        "Complete the application form. You must already receive the Canada Child Benefit.",
        "填寫申請表。你必須已領取加拿大兒童福利。",
        "填写申请表。你必须已领取加拿大儿童福利。",
      ),
      actionUrl: "https://www.gov.mb.ca/fs/eia/mcb.html",
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  applicationUrl: "https://www.gov.mb.ca/fs/eia/mcb.html",
  officialInfoUrl: "https://www.gov.mb.ca/fs/eia/mcb.html",
  paymentFrequency: tri("Yearly", "每年", "每年"),
  tags: ["manitoba", "family", "children", "low-income"],
  relatedBenefits: ["ccb"],
  lastUpdated: "2026-09-01",
};

export const manitobaRentAssist: Benefit = {
  id: "manitoba-rent-assist",
  name: tri("Rent Assist (Manitoba)", "租金援助（緬尼托巴）", "租金援助（曼尼托巴）"),
  shortName: "Rent Assist",
  category: "housing",
  level: "provincial-mb",
  description: tri(
    "A monthly shelter benefit that helps low-income Manitobans who rent in the private market afford their rent.",
    "為在私人市場租住的緬尼托巴低收入居民提供的每月住屋援助。",
    "为在私人市场租住的曼尼托巴低收入居民提供的每月住房援助。",
  ),
  estimatedValue: tri(
    "Based on 80% of median market rent minus 30% of your income",
    "以市場租金中位數的 80% 減去你收入的 30% 計算",
    "以市场租金中位数的 80% 减去你收入的 30% 计算",
  ),
  contextFields: ["province", "isHomeowner", "annualIncome"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
    {
      test: isFalse((c) => c.isHomeowner),
      hard: true,
      passReason: tri("You rent your home.", "你租住居所。", "你租住居所。"),
      failReason: tri("Rent Assist helps renters, not homeowners.", "租金援助幫助租客，而非業主。", "租金援助帮助租客，而非业主。"),
      missingField: "isHomeowner",
    },
    {
      test: atMost((c) => c.annualIncome, 40000),
      hard: true,
      passReason: tri(
        "Your income is in the low range Rent Assist is for.",
        "你的收入屬租金援助針對的低收入範圍。",
        "你的收入属租金援助针对的低收入范围。",
      ),
      failReason: tri(
        "Rent Assist is for lower-income renters.",
        "租金援助適用於較低收入的租客。",
        "租金援助适用于较低收入的租客。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({
    low: 0,
    high: 350,
    period: "month",
    note: tri(
      "A rough range; use the Manitoba Rent Assist estimator for a figure.",
      "此為粗略範圍；可用緬尼托巴租金援助估算器。",
      "此为粗略范围；可用曼尼托巴租金援助估算器。",
    ),
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through the Province", "向省政府申請", "向省政府申请"),
      description: tri(
        "Apply for Rent Assist online or on paper. If you receive Employment and Income Assistance, it is included automatically.",
        "網上或紙本申請租金援助。如你領取就業及收入援助，會自動包括在內。",
        "网上或纸本申请租金援助。如你领取就业及收入援助，会自动包括在内。",
      ),
      actionUrl: "https://www.gov.mb.ca/fs/eia/rent_assist.html",
    },
  ],
  requiredDocuments: [
    tri("Proof of rent and income", "租金及收入證明", "租金及收入证明"),
  ],
  applicationUrl: "https://www.gov.mb.ca/fs/eia/rent_assist.html",
  officialInfoUrl: "https://www.gov.mb.ca/fs/eia/rent_assist.html",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["manitoba", "housing", "rent", "low-income"],
  relatedBenefits: ["manitoba-eia"],
  lastUpdated: "2026-09-01",
};

export const manitoba55Plus: Benefit = {
  id: "manitoba-55-plus",
  name: tri("55 PLUS (Manitoba Income Supplement)", "55 PLUS（緬尼托巴收入補助）", "55 PLUS（曼尼托巴收入补助）"),
  shortName: "55 PLUS",
  category: "seniors",
  level: "provincial-mb",
  description: tri(
    "A quarterly payment for lower-income Manitobans aged 55 and older whose income is within program limits.",
    "為 55 歲或以上、收入在計劃上限內的緬尼托巴低收入居民提供的季度款項。",
    "为 55 岁或以上、收入在计划上限内的曼尼托巴低收入居民提供的季度款项。",
  ),
  estimatedValue: tri(
    "Up to about $647/year for a single person (paid quarterly)",
    "單身人士最多約每年 $647（每季發放）",
    "单身人士最多约每年 $647（每季发放）",
  ),
  contextFields: ["province", "age", "annualIncome"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 55),
      hard: true,
      passReason: tri("You are 55 or older.", "你已年滿 55 歲。", "你已年满 55 岁。"),
      failReason: tri(
        "55 PLUS is for Manitobans aged 55 and older.",
        "55 PLUS 適用於 55 歲或以上的緬尼托巴居民。",
        "55 PLUS 适用于 55 岁或以上的曼尼托巴居民。",
      ),
      missingField: "age",
    },
    {
      test: atMost((c) => c.annualIncome, 20000),
      hard: true,
      passReason: tri(
        "Your income is within the program limit.",
        "你的收入在計劃上限之內。",
        "你的收入在计划上限之内。",
      ),
      failReason: tri(
        "55 PLUS is income-tested and aimed at lower-income residents.",
        "55 PLUS 按收入審查，面向較低收入居民。",
        "55 PLUS 按收入审查，面向较低收入居民。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 647, period: "year" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply once", "申請一次", "申请一次"),
      description: tri(
        "Submit the 55 PLUS application. Eligibility is based on last year's tax return.",
        "提交 55 PLUS 申請。資格按去年的報稅表釐定。",
        "提交 55 PLUS 申请。资格按去年的报税表厘定。",
      ),
      actionUrl: "https://www.gov.mb.ca/fs/eia/55plus.html",
    },
  ],
  requiredDocuments: [tri("Filed tax return", "已報稅表", "已报税表")],
  applicationUrl: "https://www.gov.mb.ca/fs/eia/55plus.html",
  officialInfoUrl: "https://www.gov.mb.ca/fs/eia/55plus.html",
  paymentFrequency: tri("Quarterly", "每季", "每季"),
  tags: ["manitoba", "seniors", "55+", "low-income"],
  relatedBenefits: ["gis", "oas"],
  lastUpdated: "2026-09-01",
};

export const manitobaEia: Benefit = {
  id: "manitoba-eia",
  name: tri(
    "Employment and Income Assistance (EIA)",
    "就業及收入援助 (EIA)",
    "就业及收入援助 (EIA)",
  ),
  shortName: "EIA",
  category: "income-support",
  level: "provincial-mb",
  description: tri(
    "Monthly financial help for Manitobans who cannot meet their basic needs, including a separate rate for people with a disability, plus health benefits.",
    "為無法滿足基本需要的緬尼托巴居民提供每月援助，包括殘障人士的獨立標準及健康福利。",
    "为无法满足基本需要的曼尼托巴居民提供每月援助，包括残障人士的独立标准及健康福利。",
  ),
  estimatedValue: tri(
    "Covers basic needs and shelter, plus health benefits",
    "涵蓋基本需要及住屋，並附健康福利",
    "涵盖基本需要及住房，并附健康福利",
  ),
  contextFields: ["province", "annualIncome"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
    {
      test: atMost((c) => c.annualIncome, 12000),
      hard: true,
      passReason: tri(
        "Your income is very low, which is the main test.",
        "你的收入極低，這是主要條件。",
        "你的收入极低，这是主要条件。",
      ),
      failReason: tri(
        "EIA is a last resort for people with very little income and assets.",
        "EIA 是為收入及資產極少人士而設的最後保障。",
        "EIA 是为收入及资产极少人士而设的最后保障。",
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
        "Apply online or by phone. Your income, assets, and household are assessed.",
        "網上或電話申請，會評估你的收入、資產及家庭。",
        "网上或电话申请，会评估你的收入、资产及家庭。",
      ),
      actionUrl: "https://www.gov.mb.ca/fs/eia/",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl: "https://www.gov.mb.ca/fs/eia/",
  officialInfoUrl: "https://www.gov.mb.ca/fs/eia/",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["manitoba", "low-income", "assistance", "disability"],
  relatedBenefits: ["manitoba-rent-assist"],
  lastUpdated: "2026-09-01",
};

export const manitobaPharmacare: Benefit = {
  id: "manitoba-pharmacare",
  name: tri("Manitoba Pharmacare", "緬尼托巴藥物保障", "曼尼托巴药物保障"),
  shortName: "Pharmacare",
  category: "health",
  level: "provincial-mb",
  description: tri(
    "A drug benefit for Manitobans based on income. After you reach an income-based deductible, Pharmacare pays for eligible prescription drugs.",
    "按收入計算的緬尼托巴藥物福利。達到按收入釐定的自付額後，藥物保障支付合資格處方藥。",
    "按收入计算的曼尼托巴药物福利。达到按收入厘定的自付额后，药物保障支付合资格处方药。",
  ),
  estimatedValue: tri(
    "Prescription drug coverage above an income-based deductible",
    "超過按收入計算的自付額後的處方藥保障",
    "超过按收入计算的自付额后的处方药保障",
  ),
  contextFields: ["province", "familyIncome"],
  check: buildCheck([
    { test: MB, hard: true, passReason: mbPass, failReason: mbFail, missingField: "province" },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Register each year", "每年登記", "每年登记"),
      description: tri(
        "Register for Manitoba Pharmacare online or on paper. Your deductible is set by your family income.",
        "網上或紙本登記緬尼托巴藥物保障。自付額按你的家庭收入釐定。",
        "网上或纸本登记曼尼托巴药物保障。自付额按你的家庭收入厘定。",
      ),
      actionUrl: "https://www.gov.mb.ca/health/pharmacare/",
    },
  ],
  requiredDocuments: [
    tri("Manitoba Health registration and income details", "緬尼托巴健康登記及收入資料", "曼尼托巴健康登记及收入资料"),
  ],
  applicationUrl: "https://www.gov.mb.ca/health/pharmacare/",
  officialInfoUrl: "https://www.gov.mb.ca/health/pharmacare/",
  paymentFrequency: tri("Ongoing coverage", "持續保障", "持续保障"),
  tags: ["manitoba", "health", "drugs", "prescriptions"],
  relatedBenefits: [],
  lastUpdated: "2026-09-01",
};

export const manitobaBenefits: Benefit[] = [
  manitobaChildBenefit,
  manitobaRentAssist,
  manitoba55Plus,
  manitobaEia,
  manitobaPharmacare,
];
