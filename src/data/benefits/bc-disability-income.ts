import type { AssessmentContext, Benefit, CheckResult } from "@/types/benefit";
import { tri } from "@/data/tri";
import { atLeast, atMost, buildCheck, isTrue, oneOf } from "@/lib/checks";

export const pwd: Benefit = {
  id: "pwd",
  name: tri(
    "BC Disability Assistance (PWD)",
    "卑詩省殘障援助 (PWD)",
    "不列颠哥伦比亚省残障援助 (PWD)",
  ),
  shortName: "PWD",
  category: "disability",
  level: "provincial-bc",
  description: tri(
    "Monthly disability assistance for BC residents with the Persons with Disabilities (PWD) designation. It includes money for living costs and shelter, plus extra supplements.",
    "為具有「殘障人士」(PWD) 資格的卑詩省居民提供的每月殘障援助，包括生活費與住屋津貼，以及額外補助。",
    "为具有「残障人士」(PWD) 资格的不列颠哥伦比亚省居民提供的每月残障援助，包括生活费与住屋津贴，以及额外补助。",
  ),
  estimatedValue: tri(
    "Up to $1,483.50/month for a single person, plus supplements",
    "單身人士最多每月 $1,483.50，另加補助",
    "单身人士最多每月 $1,483.50，另加补助",
  ),
  contextFields: ["province", "hasSevereDisability", "age", "annualIncome"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "PWD assistance is only for residents of British Columbia.",
        "PWD 援助只適用於卑詩省居民。",
        "PWD 援助只适用于不列颠哥伦比亚省居民。",
      ),
      missingField: "province",
    },
    {
      test: atLeast((c) => c.age, 18),
      hard: true,
      passReason: tri("You are 18 or older.", "你已年滿 18 歲。", "你已年满 18 岁。"),
      failReason: tri(
        "The PWD designation is for adults 18 and older.",
        "PWD 資格適用於 18 歲或以上成人。",
        "PWD 资格适用于 18 岁或以上成人。",
      ),
      missingField: "age",
    },
    {
      test: isTrue((c) => c.hasSevereDisability),
      hard: true,
      passReason: tri(
        "Your severe, long-term disability may meet the PWD test.",
        "你嚴重且長期的殘障或符合 PWD 條件。",
        "你严重且长期的残障或符合 PWD 条件。",
      ),
      failReason: tri(
        "The PWD designation requires a severe mental or physical impairment expected to last 2 or more years.",
        "PWD 資格要求嚴重且預期持續 2 年或以上的精神或身體障礙。",
        "PWD 资格要求严重且预期持续 2 年或以上的精神或身体障碍。",
      ),
      missingField: "hasSevereDisability",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 1483, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri(
        "Apply for the PWD designation",
        "申請 PWD 資格",
        "申请 PWD 资格",
      ),
      description: tri(
        "Ask the Ministry for the PWD application. It has a self-report, a medical report from your doctor, and an assessor report (a nurse, social worker, or others).",
        "向部門索取 PWD 申請表，包括自述、醫生的醫療報告及評估報告（護士、社工等）。",
        "向部门索取 PWD 申请表，包括自述、医生的医疗报告及评估报告（护士、社工等）。",
      ),
      actionUrl:
        "https://www2.gov.bc.ca/gov/content/family-social-supports/services-for-people-with-disabilities/disability-assistance/apply-for-disability-assistance",
      estimatedTime: tri("Requires medical reports", "需要醫療報告", "需要医疗报告"),
    },
    {
      order: 2,
      title: tri("Submit and wait for a decision", "提交並等候決定", "提交并等候决定"),
      description: tri(
        "Submit the completed forms. If approved, you begin receiving monthly disability assistance.",
        "提交填妥的表格。如獲批，即開始領取每月殘障援助。",
        "提交填妥的表格。如获批，即开始领取每月残障援助。",
      ),
      tips: [
        tri(
          "A PWD designation also opens the BC Bus Pass and other supplements.",
          "PWD 資格亦可開啟卑詩省巴士證及其他補助。",
          "PWD 资格亦可开启不列颠哥伦比亚省巴士证及其他补助。",
        ),
      ],
    },
  ],
  requiredDocuments: [
    tri("PWD application (self-report)", "PWD 申請（自述）", "PWD 申请（自述）"),
    tri("Medical report from your doctor", "醫生的醫療報告", "医生的医疗报告"),
    tri("Assessor report", "評估報告", "评估报告"),
  ],
  applicationUrl:
    "https://www2.gov.bc.ca/gov/content/family-social-supports/services-for-people-with-disabilities/disability-assistance/apply-for-disability-assistance",
  officialInfoUrl:
    "https://www2.gov.bc.ca/gov/content/family-social-supports/services-for-people-with-disabilities/disability-assistance",
  processingTime: tri("Varies", "視情況而定", "视情况而定"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["disability", "bc", "income", "assistance"],
  relatedBenefits: ["dtc", "cdb", "bc-bus-pass", "fair-pharmacare"],
  lastUpdated: "2026-09-01",
};

