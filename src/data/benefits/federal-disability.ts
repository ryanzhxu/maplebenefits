import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, atMost, buildCheck, inRange, isTrue } from "@/lib/checks";

const cdbEstimate = (ctx: {
  familyIncome?: number;
  annualIncome?: number;
  maritalStatus?: string;
}): AmountEstimate | undefined => {
  const max = 2450; // $204.20/mo, July 2026
  const couple =
    ctx.maritalStatus === "married" || ctx.maritalStatus === "common-law";
  const income = couple
    ? ctx.familyIncome ?? ctx.annualIncome
    : ctx.annualIncome ?? ctx.familyIncome;
  if (income === undefined) {
    return { low: 0, high: max, period: "year" };
  }
  const threshold = couple ? 32500 : 23000;
  const reduction = Math.max(0, income - threshold) * 0.2;
  const amount = Math.max(0, Math.round(max - reduction));
  return {
    low: amount,
    high: amount,
    period: "year",
    note: tri(
      "Estimate. The exact amount depends on your income tax return.",
      "此為估算。實際金額視乎你的報稅資料。",
      "此为估算。实际金额视乎你的报税资料。",
    ),
  };
};

export const dtc: Benefit = {
  id: "dtc",
  name: tri("Disability Tax Credit", "殘疾稅務抵免", "残疾税务抵免"),
  shortName: "DTC",
  category: "disability",
  level: "federal",
  description: tri(
    "A tax credit that lowers the income tax a person with a severe, long-term disability (or their supporting family member) has to pay. It is also the key that unlocks several other benefits.",
    "為嚴重長期殘障人士（或供養他們的家人）減少應繳所得稅的稅務抵免。它也是解鎖多項其他福利的關鍵。",
    "为严重长期残障人士（或供养他们的家人）减少应缴所得税的税务抵免。它也是解锁多项其他福利的关键。",
  ),
  estimatedValue: tri(
    "About $1,900/year in combined federal + BC tax savings (more with the child supplement)",
    "聯邦加卑詩省合計約每年 $1,900 稅務減免（有子女補助則更多）",
    "联邦加不列颠哥伦比亚省合计约每年 $1,900 税务减免（有子女补助则更多）",
  ),
  contextFields: ["hasDisability", "hasSevereDisability", "filedTaxes"],
  check: buildCheck([
    {
      test: isTrue((c) => c.hasSevereDisability),
      hard: true,
      passReason: tri(
        "A doctor may be able to certify that your condition markedly restricts daily living.",
        "醫生或可證明你的狀況明顯限制日常生活。",
        "医生或可证明你的状况明显限制日常生活。",
      ),
      failReason: tri(
        "The DTC is for people whose condition markedly restricts daily activities most of the time.",
        "殘疾稅務抵免適用於狀況大部分時間明顯限制日常活動的人士。",
        "残疾税务抵免适用于状况大部分时间明显限制日常活动的人士。",
      ),
      missingField: "hasSevereDisability",
    },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: false,
      passReason: tri(
        "You file taxes, so the credit can be applied.",
        "你有報稅，因此可以使用此抵免。",
        "你有报税，因此可以使用此抵免。",
      ),
      missingField: "filedTaxes",
    },
  ]),
  estimateAmount: () => ({ low: 1900, high: 1900, period: "year" }),
  applicationSteps: [
    {
      order: 1,
      title: tri(
        "Fill out Form T2201 with your doctor",
        "與醫生一起填寫 T2201 表格",
        "与医生一起填写 T2201 表格",
      ),
      description: tri(
        "Complete the applicant part of Form T2201 (Disability Tax Credit Certificate). A medical practitioner completes the medical part. You can do this online through CRA My Account or on paper.",
        "填寫 T2201 表格（殘疾稅務抵免證明）的申請人部分，由醫療人員填寫醫療部分。可透過 CRA My Account 網上辦理或使用紙本。",
        "填写 T2201 表格（残疾税务抵免证明）的申请人部分，由医疗人员填写医疗部分。可通过 CRA My Account 网上办理或使用纸本。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/disability-tax-credit/how-apply-dtc.html",
      estimatedTime: tri(
        "Requires a doctor visit",
        "需要看醫生",
        "需要看医生",
      ),
    },
    {
      order: 2,
      title: tri("Submit to the CRA", "提交給 CRA", "提交给 CRA"),
      description: tri(
        "Send the completed form to the Canada Revenue Agency online or by mail. The CRA reviews it and tells you if you are approved.",
        "將填妥的表格網上或郵寄提交給加拿大稅務局。稅務局會審核並通知你是否獲批。",
        "将填妥的表格网上或邮寄提交给加拿大税务局。税务局会审核并通知你是否获批。",
      ),
    },
    {
      order: 3,
      title: tri(
        "Ask for adjustments to past years",
        "要求調整過往年度",
        "要求调整过往年度",
      ),
      description: tri(
        "If approved, you can ask the CRA to reassess up to 10 previous years, which may produce a refund.",
        "如獲批，可要求稅務局重新評估最多過往 10 年，或可獲退稅。",
        "如获批，可要求税务局重新评估最多过往 10 年，或可获退税。",
      ),
      tips: [
        tri(
          "The DTC unlocks the Canada Disability Benefit, RDSP, and the Child Disability Benefit — apply for it first.",
          "殘疾稅務抵免可解鎖加拿大殘障福利、RDSP 及兒童殘障福利 — 請先申請。",
          "残疾税务抵免可解锁加拿大残障福利、RDSP 及儿童残障福利 — 请先申请。",
        ),
      ],
    },
  ],
  requiredDocuments: [
    tri(
      "Form T2201, completed by you and a medical practitioner",
      "由你和醫療人員填寫的 T2201 表格",
      "由你和医疗人员填写的 T2201 表格",
    ),
  ],
  applicationUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/disability-tax-credit/how-apply-dtc.html",
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/disability-tax-credit.html",
  processingTime: tri("Usually 8 weeks", "通常 8 星期", "通常 8 星期"),
  paymentFrequency: tri(
    "Annual tax credit",
    "每年稅務抵免",
    "每年税务抵免",
  ),
  tags: ["disability", "tax", "vision", "hearing", "walking", "mental", "gateway"],
  relatedBenefits: ["cdb", "rdsp", "ccb", "cpp-d", "bc-bus-pass"],
  lastUpdated: "2026-09-01",
};

