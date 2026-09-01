import type { AmountEstimate, Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { atLeast, atMost, buildCheck, isTrue, oneOf } from "@/lib/checks";

const ON = oneOf((c: { province?: string }) => c.province, ["ON"]);
const onFail = tri(
  "This program is for residents of Ontario.",
  "此計劃適用於安大略省居民。",
  "此计划适用于安大略省居民。",
);
const onPass = tri("You live in Ontario.", "你居住在安大略省。", "你居住在安大略省。");

const ocbEstimate = (ctx: {
  hasChildren?: boolean;
  numberOfChildren?: number;
  familyIncome?: number;
}): AmountEstimate | undefined => {
  if (ctx.hasChildren !== true) return undefined;
  const n = ctx.numberOfChildren ?? 1;
  const max = 1727 * n;
  const income = ctx.familyIncome;
  if (income === undefined) return { low: 0, high: max, period: "year" };
  const over = Math.max(0, income - 26865);
  const amount = Math.max(0, Math.round(max - over * 0.08 * n));
  return {
    low: amount,
    high: amount,
    period: "year",
    note: tri(
      "Rough estimate; paid together with the Canada Child Benefit.",
      "粗略估算；與加拿大兒童福利一併發放。",
      "粗略估算；与加拿大儿童福利一并发放。",
    ),
  };
};

export const ontarioTrillium: Benefit = {
  id: "ontario-trillium",
  name: tri("Ontario Trillium Benefit", "安大略延齡草福利", "安大略延龄草福利"),
  shortName: "OTB",
  category: "tax-credits",
  level: "provincial-on",
  description: tri(
    "A monthly payment that combines three Ontario credits — for energy costs, property tax or rent, and sales tax. You get it just by filing your taxes.",
    "結合三項安大略抵免（能源費用、物業稅或租金、銷售稅）的每月款項。只需報稅即可獲得。",
    "结合三项安大略抵免（能源费用、物业税或租金、销售税）的每月款项。只需报税即可获得。",
  ),
  estimatedValue: tri(
    "Up to about $1,400+/year, paid monthly (more for seniors)",
    "最多約每年 $1,400 以上，每月發放（長者更多）",
    "最多约每年 $1,400 以上，每月发放（长者更多）",
  ),
  contextFields: ["province", "filedTaxes", "familyIncome"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: isTrue((c) => c.filedTaxes),
      hard: true,
      passReason: tri(
        "You file taxes, which is how this credit is paid.",
        "你有報稅，這是發放此抵免的方式。",
        "你有报税，这是发放此抵免的方式。",
      ),
      failReason: tri(
        "You must file a tax return (and the ON-BEN form) to receive it.",
        "你須報稅（並填 ON-BEN 表格）才能領取。",
        "你须报税（并填 ON-BEN 表格）才能领取。",
      ),
      missingField: "filedTaxes",
    },
    {
      test: atMost((c) => c.familyIncome, 55000),
      hard: false,
      passReason: tri(
        "Your income is in the range that receives the credit.",
        "你的收入在可獲此抵免的範圍內。",
        "你的收入在可获此抵免的范围内。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 1421, period: "year" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("File taxes and the ON-BEN form", "報稅並填 ON-BEN 表格", "报税并填 ON-BEN 表格"),
      description: tri(
        "Complete the ON-BEN application with your tax return each year, reporting your rent or property tax and energy costs.",
        "每年隨報稅填寫 ON-BEN 申請，申報你的租金或物業稅及能源費用。",
        "每年随报税填写 ON-BEN 申请，申报你的租金或物业税及能源费用。",
      ),
      actionUrl: "https://www.ontario.ca/page/ontario-trillium-benefit",
    },
  ],
  requiredDocuments: [
    tri("Filed tax return with the ON-BEN form", "已報稅表及 ON-BEN 表格", "已报税表及 ON-BEN 表格"),
    tri("Rent or property tax amounts", "租金或物業稅金額", "租金或物业税金额"),
  ],
  officialInfoUrl: "https://www.ontario.ca/page/ontario-trillium-benefit",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "tax", "rent", "energy", "low-income"],
  relatedBenefits: ["cgeb"],
  lastUpdated: "2026-09-01",
};

