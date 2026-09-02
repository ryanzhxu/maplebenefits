import type { Benefit } from "@/types/benefit";
import { tri } from "@/data/tri";
import { figures, fmt, val } from "@/lib/figures";
import { atLeast, buildCheck, inRange, isFalse, isTrue } from "@/lib/checks";

export const fhsa: Benefit = {
  id: "fhsa",
  name: tri(
    "First Home Savings Account",
    "首次置業儲蓄戶口",
    "首次置业储蓄账户",
  ),
  shortName: "FHSA",
  category: "housing",
  level: "federal",
  description: tri(
    "A registered account for first-time home buyers. Contributions are tax-deductible like an RRSP, and withdrawals to buy a first home are tax-free like a TFSA.",
    "為首次置業者而設的註冊戶口。供款如 RRSP 可扣稅，提取用作首次置業如 TFSA 般免稅。",
    "为首次置业者而设的注册账户。供款如 RRSP 可扣税，提取用作首次置业如 TFSA 般免税。",
  ),
  estimatedValue: tri(
    "Contribute up to $8,000/year ($40,000 lifetime), tax-deductible",
    "每年可供款最多 $8,000（終身 $40,000），可扣稅",
    "每年可供款最多 $8,000（终身 $40,000），可扣税",
  ),
  contextFields: ["isHomeowner", "age", "residency"],
  check: buildCheck([
    {
      test: isFalse((c) => c.isHomeowner),
      hard: true,
      passReason: tri(
        "You do not own a home now, so you may qualify as a first-time buyer.",
        "你目前沒有擁有住所，或可符合首次置業者資格。",
        "你目前没有拥有住所，或可符合首次置业者资格。",
      ),
      failReason: tri(
        "The FHSA is for first-time buyers who have not owned a home they lived in during the year or the past 4 years.",
        "FHSA 適用於在本年或過去 4 年沒有擁有並自住住所的首次置業者。",
        "FHSA 适用于在本年或过去 4 年没有拥有并自住住所的首次置业者。",
      ),
      missingField: "isHomeowner",
    },
    {
      test: inRange((c) => c.age, 18, 71),
      hard: true,
      passReason: tri(
        "You are within the eligible age range (18 to 71).",
        "你在合資格年齡範圍內（18 至 71 歲）。",
        "你在合资格年龄范围内（18 至 71 岁）。",
      ),
      failReason: tri(
        "You must be between 18 and 71 to open an FHSA.",
        "你須為 18 至 71 歲才能開立 FHSA。",
        "你须为 18 至 71 岁才能开立 FHSA。",
      ),
      missingField: "age",
    },
  ]),
  applicationSteps: [
    {
      order: 1,
      title: tri("Open an FHSA at a bank or broker", "在銀行或經紀開立 FHSA", "在银行或经纪开立 FHSA"),
      description: tri(
        "Most banks, credit unions, and online brokers offer FHSAs. You need to be a Canadian resident with a Social Insurance Number.",
        "大部分銀行、信用合作社及網上經紀均提供 FHSA。你須為持有社會保險號碼的加拿大居民。",
        "大部分银行、信用合作社及网上经纪均提供 FHSA。你须为持有社会保险号码的加拿大居民。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html",
    },
    {
      order: 2,
      title: tri("Contribute and deduct on your taxes", "供款並於報稅時扣減", "供款并于报税时扣减"),
      description: tri(
        "Contribute up to $8,000 a year. Claim the deduction on your tax return, now or in a future higher-income year.",
        "每年供款最多 $8,000。可於本年或日後較高收入年度申報扣減。",
        "每年供款最多 $8,000。可于本年或日后较高收入年度申报扣减。",
      ),
    },
  ],
  requiredDocuments: [
    tri("Social Insurance Number", "社會保險號碼", "社会保险号码"),
  ],
  applicationUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html",
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html",
  paymentFrequency: tri("Tax deduction + tax-free growth", "扣稅 + 免稅增值", "扣税 + 免税增值"),
  tags: ["housing", "savings", "first-home", "tax"],
  relatedBenefits: ["home-buyers-amount"],
  lastUpdated: "2026-09-01",
};

export const homeBuyersAmount: Benefit = {
  id: "home-buyers-amount",
  name: tri("Home Buyers' Amount", "置業人士金額", "置业人士金额"),
  shortName: "HBA",
  category: "housing",
  level: "federal",
  description: tri(
    "A one-time tax credit for first-time home buyers (and some buyers with a disability) in the year they buy a qualifying home.",
    "為首次置業者（及部分殘障買家）在購買合資格住所當年提供的一次性稅務抵免。",
    "为首次置业者（及部分残障买家）在购买合资格住所当年提供的一次性税务抵免。",
  ),
  estimatedValue: tri(
    "About $1,500 in tax relief (a $10,000 credit)",
    "約 $1,500 稅務減免（$10,000 抵免額）",
    "约 $1,500 税务减免（$10,000 抵免额）",
  ),
  contextFields: ["isHomeowner"],
  check: buildCheck([
    {
      test: isFalse((c) => c.isHomeowner),
      hard: true,
      passReason: tri(
        "You rent now, so you may qualify when you buy your first home.",
        "你目前租住，購買首個住所時或符合資格。",
        "你目前租住，购买首个住所时或符合资格。",
      ),
      failReason: tri(
        "This credit is for the year you buy your first qualifying home (people with a disability may also qualify).",
        "此抵免適用於購買首個合資格住所當年（殘障人士亦可能合資格）。",
        "此抵免适用于购买首个合资格住所当年（残障人士亦可能合资格）。",
      ),
      missingField: "isHomeowner",
    },
  ]),
  estimateAmount: () => ({ low: 0, high: 1500, period: "one-time" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Claim it the year you buy", "於置業當年申索", "于置业当年申索"),
      description: tri(
        "Claim the Home Buyers' Amount on line 31270 of your tax return for the year you bought the home. It can be split with a spouse.",
        "於購買住所當年的報稅表第 31270 行申索置業人士金額，可與配偶分攤。",
        "于购买住所当年的报税表第 31270 行申索置业人士金额，可与配偶分摊。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31270-home-buyers-amount.html",
    },
  ],
  requiredDocuments: [
    tri("Proof of home purchase", "置業證明", "置业证明"),
  ],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31270-home-buyers-amount.html",
  paymentFrequency: tri("One-time tax credit", "一次性稅務抵免", "一次性税务抵免"),
  tags: ["housing", "first-home", "tax"],
  relatedBenefits: ["fhsa"],
  lastUpdated: "2026-09-01",
};

// Multigenerational home renovation tax credit -- rate and cap from the CRA
// page. Source (fetched 2026-09-02): line-45355-mhrtc.html
// The app said 15% and a $7,500 maximum. The CRA states 14.5% and $7,250, so
// the headline amount was overstated by $250.
const MHRTC_URL =
  "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45355-mhrtc.html";

const MHRTC = figures({
  expenditureCap: {
    current: {
      value: 50000,
      from: "2026-01-01",
      source: MHRTC_URL,
      quote:
        "You can claim up to $50,000 in qualifying expenditures for each qualifying renovation that is completed",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum qualifying expenditures",
  },
  rate: {
    current: {
      value: 14.5,
      from: "2026-01-01",
      source: MHRTC_URL,
      quote: "14.5% of your costs, up to a maximum of $7,250",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "percent",
    label: "Credit rate",
  },
  maxCredit: {
    current: {
      value: 7250,
      from: "2026-01-01",
      source: MHRTC_URL,
      quote: "up to a maximum of $7,250, for each claim you are eligible to make",
    },
    history: [],
    verifiedAt: "2026-09-02",
    format: "currency",
    label: "Maximum credit",
  },
});

export const multigenReno: Benefit = {
  id: "multigen-reno",
  name: tri(
    "Multigenerational Home Renovation Tax Credit",
    "多代同堂裝修稅務抵免",
    "多代同堂装修税务抵免",
  ),
  shortName: "MHRTC",
  category: "housing",
  level: "federal",
  description: tri(
    "A refundable tax credit for the cost of building a secondary unit so a senior (65+) or an adult eligible for the Disability Tax Credit can live with family.",
    "為建造第二住宅單位以讓長者（65 歲以上）或符合殘疾稅務抵免的成人與家人同住的費用提供可退還稅務抵免。",
    "为建造第二住宅单位以让长者（65 岁以上）或符合残疾税务抵免的成人与家人同住的费用提供可退还税务抵免。",
  ),
  estimatedValue: tri(
    `${fmt(MHRTC.rate)} of costs up to ${fmt(MHRTC.expenditureCap)} — up to ${fmt(MHRTC.maxCredit)} back`,
    `費用的 ${fmt(MHRTC.rate)}，上限 ${fmt(MHRTC.expenditureCap)} — 最多退回 ${fmt(MHRTC.maxCredit)}`,
    `费用的 ${fmt(MHRTC.rate)}，上限 ${fmt(MHRTC.expenditureCap)} — 最多退回 ${fmt(MHRTC.maxCredit)}`,
  ),
  figures: MHRTC,
  contextFields: ["isHomeowner", "age", "hasDisability"],
  check: buildCheck([
    {
      test: isTrue((c) => c.isHomeowner),
      hard: true,
      passReason: tri(
        "You own a home where a secondary unit could be built.",
        "你擁有可建造第二單位的住所。",
        "你拥有可建造第二单位的住所。",
      ),
      failReason: tri(
        "This credit is for a homeowner building a secondary unit for a qualifying relative.",
        "此抵免適用於為合資格親屬建造第二單位的業主。",
        "此抵免适用于为合资格亲属建造第二单位的业主。",
      ),
      missingField: "isHomeowner",
    },
    {
      test: (c) =>
        c.age === undefined && c.hasDisability === undefined
          ? "unknown"
          : (c.age !== undefined && c.age >= 65) || c.hasDisability === true
            ? "pass"
            : "fail",
      hard: false,
      passReason: tri(
        "A senior or a person with a disability in the household may be the qualifying relative.",
        "家中的長者或殘障人士或為合資格親屬。",
        "家中的长者或残障人士或为合资格亲属。",
      ),
    },
  ]),
  estimateAmount: () => ({ low: 0, high: val(MHRTC.maxCredit), period: "one-time" }),
  applicationSteps: [
    {
      order: 1,
      title: tri("Keep renovation receipts", "保留裝修收據", "保留装修收据"),
      description: tri(
        "Keep receipts for the qualifying renovation that creates a self-contained secondary unit.",
        "保留建造獨立第二單位的合資格裝修收據。",
        "保留建造独立第二单位的合资格装修收据。",
      ),
    },
    {
      order: 2,
      title: tri("Claim on your tax return", "於報稅表申索", "于报税表申索"),
      description: tri(
        "Claim the credit for the year the renovation is completed. It is refundable, so you receive it even if you owe no tax.",
        "於裝修完成當年申索。此抵免可退還，即使無稅可繳也可獲發。",
        "于装修完成当年申索。此抵免可退还，即使无税可缴也可获发。",
      ),
      actionUrl:
        "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45355-mhrtc.html",
    },
  ],
  requiredDocuments: [
    tri("Renovation receipts and contracts", "裝修收據及合約", "装修收据及合约"),
  ],
  officialInfoUrl:
    "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45355-mhrtc.html",
  paymentFrequency: tri("One-time refundable credit", "一次性可退還抵免", "一次性可退还抵免"),
  tags: ["housing", "seniors", "disability", "renovation", "tax"],
  relatedBenefits: ["dtc", "ccc"],
  lastUpdated: "2026-09-01",
};

export const federalHousingBenefits: Benefit[] = [
  fhsa,
  homeBuyersAmount,
  multigenReno,
];
