import type { AssessmentContext, IntakeQuestion } from "@/types/benefit";

/**
 * The shared master intake. One question per context field. The full
 * assessment asks every relevant question once (with skip-logic); a
 * single-benefit check asks only the fields that benefit declares.
 *
 * Questions and options are trilingual. `questionHelping` gives an alternate
 * phrasing used in "I'm helping someone" mode.
 */

const G = {
  about: { en: "About you", "zh-Hant": "關於你", "zh-Hans": "关于你" },
  family: {
    en: "Family",
    "zh-Hant": "家庭",
    "zh-Hans": "家庭",
  },
  money: { en: "Income", "zh-Hant": "收入", "zh-Hans": "收入" },
  health: {
    en: "Health & disability",
    "zh-Hant": "健康與殘障",
    "zh-Hans": "健康与残障",
  },
  housing: {
    en: "Housing",
    "zh-Hant": "居住",
    "zh-Hans": "居住",
  },
  work: {
    en: "Work & taxes",
    "zh-Hant": "工作與稅務",
    "zh-Hans": "工作与税务",
  },
};

export const INTAKE: IntakeQuestion[] = [
  {
    field: "age",
    group: G.about,
    inputType: "slider",
    // The slider picks a birth year (more natural than dialing in a raw age);
    // QuestionInput derives and stores the age. min/max/defaultValue are all
    // birth years, not ages -- see IntakeQuestion.birthYearSlider.
    birthYearSlider: true,
    question: {
      en: "What year were you born?",
      "zh-Hant": "你出生於哪一年？",
      "zh-Hans": "你出生于哪一年？",
    },
    questionHelping: {
      en: "What year was the person you are helping born?",
      "zh-Hant": "你正在協助的人出生於哪一年？",
      "zh-Hans": "你正在帮助的人出生于哪一年？",
    },
    unit: { en: "years", "zh-Hant": "歲", "zh-Hans": "岁" },
    min: 1900,
    max: new Date().getFullYear(),
    defaultValue: new Date().getFullYear() - 40,
  },
  {
    field: "residency",
    group: G.about,
    inputType: "select",
    question: {
      en: "What is your status in Canada?",
      "zh-Hant": "你在加拿大的身份是？",
      "zh-Hans": "你在加拿大的身份是？",
    },
    questionHelping: {
      en: "What is their status in Canada?",
      "zh-Hant": "他／她在加拿大的身份是？",
      "zh-Hans": "他／她在加拿大的身份是？",
    },
    options: [
      { value: "citizen", label: { en: "Citizen", "zh-Hant": "公民", "zh-Hans": "公民" } },
      {
        value: "pr",
        label: {
          en: "Permanent resident",
          "zh-Hant": "永久居民",
          "zh-Hans": "永久居民",
        },
      },
      {
        value: "refugee",
        label: {
          en: "Protected person / refugee",
          "zh-Hant": "受保護人士／難民",
          "zh-Hans": "受保护人士／难民",
        },
      },
      {
        value: "work-permit",
        label: {
          en: "Work permit",
          "zh-Hant": "工作簽證",
          "zh-Hans": "工作签证",
        },
      },
      {
        value: "student",
        label: { en: "Study permit", "zh-Hant": "學生簽證", "zh-Hans": "学生签证" },
      },
      { value: "other", label: { en: "Other", "zh-Hant": "其他", "zh-Hans": "其他" } },
    ],
  },
  {
    field: "province",
    group: G.about,
    inputType: "select",
    question: {
      en: "Which province or territory do you live in?",
      "zh-Hant": "你居住在哪個省或地區？",
      "zh-Hans": "你居住在哪个省或地区？",
    },
    helpText: {
      en: "Federal benefits apply everywhere in Canada. We also cover several provinces — choose yours. More are coming.",
      "zh-Hant": "聯邦福利適用於全加拿大。我們亦涵蓋多個省份 — 請選擇你所在的省。將會加入更多。",
      "zh-Hans": "联邦福利适用于全加拿大。我们亦涵盖多个省份 — 请选择你所在的省。将会加入更多。",
    },
    options: [
      {
        value: "BC",
        label: {
          en: "British Columbia",
          "zh-Hant": "卑詩省 (BC)",
          "zh-Hans": "不列颠哥伦比亚省 (BC)",
        },
      },
      {
        value: "ON",
        label: {
          en: "Ontario",
          "zh-Hant": "安大略省 (ON)",
          "zh-Hans": "安大略省 (ON)",
        },
      },
      {
        value: "AB",
        label: {
          en: "Alberta",
          "zh-Hant": "亞伯達省 (AB)",
          "zh-Hans": "阿尔伯塔省 (AB)",
        },
      },
      {
        value: "MB",
        label: {
          en: "Manitoba",
          "zh-Hant": "緬尼托巴省 (MB)",
          "zh-Hans": "曼尼托巴省 (MB)",
        },
      },
      {
        value: "SK",
        label: {
          en: "Saskatchewan",
          "zh-Hant": "薩斯喀徹溫省 (SK)",
          "zh-Hans": "萨斯喀彻温省 (SK)",
        },
      },
      {
        value: "NS",
        label: {
          en: "Nova Scotia",
          "zh-Hant": "新斯科舍省 (NS)",
          "zh-Hans": "新斯科舍省 (NS)",
        },
      },
      {
        value: "NB",
        label: {
          en: "New Brunswick",
          "zh-Hant": "新不倫瑞克省 (NB)",
          "zh-Hans": "新不伦瑞克省 (NB)",
        },
      },
      {
        value: "PE",
        label: {
          en: "Prince Edward Island",
          "zh-Hant": "愛德華王子島省 (PE)",
          "zh-Hans": "爱德华王子岛省 (PE)",
        },
      },
      {
        value: "NL",
        label: {
          en: "Newfoundland and Labrador",
          "zh-Hant": "紐芬蘭與拉布拉多省 (NL)",
          "zh-Hans": "纽芬兰与拉布拉多省 (NL)",
        },
      },
      {
        value: "other",
        label: {
          en: "Another province / territory",
          "zh-Hant": "其他省／地區",
          "zh-Hans": "其他省／地区",
        },
      },
    ],
  },
  {
    field: "yearsInProvince",
    group: G.about,
    inputType: "number",
    question: {
      en: "How many years have you lived in British Columbia?",
      "zh-Hant": "你在卑詩省住了多少年？",
      "zh-Hans": "你在不列颠哥伦比亚省住了多少年？",
    },
    unit: { en: "years", "zh-Hant": "年", "zh-Hans": "年" },
    min: 0,
    max: 120,
    skipIf: (ctx) => ctx.province !== "BC",
    required: false,
  },
  {
    field: "maritalStatus",
    group: G.family,
    inputType: "select",
    question: {
      en: "What is your marital status?",
      "zh-Hant": "你的婚姻狀況是？",
      "zh-Hans": "你的婚姻状况是？",
    },
    questionHelping: {
      en: "What is their marital status?",
      "zh-Hant": "他／她的婚姻狀況是？",
      "zh-Hans": "他／她的婚姻状况是？",
    },
    options: [
      { value: "single", label: { en: "Single", "zh-Hant": "單身", "zh-Hans": "单身" } },
      { value: "married", label: { en: "Married", "zh-Hant": "已婚", "zh-Hans": "已婚" } },
      {
        value: "common-law",
        label: { en: "Common-law", "zh-Hant": "同居伴侶", "zh-Hans": "同居伴侣" },
      },
      {
        value: "separated",
        label: { en: "Separated", "zh-Hant": "分居", "zh-Hans": "分居" },
      },
      {
        value: "divorced",
        label: { en: "Divorced", "zh-Hant": "離婚", "zh-Hans": "离婚" },
      },
      { value: "widowed", label: { en: "Widowed", "zh-Hant": "喪偶", "zh-Hans": "丧偶" } },
    ],
  },
  {
    field: "hasChildren",
    group: G.family,
    inputType: "yes-no",
    question: {
      en: "Do you have any children under 18?",
      "zh-Hant": "你有 18 歲以下的子女嗎？",
      "zh-Hans": "你有 18 岁以下的子女吗？",
    },
    questionHelping: {
      en: "Do they have any children under 18?",
      "zh-Hant": "他／她有 18 歲以下的子女嗎？",
      "zh-Hans": "他／她有 18 岁以下的子女吗？",
    },
  },
  {
    field: "numberOfChildren",
    group: G.family,
    inputType: "number",
    question: {
      en: "How many children under 18?",
      "zh-Hant": "有多少名 18 歲以下的子女？",
      "zh-Hans": "有多少名 18 岁以下的子女？",
    },
    min: 0,
    max: 20,
    skipIf: (ctx) => ctx.hasChildren !== true,
  },
  {
    field: "childrenUnder6",
    group: G.family,
    inputType: "number",
    question: {
      en: "How many of your children are under 6?",
      "zh-Hant": "有多少名子女未滿 6 歲？",
      "zh-Hans": "有多少名子女未满 6 岁？",
    },
    helpText: {
      en: "Child benefits pay a higher rate for children under 6.",
      "zh-Hant": "兒童福利對未滿 6 歲的子女發放較高金額。",
      "zh-Hans": "儿童福利对未满 6 岁的子女发放较高金额。",
    },
    min: 0,
    max: 20,
    skipIf: (ctx) => ctx.hasChildren !== true,
  },
  {
    field: "youngestChildAge",
    group: G.family,
    inputType: "number",
    question: {
      en: "How old is your youngest child?",
      "zh-Hant": "最年幼的子女幾歲？",
      "zh-Hans": "最年幼的子女几岁？",
    },
    unit: { en: "years", "zh-Hant": "歲", "zh-Hans": "岁" },
    min: 0,
    max: 17,
    skipIf: (ctx) => ctx.hasChildren !== true,
    required: false,
  },
  {
    field: "employmentStatus",
    group: G.work,
    inputType: "select",
    question: {
      en: "What best describes your work situation?",
      "zh-Hant": "以下哪項最能形容你的工作情況？",
      "zh-Hans": "以下哪项最能形容你的工作情况？",
    },
    questionHelping: {
      en: "What best describes their work situation?",
      "zh-Hant": "以下哪項最能形容他／她的工作情況？",
      "zh-Hans": "以下哪项最能形容他／她的工作情况？",
    },
    options: [
      {
        value: "employed",
        label: { en: "Employed", "zh-Hant": "受僱", "zh-Hans": "受雇" },
      },
      {
        value: "self-employed",
        label: { en: "Self-employed", "zh-Hant": "自僱", "zh-Hans": "自雇" },
      },
      {
        value: "unemployed",
        label: {
          en: "Not working right now",
          "zh-Hant": "目前沒有工作",
          "zh-Hans": "目前没有工作",
        },
      },
      {
        value: "retired",
        label: { en: "Retired", "zh-Hant": "已退休", "zh-Hans": "已退休" },
      },
      {
        value: "unable-to-work",
        label: {
          en: "Unable to work",
          "zh-Hant": "無法工作",
          "zh-Hans": "无法工作",
        },
      },
    ],
  },
  {
    field: "annualIncome",
    group: G.money,
    inputType: "number",
    question: {
      en: "What is your own income last year, before tax?",
      "zh-Hant": "你去年的個人稅前收入是多少？",
      "zh-Hans": "你去年的个人税前收入是多少？",
    },
    questionHelping: {
      en: "What is their own income last year, before tax?",
      "zh-Hant": "他／她去年的個人稅前收入是多少？",
      "zh-Hans": "他／她去年的个人税前收入是多少？",
    },
    helpText: {
      en: "A rough number is fine. Use $0 if none.",
      "zh-Hant": "大約數字即可。沒有收入請填 $0。",
      "zh-Hans": "大约数字即可。没有收入请填 $0。",
    },
    unit: { en: "$ / year", "zh-Hant": "$／年", "zh-Hans": "$／年" },
    min: 0,
  },
  {
    field: "familyIncome",
    group: G.money,
    inputType: "number",
    question: {
      en: "What is your total household income last year, before tax?",
      "zh-Hant": "你家庭去年的稅前總收入是多少？",
      "zh-Hans": "你家庭去年的税前总收入是多少？",
    },
    helpText: {
      en: "Include a spouse or partner's income. If you live alone, use the same number as your own income.",
      "zh-Hant": "包括配偶或伴侶的收入。如獨居，請填與個人收入相同的數字。",
      "zh-Hans": "包括配偶或伴侣的收入。如独居，请填与个人收入相同的数字。",
    },
    unit: { en: "$ / year", "zh-Hant": "$／年", "zh-Hans": "$／年" },
    min: 0,
  },
  {
    field: "hasDisability",
    group: G.health,
    inputType: "yes-no",
    question: {
      en: "Do you have a long-term disability or serious health condition?",
      "zh-Hant": "你是否有長期殘障或嚴重健康狀況？",
      "zh-Hans": "你是否有长期残障或严重健康状况？",
    },
    questionHelping: {
      en: "Do they have a long-term disability or serious health condition?",
      "zh-Hant": "他／她是否有長期殘障或嚴重健康狀況？",
      "zh-Hans": "他／她是否有长期残障或严重健康状况？",
    },
  },
  {
    field: "hasSevereDisability",
    group: G.health,
    inputType: "yes-no",
    question: {
      en: "Does the condition markedly restrict daily activities most of the time (seeing, hearing, walking, dressing, feeding, mental functions)?",
      "zh-Hant": "該狀況是否大部分時間明顯限制日常活動（視覺、聽覺、行走、穿衣、進食、心智功能）？",
      "zh-Hans": "该状况是否大部分时间明显限制日常活动（视觉、听觉、行走、穿衣、进食、心智功能）？",
    },
    helpText: {
      en: "This is roughly the bar for the Disability Tax Credit. A doctor must confirm it.",
      "zh-Hant": "這大致是殘疾稅務抵免的門檻，需由醫生確認。",
      "zh-Hans": "这大致是残疾税务抵免的门槛，需由医生确认。",
    },
    skipIf: (ctx) => ctx.hasDisability !== true,
  },
  {
    field: "hasDTC",
    group: G.health,
    inputType: "yes-no",
    question: {
      en: "Are you already approved for the Disability Tax Credit (DTC)?",
      "zh-Hant": "你是否已獲批殘疾稅務抵免 (DTC)？",
      "zh-Hans": "你是否已获批残疾税务抵免 (DTC)？",
    },
    questionHelping: {
      en: "Are they already approved for the Disability Tax Credit (DTC)?",
      "zh-Hant": "他／她是否已獲批殘疾稅務抵免 (DTC)？",
      "zh-Hans": "他／她是否已获批残疾税务抵免 (DTC)？",
    },
    skipIf: (ctx) => ctx.hasDisability !== true,
    required: false,
  },
  {
    field: "isHomeowner",
    group: G.housing,
    inputType: "yes-no",
    question: {
      en: "Do you own the home you live in?",
      "zh-Hant": "你是否擁有現居住所？",
      "zh-Hans": "你是否拥有现居住所？",
    },
    questionHelping: {
      en: "Do they own the home they live in?",
      "zh-Hant": "他／她是否擁有現居住所？",
      "zh-Hans": "他／她是否拥有现居住所？",
    },
  },
  {
    field: "monthlyRent",
    group: G.housing,
    inputType: "number",
    question: {
      en: "How much is your rent each month?",
      "zh-Hant": "你每月租金是多少？",
      "zh-Hans": "你每月租金是多少？",
    },
    unit: { en: "$ / month", "zh-Hant": "$／月", "zh-Hans": "$／月" },
    min: 0,
    skipIf: (ctx) => ctx.isHomeowner === true,
    required: false,
  },
  {
    field: "hasPrivateDentalInsurance",
    group: G.health,
    inputType: "yes-no",
    question: {
      en: "Do you have access to any private dental insurance?",
      "zh-Hant": "你是否有任何私人牙科保險？",
      "zh-Hans": "你是否有任何私人牙科保险？",
    },
    questionHelping: {
      en: "Do they have access to any private dental insurance?",
      "zh-Hant": "他／她是否有任何私人牙科保險？",
      "zh-Hans": "他／她是否有任何私人牙科保险？",
    },
    helpText: {
      en: "Includes insurance through a job, a spouse, or a pension.",
      "zh-Hant": "包括透過工作、配偶或退休金取得的保險。",
      "zh-Hans": "包括通过工作、配偶或退休金取得的保险。",
    },
  },
  {
    field: "receivesProvincialAssistance",
    group: G.money,
    inputType: "yes-no",
    question: {
      en: "Do you currently receive provincial income or disability assistance (such as BC PWD, Ontario ODSP/OW, or Alberta AISH/Income Support)?",
      "zh-Hant": "你目前是否領取省級收入或殘障援助（例如卑詩省 PWD、安大略 ODSP／OW 或亞伯達 AISH／收入援助）？",
      "zh-Hans": "你目前是否领取省级收入或残障援助（例如不列颠哥伦比亚省 PWD、安大略 ODSP／OW 或阿尔伯塔 AISH／收入援助）？",
    },
    questionHelping: {
      en: "Do they currently receive provincial income or disability assistance (such as BC PWD, Ontario ODSP/OW, or Alberta AISH/Income Support)?",
      "zh-Hant": "他／她目前是否領取省級收入或殘障援助（例如卑詩省 PWD、安大略 ODSP／OW 或亞伯達 AISH／收入援助）？",
      "zh-Hans": "他／她目前是否领取省级收入或残障援助（例如不列颠哥伦比亚省 PWD、安大略 ODSP／OW 或阿尔伯塔 AISH／收入援助）？",
    },
    skipIf: (ctx) =>
      !["BC", "ON", "AB", "MB", "SK", "NS", "NB", "PE", "NL"].includes(ctx.province ?? ""),
    required: false,
  },
  {
    field: "hasRecentEiHours",
    group: G.work,
    inputType: "yes-no",
    question: {
      en: "In the last year, did you work and pay into Employment Insurance (EI)?",
      "zh-Hant": "過去一年，你是否有工作並繳付就業保險 (EI)？",
      "zh-Hans": "过去一年，你是否有工作并缴付就业保险 (EI)？",
    },
    helpText: {
      en: "Most employees pay EI automatically. Self-employed people usually do not.",
      "zh-Hant": "大部分僱員自動繳付 EI，自僱人士通常不繳付。",
      "zh-Hans": "大部分雇员自动缴付 EI，自雇人士通常不缴付。",
    },
    skipIf: (ctx) =>
      ctx.employmentStatus === "retired",
    required: false,
  },
  {
    field: "hasRecentCppContributions",
    group: G.work,
    inputType: "yes-no",
    question: {
      en: "Have you worked and paid into the Canada Pension Plan (CPP) in recent years?",
      "zh-Hant": "近年你是否有工作並繳付加拿大退休金計劃 (CPP)？",
      "zh-Hans": "近年你是否有工作并缴付加拿大退休金计划 (CPP)？",
    },
    questionHelping: {
      en: "Have they worked and paid into the Canada Pension Plan (CPP) in recent years?",
      "zh-Hant": "近年他／她是否有工作並繳付加拿大退休金計劃 (CPP)？",
      "zh-Hans": "近年他／她是否有工作并缴付加拿大退休金计划 (CPP)？",
    },
    required: false,
  },
  {
    field: "postSecondaryStudent",
    group: G.work,
    inputType: "yes-no",
    required: false,
    question: {
      en: "Are you or a family member studying (or about to start) at a college or university?",
      "zh-Hant": "你或家人是否正在（或即將）於學院或大學就讀？",
      "zh-Hans": "你或家人是否正在（或即将）于学院或大学就读？",
    },
    helpText: {
      en: "This helps us check student grants and education savings.",
      "zh-Hant": "這有助我們查看學生助學金及教育儲蓄。",
      "zh-Hans": "这有助我们查看学生助学金及教育储蓄。",
    },
  },
  {
    field: "filedTaxes",
    group: G.work,
    inputType: "yes-no",
    question: {
      en: "Did you file a tax return last year?",
      "zh-Hant": "你去年是否有報稅？",
      "zh-Hans": "你去年是否有报税？",
    },
    questionHelping: {
      en: "Did they file a tax return last year?",
      "zh-Hant": "他／她去年是否有報稅？",
      "zh-Hans": "他／她去年是否有报税？",
    },
    helpText: {
      en: "Filing taxes is how the government decides most benefits — even with no income.",
      "zh-Hant": "政府主要透過報稅決定大部分福利 — 即使沒有收入亦應報稅。",
      "zh-Hans": "政府主要通过报税决定大部分福利 — 即使没有收入亦应报税。",
    },
  },
];

/** Questions that apply given the current context (skip-logic + province). */
export function activeQuestions(ctx: AssessmentContext): IntakeQuestion[] {
  return INTAKE.filter((q) => !(q.skipIf && q.skipIf(ctx)));
}

/** Questions relevant to a specific set of context fields (single-benefit flow). */
export function questionsForFields(
  fields: string[],
  ctx: AssessmentContext,
): IntakeQuestion[] {
  const set = new Set(fields);
  return INTAKE.filter(
    (q) => set.has(q.field) && !(q.skipIf && q.skipIf(ctx)),
  );
}