export const ontarioWorks: Benefit = {
  id: "ontario-works",
  name: tri("Ontario Works", "安大略工作援助", "安大略工作援助"),
  shortName: "OW",
  category: "income-support",
  level: "provincial-on",
  description: tri(
    "Last-resort monthly financial help for people in Ontario in financial need, plus support to find work. Covers basic needs and shelter.",
    "為安大略有經濟需要人士提供的最後保障每月援助，並協助求職。涵蓋基本需要及住屋。",
    "为安大略有经济需要人士提供的最后保障每月援助，并帮助求职。涵盖基本需要及住房。",
  ),
  estimatedValue: tri(
    "Up to about $733/month for a single person, plus benefits",
    "單身人士最多約每月 $733，另加福利",
    "单身人士最多约每月 $733，另加福利",
  ),
  contextFields: ["province", "annualIncome"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: atMost((c) => c.annualIncome, 12000),
      hard: true,
      passReason: tri(
        "Your income is very low, which is the main test.",
        "你的收入極低，這是主要條件。",
        "你的收入极低，这是主要条件。",
      ),
      failReason: tri(
        "Ontario Works is a last resort for people with very little income and assets.",
        "安大略工作援助是為收入及資產極少人士而設的最後保障。",
        "安大略工作援助是为收入及资产极少人士而设的最后保障。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 733, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply online or by phone", "網上或電話申請", "网上或电话申请"),
      description: tri(
        "Start your application on the Ontario government website or by phone. You will answer questions about income, assets, and housing.",
        "在安大略政府網站或致電開始申請，需回答有關收入、資產及住屋的問題。",
        "在安大略政府网站或致电开始申请，需回答有关收入、资产及住房的问题。",
      ),
      actionUrl: "https://www.ontario.ca/page/apply-ontario-works",
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income, assets, and housing costs", "收入、資產及住屋費用證明", "收入、资产及住房费用证明"),
  ],
  applicationUrl: "https://www.ontario.ca/page/apply-ontario-works",
  officialInfoUrl: "https://www.ontario.ca/page/ontario-works",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "low-income", "assistance", "last-resort"],
  relatedBenefits: ["odsp", "ontario-trillium"],
  lastUpdated: "2026-09-01",
};

export const odsp: Benefit = {
  id: "odsp",
  name: tri(
    "Ontario Disability Support Program",
    "安大略殘障支援計劃",
    "安大略残障支援计划",
  ),
  shortName: "ODSP",
  category: "disability",
  level: "provincial-on",
  description: tri(
    "Monthly income and benefits for people in Ontario with a disability who are in financial need. It includes money for living costs, shelter, and drug and dental coverage.",
    "為安大略有經濟需要的殘障人士提供每月收入及福利，包括生活費、住屋，以及藥物和牙科保障。",
    "为安大略有经济需要的残障人士提供每月收入及福利，包括生活费、住房，以及药物和牙科保障。",
  ),
  estimatedValue: tri(
    "Up to about $1,408/month for a single person, plus drug and dental coverage",
    "單身人士最多約每月 $1,408，另加藥物及牙科保障",
    "单身人士最多约每月 $1,408，另加药物及牙科保障",
  ),
  contextFields: ["province", "age", "hasSevereDisability"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 18),
      hard: true,
      passReason: tri("You are 18 or older.", "你已年滿 18 歲。", "你已年满 18 岁。"),
      failReason: tri(
        "ODSP income support is for adults 18 and older.",
        "ODSP 收入支援適用於 18 歲或以上成人。",
        "ODSP 收入支援适用于 18 岁或以上成人。",
      ),
      missingField: "age",
    },
    {
      test: isTrue((c) => c.hasSevereDisability),
      hard: true,
      passReason: tri(
        "Your substantial, long-term disability may meet the ODSP test.",
        "你嚴重且長期的殘障或符合 ODSP 條件。",
        "你严重且长期的残障或符合 ODSP 条件。",
      ),
      failReason: tri(
        "ODSP requires a substantial physical or mental impairment that is expected to last a year or more.",
        "ODSP 要求嚴重且預期持續一年或以上的身體或精神障礙。",
        "ODSP 要求严重且预期持续一年或以上的身体或精神障碍。",
      ),
      missingField: "hasSevereDisability",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 1408, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply and confirm financial need", "申請並確認經濟需要", "申请并确认经济需要"),
      description: tri(
        "Start the ODSP application. First your financial eligibility is checked, then your disability.",
        "開始 ODSP 申請。先審核經濟資格，再審核殘障。",
        "开始 ODSP 申请。先审核经济资格，再审核残障。",
      ),
      actionUrl: "https://www.ontario.ca/page/ontario-disability-support-program",
    },
    {
      order: 2,
      title: tri("Complete the Disability Determination Package", "填寫殘障評定文件", "填写残障评定文件"),
      description: tri(
        "A health professional completes forms about your condition. Approval gives you income support and health benefits.",
        "由醫療專業人員填寫有關你狀況的表格。獲批後可得收入支援及健康福利。",
        "由医疗专业人员填写有关你状况的表格。获批后可得收入支援及健康福利。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Disability Determination Package (medical forms)", "殘障評定文件（醫療表格）", "残障评定文件（医疗表格）"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
  ],
  applicationUrl: "https://www.ontario.ca/page/ontario-disability-support-program",
  officialInfoUrl: "https://www.ontario.ca/page/ontario-disability-support-program",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "disability", "income", "assistance"],
  relatedBenefits: ["dtc", "cdb", "ontario-works"],
  lastUpdated: "2026-09-01",
};

