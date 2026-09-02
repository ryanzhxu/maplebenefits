import type { Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { atMost, buildCheck, inRange, isTrue, oneOf } from "@/lib/checks";

export const canadaLearningBond: Benefit = {
  id: "canada-learning-bond",
  name: tri("Canada Learning Bond", "加拿大學習債券", "加拿大学习债券"),
  shortName: "CLB",
  category: "education",
  level: "federal",
  description: tri(
    "Free money the government puts into a child's education savings plan (RESP) for lower-income families. You do not have to contribute anything yourself.",
    "政府為低收入家庭子女的教育儲蓄計劃 (RESP) 存入的免費款項。你無需自行供款。",
    "政府为低收入家庭子女的教育储蓄计划 (RESP) 存入的免费款项。你无需自行供款。",
  ),
  estimatedValue: tri(
    "Up to $2,000 per child ($500 first year, $100/year after), no contribution needed",
    "每名子女最多 $2,000（首年 $500，其後每年 $100），無需供款",
    "每名子女最多 $2,000（首年 $500，其后每年 $100），无需供款",
  ),
  contextFields: ["hasChildren", "familyIncome"],
  check: buildCheck([
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: tri(
        "You have a child the bond can be set up for.",
        "你有可設立債券的子女。",
        "你有可设立债券的子女。",
      ),
      failReason: tri(
        "The Canada Learning Bond is for a child born in 2004 or later in a lower-income family.",
        "加拿大學習債券適用於 2004 年或之後出生、來自低收入家庭的子女。",
        "加拿大学习债券适用于 2004 年或之后出生、来自低收入家庭的子女。",
      ),
      missingField: "hasChildren",
    },
    {
      test: atMost((c) => c.familyIncome, 57375),
      hard: true,
      passReason: tri(
        "Your family income is within the range for the bond.",
        "你的家庭收入在債券的範圍內。",
        "你的家庭收入在债券的范围内。",
      ),
      failReason: tri(
        "Income must be roughly under $57,000 (higher for larger families).",
        "收入須大約低於 $57,000（家庭人數較多則較高）。",
        "收入须大约低于 $57,000（家庭人数较多则较高）。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 2000, period: "one-time" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Open a free RESP", "開立免費 RESP", "开立免费 RESP"),
      description: tri(
        "Open a Registered Education Savings Plan for your child at a bank or a no-fee provider. Bring your and your child's Social Insurance Numbers.",
        "在銀行或免費機構為子女開立註冊教育儲蓄計劃，帶備你及子女的社會保險號碼。",
        "在银行或免费机构为子女开立注册教育储蓄计划，带备你及子女的社会保险号码。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-education-savings-plans-resps/canada-education-savings-programs-cesp/canada-learning-bond.html",
    },
    {
      order: 2,
      title: tri("Ask for the Canada Learning Bond", "申請加拿大學習債券", "申请加拿大学习债券"),
      description: tri(
        "Ask the provider to apply for the bond. The government deposits it directly — you never need to add your own money.",
        "請機構申請債券。政府會直接存入 — 你無需投入自己的資金。",
        "请机构申请债券。政府会直接存入 — 你无需投入自己的资金。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Your and your child's Social Insurance Numbers", "你及子女的社會保險號碼", "你及子女的社会保险号码"),
    tri("Filed tax returns", "已報的所得稅表", "已报的所得税表"),
  ],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-education-savings-plans-resps/canada-education-savings-programs-cesp/canada-learning-bond.html",
  paymentFrequency: tri("Deposited into the RESP", "存入 RESP", "存入 RESP"),
  tags: ["education", "children", "savings", "low-income", "resp"],
  relatedBenefits: ["ccb"],
  lastUpdated: "2026-09-01",
};

export const canadaTrainingCredit: Benefit = {
  id: "canada-training-credit",
  name: tri("Canada Training Credit", "加拿大培訓抵免", "加拿大培训抵免"),
  shortName: "CTC",
  category: "education",
  level: "federal",
  description: tri(
    "A refundable credit that helps cover tuition and training fees. Working people aged 26 to 65 build up $250 of room each year to use later.",
    "協助支付學費及培訓費的可退還抵免。26 至 65 歲在職人士每年累積 $250 額度供日後使用。",
    "帮助支付学费及培训费的可退还抵免。26 至 65 岁在职人士每年累积 $250 额度供日后使用。",
  ),
  estimatedValue: tri(
    "Covers up to half of eligible tuition, using $250/year of accumulated room",
    "以每年累積的 $250 額度，可支付合資格學費最多一半",
    "以每年累积的 $250 额度，可支付合资格学费最多一半",
  ),
  contextFields: ["age", "employmentStatus", "postSecondaryStudent"],
  check: buildCheck([
    {
      test: inRange((c) => c.age, 26, 65),
      hard: true,
      passReason: tri(
        "You are of working age (26 to 65) and build training credit room.",
        "你屬工作年齡（26 至 65 歲），可累積培訓抵免額度。",
        "你属工作年龄（26 至 65 岁），可累积培训抵免额度。",
      ),
      failReason: tri(
        "You accumulate this credit between ages 26 and 65 while working.",
        "你在 26 至 65 歲期間工作時累積此抵免。",
        "你在 26 至 65 岁期间工作时累积此抵免。",
      ),
      missingField: "age",
    },
    {
      test: oneOf((c) => c.employmentStatus, ["employed", "self-employed", "unemployed"]),
      hard: false,
      passReason: tri(
        "You have (or recently had) working income that builds the credit.",
        "你有（或近期有）可累積抵免的工作收入。",
        "你有（或近期有）可累积抵免的工作收入。",
      ),
      missingField: "employmentStatus",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 250, period: "year" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Check your training credit room", "查看你的培訓抵免額度", "查看你的培训抵免额度"),
      description: tri(
        "Your available room is shown on your CRA My Account and on your notice of assessment.",
        "你的可用額度顯示於 CRA My Account 及評稅通知書上。",
        "你的可用额度显示于 CRA My Account 及评税通知书上。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45350-canada-training-credit.html",
    },
    {
      order: 2,
      title: tri("Claim it after paying tuition", "支付學費後申索", "支付学费后申索"),
      description: tri(
        "When you pay eligible tuition or training fees, claim the credit on your tax return.",
        "當你支付合資格學費或培訓費時，於報稅表申索。",
        "当你支付合资格学费或培训费时，于报税表申索。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Tuition receipts (T2202)", "學費收據 (T2202)", "学费收据 (T2202)"),
  ],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45350-canada-training-credit.html",
  paymentFrequency: tri("Refundable tax credit", "可退還稅務抵免", "可退还税务抵免"),
  tags: ["education", "training", "working", "tuition", "tax"],
  relatedBenefits: ["bc-access-grant"],
  lastUpdated: "2026-09-01",
};

export const federalEducationBenefits: Benefit[] = [
  canadaLearningBond,
  canadaTrainingCredit,
];
