import type { Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { atMost, atMostOf, buildCheck, isTrue, oneOf } from "@/lib/checks";
import { figures, fmt, val } from "@/lib/figures";

const BC_ACCESS_GRANT_URL =
  "https://studentaidbc.ca/explore/grants-scholarships/bc-access-grant-full-time";

// Income cut-off by family size, for the under-two-years program (the one
// this benefit headlines as its "up to" amount). The app used one flat
// $120,000 for every household -- StudentAid BC publishes a 7-row table
// (family size 1 to 7+) ranging from $80,491 to $181,162, so $120,000
// over-promised to small families (real cut-off as low as $80,491) and
// under-promised to large ones (real cut-off up to $181,162).
const BC_ACCESS_CUTOFF_TABLE =
  "Income Thresholds for B.C. Access Grant for students enrolled in full-time programs of less than two years in length . Family size (number of people) For maximum grant (if gross family income is below the amount for family size, the student qualifies for the maximum grant) For grant cut-off (if gross family income is at or above these amounts for family size, the student does not qualify for the grant) 1 $38474 $80491 2 $54412 $112552 3 $66641 $134209 4 $76952 $147375 5 $86033 $159562 6 $94245 $171168 7+ $101797 $181162";

const BC_ACCESS = figures({
  shorterMax: {
    current: {
      value: 4000,
      from: "2026-08-01",
      source: BC_ACCESS_GRANT_URL,
      quote:
        "up to $4000 per eight-month school year (up to $117.65 per week of study) for students enrolled in undergraduate programs that are less than two years in length.",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Maximum per school year, programs under two years",
  },
  longerMax: {
    current: {
      value: 1000,
      from: "2026-08-01",
      source: BC_ACCESS_GRANT_URL,
      quote:
        "up to $1000 per eight-month school year (up to $29.41 per week of study) for students enrolled in undergraduate programs that are two or more years in length.",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Maximum per school year, programs two years or longer",
  },
  cutoffSize1: {
    current: { value: 80491, from: "2026-08-01", source: BC_ACCESS_GRANT_URL, quote: BC_ACCESS_CUTOFF_TABLE },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Grant cut-off, family size 1",
  },
  cutoffSize2: {
    current: { value: 112552, from: "2026-08-01", source: BC_ACCESS_GRANT_URL, quote: BC_ACCESS_CUTOFF_TABLE },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Grant cut-off, family size 2",
  },
  cutoffSize3: {
    current: { value: 134209, from: "2026-08-01", source: BC_ACCESS_GRANT_URL, quote: BC_ACCESS_CUTOFF_TABLE },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Grant cut-off, family size 3",
  },
  cutoffSize4: {
    current: { value: 147375, from: "2026-08-01", source: BC_ACCESS_GRANT_URL, quote: BC_ACCESS_CUTOFF_TABLE },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Grant cut-off, family size 4",
  },
  cutoffSize5: {
    current: { value: 159562, from: "2026-08-01", source: BC_ACCESS_GRANT_URL, quote: BC_ACCESS_CUTOFF_TABLE },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Grant cut-off, family size 5",
  },
  cutoffSize6: {
    current: { value: 171168, from: "2026-08-01", source: BC_ACCESS_GRANT_URL, quote: BC_ACCESS_CUTOFF_TABLE },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Grant cut-off, family size 6",
  },
  cutoffSize7Plus: {
    current: { value: 181162, from: "2026-08-01", source: BC_ACCESS_GRANT_URL, quote: BC_ACCESS_CUTOFF_TABLE },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Grant cut-off, family size 7 or more",
  },
});

/** Income cut-off for this household, from StudentAid BC's published table. */
const bcAccessCutoff = (c: {
  maritalStatus?: string;
  hasChildren?: boolean;
  numberOfChildren?: number;
}): number | undefined => {
  const couple = c.maritalStatus === "married" || c.maritalStatus === "common-law";
  const kids = c.hasChildren === true ? Math.max(0, c.numberOfChildren ?? 0) : 0;
  const size = Math.min(1 + (couple ? 1 : 0) + kids, 7);
  const table = [
    BC_ACCESS.cutoffSize1,
    BC_ACCESS.cutoffSize2,
    BC_ACCESS.cutoffSize3,
    BC_ACCESS.cutoffSize4,
    BC_ACCESS.cutoffSize5,
    BC_ACCESS.cutoffSize6,
    BC_ACCESS.cutoffSize7Plus,
  ];
  return val(table[size - 1]);
};

export const bcAccessGrant: Benefit = {
  id: "bc-access-grant",
  name: tri("BC Access Grant", "卑詩省入學助學金", "不列颠哥伦比亚省入学助学金"),
  shortName: "BC Access Grant",
  category: "education",
  level: "provincial-bc",
  description: tri(
    "Up-front, non-repayable money for low- and middle-income students at BC public post-secondary schools. You are assessed automatically when you apply for student aid.",
    "為卑詩省公立專上院校的低至中等收入學生提供的預先、無需償還款項。申請學生資助時會自動評估。",
    "为不列颠哥伦比亚省公立专上院校的低至中等收入学生提供的预先、无需偿还款项。申请学生资助时会自动评估。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(BC_ACCESS.shorterMax)} per school year (shorter programs); up to ${fmt(BC_ACCESS.longerMax)} for longer programs`,
    `每學年最多 ${fmt(BC_ACCESS.shorterMax)}（較短課程）；較長課程最多 ${fmt(BC_ACCESS.longerMax)}`,
    `每学年最多 ${fmt(BC_ACCESS.shorterMax)}（较短课程）；较长课程最多 ${fmt(BC_ACCESS.longerMax)}`,
  ),
  figures: BC_ACCESS,
  contextFields: [
    "province",
    "postSecondaryStudent",
    "familyIncome",
    "maritalStatus",
    "hasChildren",
    "numberOfChildren",
  ],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "The BC Access Grant is for students at BC public post-secondary schools.",
        "卑詩省入學助學金適用於卑詩省公立專上院校的學生。",
        "不列颠哥伦比亚省入学助学金适用于不列颠哥伦比亚省公立专上院校的学生。",
      ),
      missingField: "province",
    },
    {
      test: isTrue((c) => c.postSecondaryStudent),
      hard: true,
      passReason: tri(
        "You or a family member is a post-secondary student.",
        "你或家人是專上學生。",
        "你或家人是专上学生。",
      ),
      failReason: tri(
        "This grant is for people enrolled in post-secondary studies.",
        "此助學金適用於就讀專上課程的人士。",
        "此助学金适用于就读专上课程的人士。",
      ),
      missingField: "postSecondaryStudent",
    },
    {
      test: atMostOf((c) => c.familyIncome, bcAccessCutoff),
      hard: false,
      passReason: tri(
        "Your income is in the low-to-middle range the grant targets.",
        "你的收入屬助學金針對的低至中等範圍。",
        "你的收入属助学金针对的低至中等范围。",
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: val(BC_ACCESS.shorterMax), period: "year" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through StudentAid BC", "透過 StudentAid BC 申請", "通过 StudentAid BC 申请"),
      description: tri(
        "Apply for student aid at StudentAid BC. You are automatically assessed for the BC Access Grant — there is no separate form.",
        "在 StudentAid BC 申請學生資助，系統會自動評估卑詩省入學助學金 — 無需另填表格。",
        "在 StudentAid BC 申请学生资助，系统会自动评估不列颠哥伦比亚省入学助学金 — 无需另填表格。",
      ),
      actionUrl: "https://studentaidbc.ca/explore/grants-scholarships/bc-access-grant-full-time",
    },
  ],
  requiredDocuments: [
    tri("Proof of enrolment", "註冊證明", "注册证明"),
    tri("Income information", "收入資料", "收入资料"),
  ],
  applicationUrl: "https://studentaidbc.ca/explore/grants-scholarships/bc-access-grant-full-time",
  officialInfoUrl: "https://studentaidbc.ca/explore/grants-scholarships/bc-access-grant-full-time",
  paymentFrequency: tri("Per school year", "每學年", "每学年"),
  tags: ["education", "students", "bc", "low-income", "grant"],
  relatedBenefits: ["canada-training-credit"],
  lastUpdated: "2026-09-03",
};

const ACCB_ELIGIBILITY_URL =
  "https://www2.gov.bc.ca/gov/content/family-social-supports/caring-for-young-children/childcarebc-programs/child-care-benefit/information-for-families/eligibility-estimate-funding";
const ACCB_RATES_URL =
  "https://www2.gov.bc.ca/gov/content/family-social-supports/caring-for-young-children/childcarebc-programs/child-care-benefit/information-for-families/rates-payments";

const ACCB_FIGURES = figures({
  incomeThreshold: {
    current: {
      value: 111000,
      from: "2026-04-24",
      source: ACCB_ELIGIBILITY_URL,
      quote: "Generally speaking, families that earn up to $111000 may qualify for funding.",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Income generally needed to qualify for funding",
  },
  maxMonthly: {
    current: {
      value: 1250,
      from: "2026-03-25",
      source: ACCB_RATES_URL,
      quote:
        "Group Child Care, Multi-Age Child Care, or School Age Care on School Grounds child under 19 months G1 $1250",
    },
    history: [],
    verifiedAt: "2026-09-03",
    format: "currency",
    label: "Maximum monthly benefit (infant, licensed group care)",
  },
});

export const bcAffordableChildCare: Benefit = {
  id: "bc-affordable-child-care",
  name: tri(
    "Affordable Child Care Benefit",
    "可負擔托兒福利",
    "可负担托儿福利",
  ),
  shortName: "ACCB",
  category: "family",
  level: "provincial-bc",
  description: tri(
    "Monthly help paying for child care in BC — daycare, preschool, before/after school, or a licensed home. The amount depends on your income, family size, and type of care.",
    "為卑詩省托兒（日託、幼稚園、課前課後託管或持牌家庭託管）提供的每月費用援助。金額視乎收入、家庭人數及託管類型。",
    "为不列颠哥伦比亚省托儿（日托、幼儿园、课前课后托管或持牌家庭托管）提供的每月费用援助。金额视乎收入、家庭人数及托管类型。",
  ),
  estimatedValue: tri(
    `Up to ${fmt(ACCB_FIGURES.maxMonthly)} per child per month`,
    `每名子女最多每月 ${fmt(ACCB_FIGURES.maxMonthly)}`,
    `每名子女最多每月 ${fmt(ACCB_FIGURES.maxMonthly)}`,
  ),
  figures: ACCB_FIGURES,
  contextFields: ["province", "hasChildren", "familyIncome"],
  check: buildCheck([
    {
      test: oneOf((c) => c.province, ["BC"]),
      hard: true,
      passReason: tri("You live in British Columbia.", "你居住在卑詩省。", "你居住在不列颠哥伦比亚省。"),
      failReason: tri(
        "This benefit is for BC families using child care.",
        "此福利適用於使用託兒服務的卑詩省家庭。",
        "此福利适用于使用托儿服务的不列颠哥伦比亚省家庭。",
      ),
      missingField: "province",
    },
    {
      test: isTrue((c) => c.hasChildren),
      hard: true,
      passReason: tri(
        "You have a child who may need care.",
        "你有可能需要託管的子女。",
        "你有可能需要托管的子女。",
      ),
      failReason: tri(
        "This benefit helps families pay for the care of a child.",
        "此福利協助家庭支付子女的託管費用。",
        "此福利帮助家庭支付子女的托管费用。",
      ),
      missingField: "hasChildren",
    },
    {
      test: atMost((c) => c.familyIncome, val(ACCB_FIGURES.incomeThreshold)),
      hard: true,
      passReason: tri(
        "Your family income is within the range that receives funding.",
        "你的家庭收入在可獲資助的範圍內。",
        "你的家庭收入在可获资助的范围内。",
      ),
      failReason: tri(
        `Funding generally phases out above about ${fmt(ACCB_FIGURES.incomeThreshold)} of family income (higher for larger families).`,
        `資助一般在家庭收入約 ${fmt(ACCB_FIGURES.incomeThreshold)} 以上逐步取消（家庭人數較多則較高）。`,
        `资助一般在家庭收入约 ${fmt(ACCB_FIGURES.incomeThreshold)} 以上逐步取消（家庭人数较多则较高）。`,
      ),
      missingField: "familyIncome",
    },
  ]),
  estimateAmount: () => ({
    low: 0,
    high: val(ACCB_FIGURES.maxMonthly),
    period: "month",
    note: tri(
      "Per child. The exact amount depends on income, age, and type of care.",
      "以每名子女計。實際金額視乎收入、年齡及託管類型。",
      "以每名子女计。实际金额视乎收入、年龄及托管类型。",
    ),
  }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Apply through My Family Services", "透過 My Family Services 申請", "通过 My Family Services 申请"),
      description: tri(
        "Apply online. You will need details about your child, your care provider, and your income.",
        "網上申請。你需要子女、託管機構及收入的資料。",
        "网上申请。你需要子女、托管机构及收入的资料。",
      ),
      actionUrl: "https://www2.gov.bc.ca/gov/content/family-social-supports/caring-for-young-children/childcarebc-programs/child-care-benefit",
    },
    {
      order: 2,
      title: tri("Your provider confirms the care", "託管機構確認服務", "托管机构确认服务"),
      description: tri(
        "Your child care provider confirms the arrangement so the benefit can be paid, usually directly to the provider.",
        "託管機構會確認安排，以便發放福利（通常直接支付予機構）。",
        "托管机构会确认安排，以便发放福利（通常直接支付予机构）。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Child care provider details", "託管機構資料", "托管机构资料"),
    tri("Proof of income", "收入證明", "收入证明"),
  ],
  applicationUrl: "https://www2.gov.bc.ca/gov/content/family-social-supports/caring-for-young-children/childcarebc-programs/child-care-benefit",
  officialInfoUrl: "https://www2.gov.bc.ca/gov/content/family-social-supports/caring-for-young-children/childcarebc-programs/child-care-benefit",
  processingTime: tri("A few weeks", "數星期", "数星期"),
  paymentFrequency: tri("Monthly", "每月", "每月"),
  tags: ["family", "children", "childcare", "bc", "low-income"],
  relatedBenefits: ["ccb", "bc-family-benefit"],
  lastUpdated: "2026-09-01",
};

export const bcEducationChildcareBenefits: Benefit[] = [
  bcAccessGrant,
  bcAffordableChildCare,
];