export const ontarioChildBenefit: Benefit = {
  id: "ontario-child-benefit",
  name: tri("Ontario Child Benefit", "安大略兒童福利", "安大略儿童福利"),
  shortName: "OCB",
  category: "family",
  level: "provincial-on",
  description: tri(
    "A tax-free monthly payment for lower- and moderate-income families in Ontario with children under 18, paid together with the Canada Child Benefit.",
    "為安大略低至中等收入、有 18 歲以下子女家庭提供的免稅每月款項，與加拿大兒童福利一併發放。",
    "为安大略低至中等收入、有 18 岁以下子女家庭提供的免税每月款项，与加拿大儿童福利一并发放。",
  ),
  estimatedValue: tri(
    "Up to about $1,727/year per child",
    "每名子女最多約每年 $1,727",
    "每名子女最多约每年 $1,727",
  ),
  contextFields: ["province", "hasChildren", "numberOfChildren", "familyIncome"],
  prerequisites: ["ccb"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
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
  estimateAmount: (ctx) => ocbEstimate(ctx),
  applicationSteps: [
    {
      order: 1,
      title: tri("Get the Canada Child Benefit and file taxes", "領取加拿大兒童福利並報稅", "领取加拿大儿童福利并报税"),
      description: tri(
        "If you receive the Canada Child Benefit and file your taxes, you are assessed for the Ontario Child Benefit automatically.",
        "如你領取加拿大兒童福利並報稅，便會自動評估安大略兒童福利。",
        "如你领取加拿大儿童福利并报税，便会自动评估安大略儿童福利。",
      ),
      actionUrl: "https://www.ontario.ca/page/ontario-child-benefit",
    },
  ],
  requiredDocuments: [
    tri("Filed tax returns (both parents)", "已報稅表（父母雙方）", "已报税表（父母双方）"),
  ],
  officialInfoUrl: "https://www.ontario.ca/page/ontario-child-benefit",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "family", "children", "low-income"],
  relatedBenefits: ["ccb", "canada-learning-bond"],
  lastUpdated: "2026-09-01",
};