export const bcIncomeAssistance: Benefit = {
  id: "bc-income-assistance",
  name: tri(
    "BC Income Assistance",
    "卑詩省收入援助",
    "不列颠哥伦比亚省收入援助",
  ),
  shortName: "Income Assistance",
  category: "income-support",
  level: "provincial-bc",
  description: tri(
    "Last-resort monthly help for BC residents who cannot meet their basic needs and have little income or savings. It covers support and shelter costs.",
    "為無法滿足基本需要、收入或積蓄極少的卑詩省居民提供的最後保障每月援助，涵蓋支援及住屋費用。",
    "为无法满足基本需要、收入或积蓄极少的不列颠哥伦比亚省居民提供的最后保障每月援助，涵盖支援及住屋费用。",
  ),
  estimatedValue: tri(
    "Up to about $1,060/month for a single person",
    "單身人士最多約每月 $1,060",
    "单身人士最多约每月 $1,060",
  ),
  contextFields: ["province", "annualIncome", "employmentStatus"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "Income assistance is only for residents of British Columbia.",
        "收入援助只適用於卑詩省居民。",
        "收入援助只适用于不列颠哥伦比亚省居民。",
      ),
      missingField: "province",
    },
    {
      test: atMost((c) => c.annualIncome, 12000),
      hard: true,
      passReason: tri(
        "Your income is very low, which is the main test.",
        "你的收入極低，這是主要條件。",
        "你的收入极低，这是主要条件。",
      ),
      failReason: tri(
        "Income assistance is a last resort for people with very little income and savings.",
        "收入援助是為收入及積蓄極少人士而設的最後保障。",
        "收入援助是为收入及积蓄极少人士而设的最后保障。",
      ),
      missingField: "annualIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 1060, period: "month" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply online through My Self Serve", "透過 My Self Serve 網上申請", "通过 My Self Serve 网上申请"),
      description: tri(
        "Start your application online. You will answer questions about your income, assets, and housing.",
        "在網上開始申請，需回答有關收入、資產及住屋的問題。",
        "在网上开始申请，需回答有关收入、资产及住屋的问题。",
      ),
      actionUrl:
        "https://www2.gov.bc.ca/gov/content/family-social-supports/income-assistance/apply-for-assistance",
    },
    {
      order: 2,
      title: tri("Complete the process", "完成程序", "完成程序"),
      description: tri(
        "You may need to attend an orientation and provide documents. Support and shelter amounts are then paid monthly.",
        "你可能需要參加簡介會並提供文件，之後每月發放支援及住屋款項。",
        "你可能需要参加简介会并提供文件，之后每月发放支援及住屋款项。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Identification", "身份證明", "身份证明"),
    tri("Proof of income and assets", "收入及資產證明", "收入及资产证明"),
    tri("Banking information", "銀行資料", "银行资料"),
  ],
  applicationUrl:
    "https://www2.gov.bc.ca/gov/content/family-social-supports/income-assistance/apply-for-assistance",
  officialInfoUrl:
    "https://www2.gov.bc.ca/gov/content/family-social-supports/income-assistance/on-assistance",
  processingTime: tri("Varies", "視情況而定", "视情况而定"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["low-income", "bc", "assistance", "last-resort"],
  relatedBenefits: ["pwd", "bc-bus-pass"],
  lastUpdated: "2026-09-01",
};