export const cdb: Benefit = {
  id: "cdb",
  name: tri("Canada Disability Benefit", "加拿大殘障福利", "加拿大残障福利"),
  shortName: "CDB",
  category: "disability",
  level: "federal",
  description: tri(
    "A monthly payment for working-age adults with disabilities who have low incomes. You must be approved for the Disability Tax Credit first.",
    "為低收入的在職年齡殘障成人提供的每月款項。你必須先獲批殘疾稅務抵免。",
    "为低收入的在职年龄残障成人提供的每月款项。你必须先获批残疾税务抵免。",
  ),
  estimatedValue: tri(
    "Up to $204.20/month (about $2,450/year)",
    "最多每月 $204.20（約每年 $2,450）",
    "最多每月 $204.20（约每年 $2,450）",
  ),
  contextFields: ["age", "hasDTC", "familyIncome", "annualIncome", "maritalStatus", "filedTaxes"],
  prerequisites: ["dtc"],
  check: buildCheck([
    {
      test: inRange((c) => c.age, 18, 64),
      hard: true,
      passReason: tri(
        "You are within the eligible age range (18 to 64).",
        "你在合資格年齡範圍內（18 至 64 歲）。",
        "你在合资格年龄范围内（18 至 64 岁）。",
      ),
      failReason: tri(
        "The Canada Disability Benefit is for adults aged 18 to 64.",
        "加拿大殘障福利適用於 18 至 64 歲的成人。",
        "加拿大残障福利适用于 18 至 64 岁的成人。",
      ),
      missingField: "age",
    },
    {
      test: isTrue((c) => c.hasDTC),
      hard: true,
      passReason: tri(
        "You are approved for the Disability Tax Credit.",
        "你已獲批殘疾稅務抵免。",
        "你已获批残疾税务抵免。",
      ),
      failReason: tri(
        "You must be approved for the Disability Tax Credit (DTC) first. Apply for the DTC, then the CDB.",
        "你必須先獲批殘疾稅務抵免 (DTC)，然後才可申請 CDB。",
        "你必须先获批残疾税务抵免 (DTC)，然后才可申请 CDB。",
      ),
      missingField: "hasDTC",
    },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: false,
      passReason: tri(
        "You filed taxes, which is required each year.",
        "你有報稅，這是每年必須的。",
        "你有报税，这是每年必须的。",
      ),
      missingField: "filedTaxes",
    },
  ]),
  estimateAmount: (ctx) => cdbEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri(
        "Make sure you have the DTC",
        "確保你已有殘疾稅務抵免",
        "确保你已有残疾税务抵免",
      ),
      description: tri(
        "The Canada Disability Benefit requires an approved Disability Tax Credit. If you do not have it yet, apply for the DTC first.",
        "加拿大殘障福利需要已獲批的殘疾稅務抵免。如尚未取得，請先申請 DTC。",
        "加拿大残障福利需要已获批的残疾税务抵免。如尚未取得，请先申请 DTC。",
      ),
    },
    {
      order: 2,
      title: tri("File your tax return", "報稅", "报税"),
      description: tri(
        "You and your spouse or partner (if you have one) must file a tax return each year so your income can be checked.",
        "你和你的配偶或伴侶（如有）每年必須報稅，以便核對收入。",
        "你和你的配偶或伴侣（如有）每年必须报税，以便核对收入。",
      ),
    },
    {
      order: 3,
      title: tri("Apply for the CDB", "申請 CDB", "申请 CDB"),
      description: tri(
        "Apply online, by phone, by mail, or in person through Service Canada.",
        "可透過 Service Canada 網上、電話、郵寄或親身申請。",
        "可通过 Service Canada 网上、电话、邮寄或亲身申请。",
      ),
      actionUrl:
        "https://www.canada.ca/en/services/benefits/disability/canada-disability-benefit.html",
    },
  ],
  requiredDocuments: [
    tri("Approved Disability Tax Credit", "已獲批的殘疾稅務抵免", "已获批的残疾税务抵免"),
    tri("Filed income tax return", "已報的所得稅表", "已报的所得税表"),
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/services/benefits/disability/canada-disability-benefit.html",
  officialInfoUrl:
    "https://www.canada.ca/en/services/benefits/disability/canada-disability-benefit.html",
  processingTime: tri("Varies", "視情況而定", "视情况而定"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["disability", "income", "low-income", "working-age"],
  relatedBenefits: ["dtc", "rdsp", "cpp-d", "pwd"],
  lastUpdated: "2026-09-01",
};

// CPP disability -- 2026 amounts from Service Canada's own benefit-amount page.
// Source (fetched 2026-09-02):
// https://www.canada.ca/en/services/benefits/publicpensions/cpp-disability-benefit/benefit-amount.html
// The app previously showed the 2025 figures ($583 basic, $1,673 maximum,
// $1,192 average) while the page had moved on to 2026.
const CPP_D_AMOUNTS_URL =
  "https://www.canada.ca/en/services/benefits/publicpensions/cpp-disability-benefit/benefit-amount.html";

const CPP_D = figures({
  basicMonthly: {
    current: {
      value: 610.46,
      from: "2026-01-01",
      source: CPP_D_AMOUNTS_URL,
      quote: "Basic monthly amount (2026): $610.46",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Basic monthly amount",
  },
  maxMonthly: {
    current: {
      value: 1741.2,
      from: "2026-01-01",
      source: CPP_D_AMOUNTS_URL,
      quote: "Maximum monthly payment amount (2026) $1,741.20",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Maximum monthly payment",
  },
  averageMonthly: {
    current: {
      value: 1234.68,
      from: "2025-10-01",
      source: CPP_D_AMOUNTS_URL,
      quote: "Average monthly amount for new beneficiaries (as of October 2025) $1,234.68",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency-cents",
    label: "Average monthly amount for new beneficiaries",
  },
});

export const cppDisability: Benefit = {
  id: "cpp-d",
  name: tri(
    "CPP Disability Benefit",
    "CPP 傷殘福利",
    "CPP 伤残福利",
  ),
  shortName: "CPP-D",
  category: "disability",
  level: "federal",
  description: tri(
    "A monthly payment for people under 65 who cannot work regularly because of a severe and prolonged disability, and who have paid enough into the Canada Pension Plan.",
    "為 65 歲以下、因嚴重且長期殘障而無法定期工作、並曾足額繳付加拿大退休金計劃的人士提供的每月款項。",
    "为 65 岁以下、因严重且长期残障而无法定期工作、并曾足额缴付加拿大退休金计划的人士提供的每月款项。",
  ),
  estimatedValue: tri(
    `${fmt(CPP_D.basicMonthly)} to ${fmt(CPP_D.maxMonthly)}/month (2026); average about ${fmt(CPP_D.averageMonthly)}/month`,
    `每月 ${fmt(CPP_D.basicMonthly)} 至 ${fmt(CPP_D.maxMonthly)}（2026）；平均約 ${fmt(CPP_D.averageMonthly)}`,
    `每月 ${fmt(CPP_D.basicMonthly)} 至 ${fmt(CPP_D.maxMonthly)}（2026）；平均约 ${fmt(CPP_D.averageMonthly)}`,
  ),
  figures: CPP_D,
  contextFields: ["age", "hasSevereDisability", "hasRecentCppContributions"],
  check: buildCheck([
    {
      test: inRange((c) => c.age, 18, 64),
      hard: true,
      passReason: tri(
        "You are under 65.",
        "你未滿 65 歲。",
        "你未满 65 岁。",
      ),
      failReason: tri(
        "CPP disability is for people under 65. At 65 it becomes the CPP retirement pension.",
        "CPP 傷殘福利適用於 65 歲以下人士。65 歲後會轉為 CPP 退休金。",
        "CPP 伤残福利适用于 65 岁以下人士。65 岁后会转为 CPP 退休金。",
      ),
      missingField: "age",
    },
    {
      test: isTrue((c) => c.hasSevereDisability),
      hard: true,
      passReason: tri(
        "Your disability is severe and prolonged, which is the main test.",
        "你的殘障屬嚴重且長期，這是主要條件。",
        "你的残障属严重且长期，这是主要条件。",
      ),
      failReason: tri(
        "This benefit requires a severe and prolonged disability that regularly stops you from working.",
        "此福利要求嚴重且長期的殘障，並經常令你無法工作。",
        "此福利要求严重且长期的残障，并经常令你无法工作。",
      ),
      missingField: "hasSevereDisability",
    },
    {
      test: isTrue((c) => c.hasRecentCppContributions),
      hard: true,
      passReason: tri(
        "You have recent CPP contributions.",
        "你近年有繳付 CPP。",
        "你近年有缴付 CPP。",
      ),
      failReason: tri(
        "You need enough recent CPP contributions (usually 4 of the last 6 years).",
        "你需要足夠的近年 CPP 供款（通常為過去 6 年中的 4 年）。",
        "你需要足够的近年 CPP 供款（通常为过去 6 年中的 4 年）。",
      ),
      missingField: "hasRecentCppContributions",
    },
  ]),
  estimateAmount: () => ({
    low: val(CPP_D.basicMonthly),
    high: val(CPP_D.maxMonthly),
    period: "month",
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri(
        "Gather your medical information",
        "準備你的醫療資料",
        "准备你的医疗资料",
      ),
      description: tri(
        "Your doctor completes a medical report describing your condition and how it affects your ability to work.",
        "由醫生填寫醫療報告，說明你的狀況及其對工作能力的影響。",
        "由医生填写医疗报告，说明你的状况及其对工作能力的影响。",
      ),
      estimatedTime: tri("Requires a doctor visit", "需要看醫生", "需要看医生"),
    },
    {
      order: 2,
      title: tri("Apply to Service Canada", "向 Service Canada 申請", "向 Service Canada 申请"),
      description: tri(
        "Apply online through My Service Canada Account or on paper. Include the medical report.",
        "透過 My Service Canada Account 網上或紙本申請，附上醫療報告。",
        "通过 My Service Canada Account 网上或纸本申请，附上医疗报告。",
      ),
      actionUrl:
        "https://www.canada.ca/en/services/benefits/publicpensions/cpp-disability-benefit/apply.html",
    },
  ],
  requiredDocuments: [
    tri("Medical report from your doctor", "醫生的醫療報告", "医生的医疗报告"),
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/cpp-disability-benefit/apply.html",
  officialInfoUrl:
    "https://www.canada.ca/en/services/benefits/publicpensions/cpp-disability-benefit.html",
  processingTime: tri("Usually 4 months", "通常 4 個月", "通常 4 个月"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["disability", "cpp", "unable-to-work", "income"],
  relatedBenefits: ["dtc", "cdb", "pwd"],
  lastUpdated: "2026-09-01",
};

export const rdsp: Benefit = {
  id: "rdsp",
  name: tri(
    "Registered Disability Savings Plan",
    "註冊殘障儲蓄計劃",
    "注册残障储蓄计划",
  ),
  shortName: "RDSP",
  category: "disability",
  level: "federal",
  description: tri(
    "A savings plan for people approved for the Disability Tax Credit. The government adds grants and, for low incomes, bonds — free money even if you cannot contribute yourself.",
    "為已獲批殘疾稅務抵免人士而設的儲蓄計劃。政府會加入補助金，低收入者更可獲債券 — 即使你無法自行供款也有免費款項。",
    "为已获批残疾税务抵免人士而设的储蓄计划。政府会加入补助金，低收入者更可获债券 — 即使你无法自行供款也有免费款项。",
  ),
  estimatedValue: tri(
    "Grants up to $3,500/year and bonds up to $1,000/year from the government",
    "政府補助金最多每年 $3,500，債券最多每年 $1,000",
    "政府补助金最多每年 $3,500，债券最多每年 $1,000",
  ),
  contextFields: ["hasDTC", "age", "familyIncome"],
  prerequisites: ["dtc"],
  check: buildCheck([
    {
      test: isTrue((c) => c.hasDTC),
      hard: true,
      passReason: tri(
        "You are approved for the Disability Tax Credit.",
        "你已獲批殘疾稅務抵免。",
        "你已获批残疾税务抵免。",
      ),
      failReason: tri(
        "You must be approved for the Disability Tax Credit (DTC) first.",
        "你必須先獲批殘疾稅務抵免 (DTC)。",
        "你必须先获批残疾税务抵免 (DTC)。",
      ),
      missingField: "hasDTC",
    },
    {
      test: atMost((c) => c.age, 59),
      hard: true,
      passReason: tri(
        "You can open a plan before age 60.",
        "你可在 60 歲前開立計劃。",
        "你可在 60 岁前开立计划。",
      ),
      failReason: tri(
        "A plan must be opened before the end of the year you turn 59.",
        "計劃必須在你 59 歲當年年底前開立。",
        "计划必须在你 59 岁当年年底前开立。",
      ),
      missingField: "age",
    },
  ]),
  estimateAmount: (ctx) => {
    const income = ctx.familyIncome;
    if (income !== undefined && income <= 37487) {
      return {
        low: 1000,
        high: 4500,
        period: "year",
        note: tri(
          "At your income, the $1,000 bond needs no contribution from you.",
          "以你的收入，$1,000 債券無需你自行供款。",
          "以你的收入，$1,000 债券无需你自行供款。",
        ),
      };
    }
    return { low: 0, high: 4500, period: "year" };
  },
  applicationSteps: [
    {
      order: 1,
      title: tri(
        "Open an RDSP at a bank or credit union",
        "在銀行或信用合作社開立 RDSP",
        "在银行或信用合作社开立 RDSP",
      ),
      description: tri(
        "Contact a financial institution that offers RDSPs. You need an approved DTC and a Social Insurance Number.",
        "聯絡提供 RDSP 的金融機構。你需要已獲批的 DTC 及社會保險號碼。",
        "联系提供 RDSP 的金融机构。你需要已获批的 DTC 及社会保险号码。",
      ),
      actionUrl:
        "https://www.canada.ca/en/employment-social-development/programs/disability/savings.html",
    },
    {
      order: 2,
      title: tri(
        "Apply for the grant and bond",
        "申請補助金及債券",
        "申请补助金及债券",
      ),
      description: tri(
        "Your financial institution helps you apply. The bond does not require you to contribute; the grant matches your contributions.",
        "金融機構會協助你申請。債券無需供款；補助金則按你的供款配對。",
        "金融机构会协助你申请。债券无需供款；补助金则按你的供款配对。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Approved Disability Tax Credit", "已獲批的殘疾稅務抵免", "已获批的残疾税务抵免"),
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/employment-social-development/programs/disability/savings.html",
  officialInfoUrl:
    "https://www.canada.ca/en/employment-social-development/programs/disability/savings.html",
  processingTime: tri("Set up in one visit", "一次辦理即可", "一次办理即可"),
  paymentFrequency: tri(
    "Grants and bonds paid into the plan",
    "補助金及債券存入計劃",
    "补助金及债券存入计划",
  ),
  tags: ["disability", "savings", "grant", "low-income"],
  relatedBenefits: ["dtc", "cdb"],
  lastUpdated: "2026-09-01",
};

export const federalDisabilityBenefits: Benefit[] = [dtc, cdb, cppDisability, rdsp];