export const ontarioGains: Benefit = {
  id: "ontario-gains",
  name: tri(
    "Guaranteed Annual Income System (GAINS)",
    "保證年度收入制度 (GAINS)",
    "保证年度收入制度 (GAINS)",
  ),
  shortName: "GAINS",
  category: "seniors",
  level: "provincial-on",
  description: tri(
    "A monthly, non-taxable top-up for low-income Ontario seniors who receive the federal Guaranteed Income Supplement. For most people it is automatic.",
    "為領取聯邦保證收入補助金的安大略低收入長者提供的每月免稅補助。對大多數人而言是自動的。",
    "为领取联邦保证收入补助金的安大略低收入长者提供的每月免税补助。对大多数人而言是自动的。",
  ),
  estimatedValue: tri(
    "Up to about $92/month for a single senior",
    "單身長者最多約每月 $92",
    "单身长者最多约每月 $92",
  ),
  contextFields: ["province", "age", "annualIncome"],
  prerequisites: ["gis"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: atLeast((c) => c.age, 65),
      hard: true,
      passReason: tri("You are 65 or older.", "你已年滿 65 歲。", "你已年满 65 岁。"),
      failReason: tri(
        "GAINS is for seniors aged 65+ who receive the federal GIS.",
        "GAINS 適用於領取聯邦 GIS 的 65 歲以上長者。",
        "GAINS 适用于领取联邦 GIS 的 65 岁以上长者。",
      ),
      missingField: "age",
    },
    {
      test: atMost((c) => c.annualIncome, 22488),
      hard: true,
      passReason: tri(
        "Your income is low enough to receive GIS, which triggers GAINS.",
        "你的收入足夠低以領取 GIS，並會觸發 GAINS。",
        "你的收入足够低以领取 GIS，并会触发 GAINS。",
      ),
      failReason: tri(
        "You must receive the federal Guaranteed Income Supplement.",
        "你必須領取聯邦保證收入補助金。",
        "你必须领取联邦保证收入补助金。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 92, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("No application needed", "無需申請", "无需申请"),
      description: tri(
        "Once you receive the federal GIS and file your Ontario taxes, GAINS is added automatically.",
        "一旦領取聯邦 GIS 並在安大略報稅，GAINS 便會自動加入。",
        "一旦领取联邦 GIS 并在安大略报税，GAINS 便会自动加入。",
      ),
      actionUrl: "https://www.ontario.ca/page/guaranteed-annual-income-system-payments-seniors",
    },
  ],
  requiredDocuments: [],
  officialInfoUrl: "https://www.ontario.ca/page/guaranteed-annual-income-system-payments-seniors",
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["ontario", "seniors", "65+", "low-income", "automatic"],
  relatedBenefits: ["gis", "oas"],
  lastUpdated: "2026-09-01",
};

export const ontarioDrugBenefit: Benefit = {
  id: "ontario-drug-benefit",
  name: tri(
    "Ontario Prescription Drug Coverage",
    "安大略處方藥保障",
    "安大略处方药保障",
  ),
  shortName: "ODB / Trillium",
  category: "health",
  level: "provincial-on",
  description: tri(
    "Ontario helps pay for prescription drugs. Seniors 65+ are covered automatically (Ontario Drug Benefit); younger residents with high drug costs and no insurance can use the Trillium Drug Program.",
    "安大略協助支付處方藥。65 歲以上長者自動獲保障（安大略藥物福利）；藥費高且無保險的較年輕居民可使用延齡草藥物計劃。",
    "安大略帮助支付处方药。65 岁以上长者自动获保障（安大略药物福利）；药费高且无保险的较年轻居民可使用延龄草药物计划。",
  ),
  estimatedValue: tri(
    "Most prescription drug costs, with a small co-payment",
    "大部分處方藥費用，只需小額共付",
    "大部分处方药费用，只需小额共付",
  ),
  contextFields: ["province"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("At 65, coverage is automatic", "65 歲時自動獲保障", "65 岁时自动获保障"),
      description: tri(
        "If you are 65+, the Ontario Drug Benefit starts automatically. Low-income seniors can apply to the Seniors Co-Payment Program to lower costs further.",
        "如你 65 歲以上，安大略藥物福利自動生效。低收入長者可申請長者共付計劃以進一步降低費用。",
        "如你 65 岁以上，安大略药物福利自动生效。低收入长者可申请长者共付计划以进一步降低费用。",
      ),
      actionUrl: "https://www.ontario.ca/page/get-coverage-prescription-drugs",
    },
    {
      order: 2,
      title: tri("Under 65: apply to Trillium Drug Program", "65 歲以下：申請延齡草藥物計劃", "65 岁以下：申请延龄草药物计划"),
      description: tri(
        "If you have high drug costs relative to your income and no private plan, register for the Trillium Drug Program.",
        "如你藥費相對收入偏高且無私人計劃，可登記延齡草藥物計劃。",
        "如你药费相对收入偏高且无私人计划，可登记延龄草药物计划。",
      ),
      actionUrl: "https://www.ontario.ca/page/get-help-high-prescription-drug-costs",
    },
  ],
  requiredDocuments: [
    tri("Ontario health card (OHIP)", "安大略健康卡 (OHIP)", "安大略健康卡 (OHIP)"),
  ],
  officialInfoUrl: "https://www.ontario.ca/page/get-coverage-prescription-drugs",
  paymentFrequency: tri("Ongoing coverage", "持續保障", "持续保障"),
  tags: ["ontario", "health", "drugs", "prescriptions", "seniors"],
  relatedBenefits: ["cdcp"],
  lastUpdated: "2026-09-01",
};