const busPassCheck = (ctx: AssessmentContext): CheckResult => {
  const notBc = tri(
    "The BC Bus Pass is only for residents of British Columbia.",
    "卑詩省巴士證只適用於卑詩省居民。",
    "不列颠哥伦比亚省巴士证只适用于不列颠哥伦比亚省居民。",
  );
  if (ctx.province !== undefined && ctx.province !== "BC") {
    return { status: "ineligible", confidence: "definite", reasons: [notBc], missing: [] };
  }
  const onAssistance = ctx.receivesProvincialAssistance === true;
  const senior = ctx.age !== undefined && ctx.age >= 60;
  const lowIncome = ctx.annualIncome !== undefined && ctx.annualIncome <= 24000;

  if (onAssistance) {
    return {
      status: "eligible",
      confidence: "likely",
      reasons: [
        tri(
          "You receive disability or income assistance, so you can get the bus pass.",
          "你領取殘障或收入援助，因此可取得巴士證。",
          "你领取残障或收入援助，因此可取得巴士证。",
        ),
      ],
      missing: [],
    };
  }
  if (senior && lowIncome) {
    return {
      status: "eligible",
      confidence: "likely",
      reasons: [
        tri(
          "You are a low-income senior aged 60 or older.",
          "你是 60 歲或以上的低收入長者。",
          "你是 60 岁或以上的低收入长者。",
        ),
      ],
      missing: [],
    };
  }
  const missing: string[] = [];
  if (ctx.province === undefined) missing.push("province");
  if (ctx.age === undefined) missing.push("age");
  if (ctx.annualIncome === undefined) missing.push("annualIncome");
  if (ctx.receivesProvincialAssistance === undefined)
    missing.push("receivesProvincialAssistance");
  if (missing.length > 0) {
    return { status: "need-more-info", confidence: "possible", reasons: [], missing };
  }
  return {
    status: "ineligible",
    confidence: "likely",
    reasons: [
      tri(
        "The bus pass is for people on assistance, or low-income seniors 60+.",
        "巴士證適用於領取援助人士或 60 歲以上低收入長者。",
        "巴士证适用于领取援助人士或 60 岁以上低收入长者。",
      ),
    ],
    missing: [],
  };
};

export const bcBusPass: Benefit = {
  id: "bc-bus-pass",
  name: tri("BC Bus Pass Program", "卑詩省巴士證計劃", "不列颠哥伦比亚省巴士证计划"),
  shortName: "Bus Pass",
  category: "seniors",
  level: "provincial-bc",
  description: tri(
    "A low-cost annual bus pass for people on disability or income assistance, and for low-income seniors. The pass costs $45 for the year.",
    "為領取殘障或收入援助人士及低收入長者提供的低價全年巴士證，全年費用為 $45。",
    "为领取残障或收入援助人士及低收入长者提供的低价全年巴士证，全年费用为 $45。",
  ),
  estimatedValue: tri(
    "A full year of transit for a $45 annual fee",
    "全年公共交通，只需 $45 年費",
    "全年公共交通，只需 $45 年费",
  ),
  contextFields: ["province", "age", "annualIncome", "receivesProvincialAssistance"],
  check: busPassCheck,
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply for the bus pass", "申請巴士證", "申请巴士证"),
      description: tri(
        "If you are on PWD, ask your worker. Low-income seniors apply to the BC Bus Pass Program and pay the $45 annual fee.",
        "如你領取 PWD，請聯絡你的個案工作員。低收入長者可向巴士證計劃申請並繳付 $45 年費。",
        "如你领取 PWD，请联系你的个案工作员。低收入长者可向巴士证计划申请并缴付 $45 年费。",
      ),
      actionUrl:
        "https://www2.gov.bc.ca/gov/content/transportation/passenger-travel/buses-taxis-limos/bus-pass",
    },
  ],
  requiredDocuments: [
    tri("Proof of age or assistance", "年齡或援助證明", "年龄或援助证明"),
    tri("$45 annual fee", "$45 年費", "$45 年费"),
  ],
  applicationUrl:
    "https://www2.gov.bc.ca/gov/content/transportation/passenger-travel/buses-taxis-limos/bus-pass",
  officialInfoUrl:
    "https://www2.gov.bc.ca/gov/content/transportation/passenger-travel/buses-taxis-limos/bus-pass",
  processingTime: tri("A few weeks", "數星期", "数星期"),
  paymentFrequency: tri("Annual pass", "全年證", "全年证"),
  tags: ["seniors", "disability", "transit", "bc", "low-income"],
  relatedBenefits: ["pwd", "gis", "bc-income-assistance"],
  lastUpdated: "2026-09-01",
};