export const ontarioSeniorHomeownerGrant: Benefit = {
  id: "ontario-senior-homeowner-grant",
  name: tri(
    "Ontario Senior Homeowners' Property Tax Grant",
    "安大略長者業主物業稅津貼",
    "安大略长者业主物业税津贴",
  ),
  shortName: "OSHPTG",
  category: "housing",
  level: "provincial-on",
  description: tri(
    "A yearly grant that helps low- to moderate-income senior homeowners in Ontario with their property taxes.",
    "協助安大略低至中等收入長者業主支付物業稅的年度津貼。",
    "帮助安大略低至中等收入长者业主支付物业税的年度津贴。",
  ),
  estimatedValue: tri(
    "Up to $500 per year",
    "每年最多 $500",
    "每年最多 $500",
  ),
  contextFields: ["province", "isHomeowner", "age", "annualIncome"],
  check: buildCheck([
    { test: ON, hard: true, passReason: onPass, failReason: onFail, missingField: "province" },
    {
      test: isTrue((c) => c.isHomeowner),
      hard: true,
      passReason: tri("You own and live in your home.", "你擁有並居住於自己的住所。", "你拥有并居住于自己的住所。"),
      failReason: tri(
        "This grant is for senior homeowners who own their principal residence.",
        "此津貼適用於擁有主要住所的長者業主。",
        "此津贴适用于拥有主要住所的长者业主。",
      ),
      missingField: "isHomeowner",
    },
    {
      test: atLeast((c) => c.age, 64),
      hard: true,
      passReason: tri("You are 64 or older.", "你已年滿 64 歲。", "你已年满 64 岁。"),
      failReason: tri(
        "You must be 64 or older by the end of the year.",
        "你須在年底時年滿 64 歲。",
        "你须在年底时年满 64 岁。",
      ),
      missingField: "age",
    },
    {
      test: atMost((c) => c.annualIncome, 50000),
      hard: false,
      passReason: tri(
        "Your income is within the range for the grant.",
        "你的收入在津貼範圍內。",
        "你的收入在津贴范围内。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 500, period: "year" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Claim it on your tax return", "於報稅表申索", "于报税表申索"),
      description: tri(
        "Apply on your income tax return (Form ON-BEN) for the year, reporting the property tax you paid.",
        "於當年的報稅表（ON-BEN 表格）申請，申報你已繳的物業稅。",
        "于当年的报税表（ON-BEN 表格）申请，申报你已缴的物业税。",
      ),
      actionUrl: "https://www.ontario.ca/page/ontario-senior-homeowners-property-tax-grant",
    },
  ],
  requiredDocuments: [
    tri("Property tax paid", "已繳物業稅", "已缴物业税"),
    tri("Filed tax return (ON-BEN)", "已報稅表 (ON-BEN)", "已报税表 (ON-BEN)"),
  ],
  officialInfoUrl: "https://www.ontario.ca/page/ontario-senior-homeowners-property-tax-grant",
  paymentFrequency: tri("Yearly", "每年", "每年"),
  tags: ["ontario", "seniors", "homeowner", "property-tax"],
  relatedBenefits: ["ontario-trillium"],
  lastUpdated: "2026-09-01",
};

export const ontarioBenefits: Benefit[] = [
  ontarioTrillium,
  ontarioWorks,
  odsp,
  ontarioChildBenefit,
  ontarioGains,
  ontarioDrugBenefit,
  ontarioSeniorHomeownerGrant,
];