export const workbcAt: Benefit = {
  id: "workbc-at",
  name: tri(
    "WorkBC Assistive Technology Services",
    "WorkBC 輔助科技服務",
    "WorkBC 辅助科技服务",
  ),
  shortName: "WorkBC AT",
  category: "disability",
  level: "provincial-bc",
  description: tri(
    "Funds equipment, devices, and workplace changes that help people with disabilities or health conditions get or keep a job in BC.",
    "資助設備、器材及工作間改動，協助殘障或健康狀況人士在卑詩省找到或保住工作。",
    "资助设备、器材及工作间改动，帮助残障或健康状况人士在不列颠哥伦比亚省找到或保住工作。",
  ),
  estimatedValue: tri(
    "Funding for assistive technology and workplace accommodations",
    "資助輔助科技及工作間便利措施",
    "资助辅助科技及工作间便利措施",
  ),
  contextFields: ["province", "hasDisability", "employmentStatus"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "This service is only for residents of British Columbia.",
        "此服務只適用於卑詩省居民。",
        "此服务只适用于不列颠哥伦比亚省居民。",
      ),
      missingField: "province",
    },
    {
      test: isTrue((c) => c.hasDisability),
      hard: true,
      passReason: tri(
        "You have a disability or health condition that affects work.",
        "你有影響工作的殘障或健康狀況。",
        "你有影响工作的残障或健康状况。",
      ),
      failReason: tri(
        "This service is for people whose disability or health condition affects their ability to work.",
        "此服務適用於殘障或健康狀況影響工作能力的人士。",
        "此服务适用于残障或健康状况影响工作能力的人士。",
      ),
      missingField: "hasDisability",
    },
    {
      test: oneOf((c) => c.employmentStatus, ["employed", "self-employed", "unemployed"]),
      hard: false,
      passReason: tri(
        "You are working or looking for work.",
        "你正在工作或求職。",
        "你正在工作或求职。",
      ),
      missingField: "employmentStatus",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Contact a WorkBC Centre", "聯絡 WorkBC 中心", "联系 WorkBC 中心"),
      description: tri(
        "Reach out to WorkBC Assistive Technology Services. An assessment identifies the equipment or supports you need for work.",
        "聯絡 WorkBC 輔助科技服務。評估會找出你工作所需的設備或支援。",
        "联系 WorkBC 辅助科技服务。评估会找出你工作所需的设备或支援。",
      ),
      actionUrl: "https://www.workbc.ca/employment-services/assistive-technology-services",
    },
  ],
  requiredDocuments: [
    tri("Information about your work goal", "有關你工作目標的資料", "有关你工作目标的资料"),
  ],
  applicationUrl: "https://www.workbc.ca/employment-services/assistive-technology-services",
  officialInfoUrl: "https://www.workbc.ca/employment-services/assistive-technology-services",
  processingTime: tri("Varies", "視情況而定", "视情况而定"),
  paymentFrequency: tri("As needed", "按需要", "按需要"),
  tags: ["disability", "work", "bc", "assistive-technology"],
  relatedBenefits: ["pwd", "dtc"],
  lastUpdated: "2026-09-01",
};

export const bcDisabilityIncomeBenefits: Benefit[] = [
  pwd,
  bcIncomeAssistance,
  bcBusPass,
  workbcAt,
];
