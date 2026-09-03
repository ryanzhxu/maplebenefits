import type { DeepContent } from "@/types/benefit";
import { tri } from "@/data/tri";

/**
 * Richer, plain-language detail per benefit, keyed by benefit id. Rendered as
 * collapsible sections on the benefit page. Trilingual; English fallback.
 * Verified against official sources on 2026-09-01 (see docs/research-notes.md).
 */
export const DEEP: Record<string, DeepContent> = {
  dtc: {
    eligibilityDetails: [
      tri(
        "A medical practitioner must certify that you have a severe and prolonged impairment (expected to last at least 12 months).",
        "醫療人員須證明你有嚴重且長期的損傷（預期持續最少 12 個月）。",
        "医疗人员须证明你有严重且长期的损伤（预期持续最少 12 个月）。",
      ),
      tri(
        "The impairment must markedly restrict a basic activity of daily living (walking, dressing, feeding, mental functions, vision, hearing, elimination), or you need life-sustaining therapy.",
        "損傷須明顯限制一項基本日常活動（行走、穿衣、進食、心智功能、視覺、聽覺、排泄），或你需要維生療法。",
        "损伤须明显限制一项基本日常活动（行走、穿衣、进食、心智功能、视觉、听觉、排泄），或你需要维生疗法。",
      ),
      tri(
        "You can transfer unused credit to a supporting spouse, parent, or other family member.",
        "未用完的抵免可轉讓給供養你的配偶、父母或其他家人。",
        "未用完的抵免可转让给供养你的配偶、父母或其他家人。",
      ),
    ],
    goodToKnow: [
      tri(
        "Being approved for the DTC can unlock the Canada Disability Benefit, the RDSP, the Child Disability Benefit, and the disability supplement of the Canada Workers Benefit.",
        "獲批 DTC 可開啟加拿大殘障福利、RDSP、兒童殘障福利及加拿大工作福利的殘障補助。",
        "获批 DTC 可开启加拿大残障福利、RDSP、儿童残障福利及加拿大工作福利的残障补助。",
      ),
      tri(
        "If approved, ask the CRA to reassess up to 10 prior years — this can produce a large one-time refund.",
        "如獲批，可要求稅務局重新評估最多過往 10 年 — 或可獲一筆可觀退稅。",
        "如获批，可要求税务局重新评估最多过往 10 年 — 或可获一笔可观退税。",
      ),
      tri(
        "The credit is non-refundable, so it reduces tax owing but does not pay out if you owe no tax — though the benefits it unlocks may.",
        "此抵免不可退還，只能減少應繳稅款；若無稅可繳則不會發放 — 但它開啟的其他福利可能會。",
        "此抵免不可退还，只能减少应缴税款；若无税可缴则不会发放 — 但它开启的其他福利可能会。",
      ),
    ],
    faqs: [
      {
        q: tri(
          "Do I need to have a job to get the DTC?",
          "申請 DTC 需要有工作嗎？",
          "申请 DTC 需要有工作吗？",
        ),
        a: tri(
          "No. The DTC is about your medical condition, not your income or work. If you have little tax to reduce, you can transfer it to a supporting family member.",
          "不需要。DTC 取決於你的醫療狀況，與收入或工作無關。如你應繳稅款很少，可轉讓給供養你的家人。",
          "不需要。DTC 取决于你的医疗状况，与收入或工作无关。如你应缴税款很少，可转让给供养你的家人。",
        ),
      },
    ],
  },

  cdb: {
    eligibilityDetails: [
      tri(
        "You must be 18 to 64, approved for the Disability Tax Credit, and have filed your tax return for the previous year.",
        "你須為 18 至 64 歲、已獲批殘疾稅務抵免，並已就上一年報稅。",
        "你须为 18 至 64 岁、已获批残疾税务抵免，并已就上一年报税。",
      ),
      tri(
        "You must be a resident of Canada for tax purposes.",
        "你須為加拿大稅務居民。",
        "你须为加拿大税务居民。",
      ),
      tri(
        "If you have a spouse or partner, they must also file a tax return.",
        "如你有配偶或伴侶，對方亦須報稅。",
        "如你有配偶或伴侣，对方亦须报税。",
      ),
    ],
    goodToKnow: [
      tri(
        "A working-income exemption ($10,000 single / $14,000 couple) means some earnings do not reduce your payment.",
        "工作收入豁免（單身 $10,000／夫婦 $14,000）代表部分收入不會減少你的款項。",
        "工作收入豁免（单身 $10,000／夫妇 $14,000）代表部分收入不会减少你的款项。",
      ),
      tri(
        "The maximum rose to $204.20/month in July 2026. The payment is reduced as income rises above the threshold.",
        "上限已於 2026 年 7 月升至每月 $204.20。收入超過門檻後款項會遞減。",
        "上限已于 2026 年 7 月升至每月 $204.20。收入超过门槛后款项会递减。",
      ),
    ],
  },

  ccb: {
    eligibilityDetails: [
      tri(
        "You must live with a child under 18 and be primarily responsible for their care.",
        "你須與 18 歲以下子女同住，並主要負責照顧。",
        "你须与 18 岁以下子女同住，并主要负责照顾。",
      ),
      tri(
        "You must be a resident of Canada for tax purposes; at least one parent must meet a status requirement (citizen, PR, protected person, or certain temporary residents).",
        "你須為加拿大稅務居民；至少一名家長須符合身份要求（公民、永久居民、受保護人士或某些臨時居民）。",
        "你须为加拿大税务居民；至少一名家长须符合身份要求（公民、永久居民、受保护人士或某些临时居民）。",
      ),
      tri(
        "The amount is based on adjusted family net income, number of children, and their ages.",
        "金額按經調整家庭淨收入、子女數目及年齡計算。",
        "金额按经调整家庭净收入、子女数目及年龄计算。",
      ),
    ],
    goodToKnow: [
      tri(
        "If your child is approved for the Disability Tax Credit, the Child Disability Benefit (up to about $3,400/year) is added automatically.",
        "如子女獲批殘疾稅務抵免，兒童殘障福利（最多約每年 $3,400）會自動加入。",
        "如子女获批残疾税务抵免，儿童残障福利（最多约每年 $3,400）会自动加入。",
      ),
      tri(
        "Both parents must file taxes every year — even with no income — or payments can stop.",
        "父母雙方每年都必須報稅（即使沒有收入），否則款項可能停止。",
        "父母双方每年都必须报税（即使没有收入），否则款项可能停止。",
      ),
      tri(
        "In shared custody, each parent can receive 50% of the amount.",
        "共同撫養下，每名家長可獲一半金額。",
        "共同抚养下，每名家长可获一半金额。",
      ),
    ],
  },

  cgeb: {
    eligibilityDetails: [
      tri(
        "You must be a resident of Canada for tax purposes and generally 19 or older (younger if you have a spouse or child).",
        "你須為加拿大稅務居民，一般須年滿 19 歲（有配偶或子女則可較年輕）。",
        "你须为加拿大税务居民，一般须年满 19 岁（有配偶或子女则可较年轻）。",
      ),
      tri(
        "There is no separate application — filing your tax return is the application.",
        "無需另行申請 — 報稅即為申請。",
        "无需另行申请 — 报税即为申请。",
      ),
      tri(
        "The amount depends on family net income, marital status, and number of children.",
        "金額視乎家庭淨收入、婚姻狀況及子女數目。",
        "金额视乎家庭净收入、婚姻状况及子女数目。",
      ),
    ],
    goodToKnow: [
      tri(
        "New residents can apply with a one-time form (RC151) before filing their first Canadian tax return.",
        "新移民可在首次報稅前以一次性表格（RC151）申請。",
        "新移民可在首次报税前以一次性表格（RC151）申请。",
      ),
      tri(
        "This is the program formerly known as the GST/HST credit, renamed for the 2025 tax year.",
        "此計劃前稱 GST/HST 抵免，於 2025 稅務年度更名。",
        "此计划前称 GST/HST 抵免，于 2025 税务年度更名。",
      ),
    ],
  },

  cdcp: {
    eligibilityDetails: [
      tri(
        "You must not have access to any dental insurance (through work, a spouse, a pension, or a private plan you bought).",
        "你不可有任何牙科保險（透過工作、配偶、退休金或自行購買的計劃）。",
        "你不可有任何牙科保险（通过工作、配偶、退休金或自行购买的计划）。",
      ),
      tri(
        "Your adjusted family net income must be under $90,000, and you must have filed last year's taxes.",
        "你的經調整家庭淨收入須低於 $90,000，且已就上一年報稅。",
        "你的经调整家庭净收入须低于 $90,000，且已就上一年报税。",
      ),
      tri(
        "You must be a Canadian resident for tax purposes. All ages are now eligible.",
        "你須為加拿大稅務居民。現已開放予所有年齡。",
        "你须为加拿大税务居民。现已开放予所有年龄。",
      ),
    ],
    goodToKnow: [
      tri(
        "If your family income is under $70,000, the plan covers the full eligible amount; between $70,000 and $90,000, you pay a co-payment.",
        "如家庭收入低於 $70,000，計劃承擔全部合資格金額；$70,000 至 $90,000 則需共付。",
        "如家庭收入低于 $70,000，计划承担全部合资格金额；$70,000 至 $90,000 则需共付。",
      ),
      tri(
        "Having a workplace plan makes you ineligible even if you choose not to use it.",
        "即使你選擇不使用職場計劃，擁有它亦會令你不符合資格。",
        "即使你选择不使用职场计划，拥有它亦会令你不符合资格。",
      ),
    ],
  },

  "cpp-d": {
    eligibilityDetails: [
      tri(
        "You must be under 65, have a severe and prolonged disability that regularly stops you from doing any substantially gainful work, and have contributed to CPP in 4 of the last 6 years (or 3 of the last 6 with 25+ years of contributions).",
        "你須未滿 65 歲、有嚴重且長期殘障並經常令你無法從事任何實質有酬工作，並在過去 6 年中的 4 年供款 CPP（或供款 25 年以上者為過去 6 年中的 3 年）。",
        "你须未满 65 岁、有严重且长期残障并经常令你无法从事任何实质有酬工作，并在过去 6 年中的 4 年供款 CPP（或供款 25 年以上者为过去 6 年中的 3 年）。",
      ),
      tri(
        "'Severe' means you cannot regularly do any type of substantially gainful work, not only your last job.",
        "「嚴重」指你無法定期從事任何實質有酬工作，而非僅你上一份工作。",
        "「严重」指你无法定期从事任何实质有酬工作，而非仅你上一份工作。",
      ),
    ],
    goodToKnow: [
      tri(
        "Your dependent children may also receive a monthly children's benefit.",
        "你的受養子女或可另獲每月子女福利。",
        "你的受养子女或可另获每月子女福利。",
      ),
      tri(
        "At 65 the disability pension automatically converts to a CPP retirement pension.",
        "65 歲時傷殘退休金會自動轉為 CPP 退休金。",
        "65 岁时伤残退休金会自动转为 CPP 退休金。",
      ),
      tri(
        "If you are refused, you can ask for reconsideration and then appeal — many claims succeed on appeal.",
        "如被拒，可要求重新考慮再上訴 — 很多申請在上訴階段成功。",
        "如被拒，可要求重新考虑再上诉 — 很多申请在上诉阶段成功。",
      ),
    ],
  },

  "cpp-retirement": {
    eligibilityDetails: [
      tri(
        "You must have made at least one valid CPP contribution from work in Canada.",
        "你須至少有一次有效的加拿大工作 CPP 供款。",
        "你须至少有一次有效的加拿大工作 CPP 供款。",
      ),
      tri(
        "You can start as early as 60 (reduced 0.6% per month early) or as late as 70 (increased 0.7% per month after 65).",
        "可最早 60 歲開始（每提早一個月減 0.6%）或最遲 70 歲（65 歲後每延一個月增 0.7%）。",
        "可最早 60 岁开始（每提早一个月减 0.6%）或最迟 70 岁（65 岁后每延一个月增 0.7%）。",
      ),
    ],
    goodToKnow: [
      tri(
        "Waiting longer means a larger monthly pension for life — worth considering if you have other income.",
        "延遲領取代表終身每月退休金更高 — 如有其他收入值得考慮。",
        "延迟领取代表终身每月退休金更高 — 如有其他收入值得考虑。",
      ),
      tri(
        "CPP is separate from OAS; you can receive both. It is taxable income.",
        "CPP 與 OAS 分開，可同時領取。屬應課稅收入。",
        "CPP 与 OAS 分开，可同时领取。属应课税收入。",
      ),
    ],
  },

  oas: {
    eligibilityDetails: [
      tri(
        "You must be 65 or older and have lived in Canada for at least 10 years after age 18 (20 years to receive it outside Canada).",
        "你須年滿 65 歲，並在 18 歲後在加拿大居住最少 10 年（在加拿大以外領取則需 20 年）。",
        "你须年满 65 岁，并在 18 岁后在加拿大居住最少 10 年（在加拿大以外领取则需 20 年）。",
      ),
      tri(
        "Full OAS needs 40 years of residence after 18; fewer years give a partial pension.",
        "全額 OAS 需 18 歲後居住 40 年；年期較短則獲部分退休金。",
        "全额 OAS 需 18 岁后居住 40 年；年期较短则获部分退休金。",
      ),
    ],
    goodToKnow: [
      tri(
        "Higher-income seniors repay part of OAS (the 'recovery tax') starting around $90,997 of net income.",
        "高收入長者須償還部分 OAS（「回收稅」），由淨收入約 $90,997 起。",
        "高收入长者须偿还部分 OAS（「回收税」），由净收入约 $90,997 起。",
      ),
      tri(
        "Delaying OAS past 65 (up to 70) increases it by 0.6% per month.",
        "65 歲後延遲領取 OAS（最遲 70 歲）每月增加 0.6%。",
        "65 岁后延迟领取 OAS（最迟 70 岁）每月增加 0.6%。",
      ),
      tri(
        "At 75 the pension automatically increases by 10%.",
        "75 歲時退休金自動增加 10%。",
        "75 岁时退休金自动增加 10%。",
      ),
    ],
  },

  gis: {
    eligibilityDetails: [
      tri(
        "You must receive Old Age Security and have income below the yearly limit for your marital status.",
        "你須領取老年保障金，且收入低於按婚姻狀況的年度上限。",
        "你须领取老年保障金，且收入低于按婚姻状况的年度上限。",
      ),
      tri(
        "GIS is not taxable, and the limits are roughly $22,000 (single) to $53,000 (couple, both on OAS).",
        "GIS 免稅，上限約 $22,000（單身）至 $53,000（夫婦，雙方領 OAS）。",
        "GIS 免税，上限约 $22,000（单身）至 $53,000（夫妇，双方领 OAS）。",
      ),
    ],
    goodToKnow: [
      tri(
        "File your taxes on time every year or GIS can be interrupted.",
        "每年準時報稅，否則 GIS 可能中斷。",
        "每年准时报税，否则 GIS 可能中断。",
      ),
      tri(
        "If your income dropped (for example, you stopped working), you can ask for an estimate based on this year's income.",
        "如收入下降（例如停止工作），可要求按今年收入估算。",
        "如收入下降（例如停止工作），可要求按今年收入估算。",
      ),
    ],
  },

  ei: {
    eligibilityDetails: [
      tri(
        "You must have lost your job through no fault of your own (regular) or be unable to work due to illness or injury (sickness), and have paid EI premiums.",
        "你須非因己過而失業（正常）或因病或受傷無法工作（疾病），並曾繳付 EI 保費。",
        "你须非因己过而失业（正常）或因病或受伤无法工作（疾病），并曾缴付 EI 保费。",
      ),
      tri(
        "You need enough insurable hours in the last 52 weeks — usually 420 to 700 depending on your region.",
        "你須在過去 52 週有足夠可保工時 — 視地區通常為 420 至 700 小時。",
        "你须在过去 52 周有足够可保工时 — 视地区通常为 420 至 700 小时。",
      ),
    ],
    goodToKnow: [
      tri(
        "Apply right away — do not wait for your Record of Employment. Waiting more than 4 weeks after your last day can cost you benefits.",
        "立即申請 — 不要等就業紀錄。最後工作日後延遲超過 4 週可能損失福利。",
        "立即申请 — 不要等就业纪录。最后工作日后延迟超过 4 周可能损失福利。",
      ),
      tri(
        "Self-employed people can opt in for special benefits (sickness, maternity, parental) but not regular benefits.",
        "自僱人士可自願加入特別福利（疾病、產假、育兒），但不包括正常福利。",
        "自雇人士可自愿加入特别福利（疾病、产假、育儿），但不包括正常福利。",
      ),
    ],
  },

  cwb: {
    eligibilityDetails: [
      tri(
        "You must have working income and be a resident of Canada, 19 or older at year end (or living with a spouse or child).",
        "你須有工作收入、為加拿大居民，並在年底年滿 19 歲（或與配偶或子女同住）。",
        "你须有工作收入、为加拿大居民，并在年底年满 19 岁（或与配偶或子女同住）。",
      ),
      tri(
        "Full-time students without a dependant generally do not qualify.",
        "沒有受養人的全日制學生一般不符合資格。",
        "没有受养人的全日制学生一般不符合资格。",
      ),
    ],
    goodToKnow: [
      tri(
        "It is refundable — you receive it even if you owe no tax.",
        "可退還 — 即使無稅可繳也可獲發。",
        "可退还 — 即使无税可缴也可获发。",
      ),
      tri(
        "Half is often paid in advance during the year (the Advanced Canada Workers Benefit) automatically.",
        "通常一半會於年內自動預付（預付加拿大工作福利）。",
        "通常一半会于年内自动预付（预付加拿大工作福利）。",
      ),
    ],
  },

  rdsp: {
    eligibilityDetails: [
      tri(
        "The beneficiary must be approved for the Disability Tax Credit, a Canadian resident, under 60, and have a Social Insurance Number.",
        "受益人須已獲批殘疾稅務抵免、為加拿大居民、未滿 60 歲並有社會保險號碼。",
        "受益人须已获批残疾税务抵免、为加拿大居民、未满 60 岁并有社会保险号码。",
      ),
      tri(
        "The government bond (up to $1,000/year) is paid to low-income beneficiaries even with no personal contributions.",
        "政府債券（最多每年 $1,000）即使沒有個人供款，也會發給低收入受益人。",
        "政府债券（最多每年 $1,000）即使没有个人供款，也会发给低收入受益人。",
      ),
    ],
    goodToKnow: [
      tri(
        "Grants and bonds can be claimed for up to 10 prior years if you were eligible then.",
        "如當年合資格，補助金及債券可追溯最多過往 10 年申領。",
        "如当年合资格，补助金及债券可追溯最多过往 10 年申领。",
      ),
      tri(
        "RDSP savings generally do not affect provincial disability assistance like BC PWD.",
        "RDSP 儲蓄一般不影響如卑詩省 PWD 的省級殘障援助。",
        "RDSP 储蓄一般不影响如不列颠哥伦比亚省 PWD 的省级残障援助。",
      ),
    ],
  },

  "medical-expense": {
    eligibilityDetails: [
      tri(
        "You can claim eligible medical expenses for yourself, your spouse, and dependent children paid in any 12-month period ending in the tax year.",
        "你可申索自己、配偶及受養子女在稅務年度內任何 12 個月期間支付的合資格醫療開支。",
        "你可申索自己、配偶及受养子女在税务年度内任何 12 个月期间支付的合资格医疗开支。",
      ),
      tri(
        "Only the amount above the lesser of 3% of net income or about $2,834 (2025) counts.",
        "只有超過「淨收入 3% 或約 $2,834（2025，以較低者為準）」的部分計算在內。",
        "只有超过「净收入 3% 或约 $2,834（2025，以较低者为准）」的部分计算在内。",
      ),
    ],
    goodToKnow: [
      tri(
        "Eligible costs include prescriptions, dental, vision, many therapies, medical travel, and some home renovations for accessibility.",
        "合資格開支包括處方藥、牙科、視力、多種治療、就醫交通及部分無障礙裝修。",
        "合资格开支包括处方药、牙科、视力、多种治疗、就医交通及部分无障碍装修。",
      ),
      tri(
        "It is usually best for the lower-income spouse to claim, because the 3% threshold is then smaller.",
        "通常由收入較低的配偶申索較有利，因為 3% 門檻較低。",
        "通常由收入较低的配偶申索较有利，因为 3% 门槛较低。",
      ),
    ],
  },

  "eligible-dependant": {
    eligibilityDetails: [
      tri(
        "You must be single, separated, divorced, or widowed at some point in the year and have supported a dependant (often a child) who lived with you.",
        "你在年內某時須為單身、分居、離婚或喪偶，並供養一位與你同住的受養人（常為子女）。",
        "你在年内某时须为单身、分居、离婚或丧偶，并供养一位与你同住的受养人（常为子女）。",
      ),
      tri(
        "You cannot claim it if you were living with and supported by a spouse or common-law partner.",
        "如你與配偶或同居伴侶同住並由對方供養，則不可申索。",
        "如你与配偶或同居伴侣同住并由对方供养，则不可申索。",
      ),
    ],
    goodToKnow: [
      tri(
        "The amount is reduced by the dependant's net income, and only one person can claim per dependant.",
        "金額按受養人淨收入遞減，每名受養人只可由一人申索。",
        "金额按受养人净收入递减，每名受养人只可由一人申索。",
      ),
    ],
  },

  ccc: {
    eligibilityDetails: [
      tri(
        "You support a spouse, partner, or family member (child, parent, grandparent, sibling, aunt/uncle, niece/nephew) who has a physical or mental impairment.",
        "你供養一位有身體或精神障礙的配偶、伴侶或家人（子女、父母、祖父母、兄弟姊妹、姑姨叔舅、姪甥）。",
        "你供养一位有身体或精神障碍的配偶、伴侣或家人（子女、父母、祖父母、兄弟姊妹、姑姨叔舅、侄甥）。",
      ),
      tri(
        "The person does not need the Disability Tax Credit, but the CRA may ask for a signed medical statement.",
        "該人不需要殘疾稅務抵免，但稅務局可能要求簽署的醫療聲明。",
        "该人不需要残疾税务抵免，但税务局可能要求签署的医疗声明。",
      ),
    ],
    goodToKnow: [
      tri(
        "The claim is reduced by the dependant's net income over about $20,197 (2025).",
        "申索額按受養人淨收入超過約 $20,197（2025）的部分遞減。",
        "申索额按受养人净收入超过约 $20,197（2025）的部分递减。",
      ),
    ],
  },

  pwd: {
    eligibilityDetails: [
      tri(
        "You must be 18+ and have a severe mental or physical impairment expected to last 2 or more years that directly and significantly restricts daily activities.",
        "你須年滿 18 歲，並有預期持續 2 年或以上、直接且顯著限制日常活動的嚴重精神或身體障礙。",
        "你须年满 18 岁，并有预期持续 2 年或以上、直接且显著限制日常活动的严重精神或身体障碍。",
      ),
      tri(
        "A prescribed professional must confirm you need help (from a person, an assistive device, or an assistance animal) with daily activities.",
        "指定專業人員須確認你在日常活動上需要協助（來自他人、輔助器材或協助動物）。",
        "指定专业人员须确认你在日常活动上需要协助（来自他人、辅助器材或协助动物）。",
      ),
    ],
    goodToKnow: [
      tri(
        "PWD includes extra supplements: a transportation supplement, medical/dental coverage, and access to the BC Bus Pass.",
        "PWD 包括額外補助：交通補助、醫療／牙科保障及卑詩省巴士證。",
        "PWD 包括额外补助：交通补助、医疗／牙科保障及不列颠哥伦比亚省巴士证。",
      ),
      tri(
        "Having the federal Disability Tax Credit can make the PWD application easier.",
        "持有聯邦殘疾稅務抵免可令 PWD 申請更順利。",
        "持有联邦残疾税务抵免可令 PWD 申请更顺利。",
      ),
    ],
  },

  "bc-income-assistance": {
    eligibilityDetails: [
      tri(
        "You must have very low income and few assets (generally under $5,000 for a single person), and be a BC resident able to accept work or an employment plan.",
        "你須收入極低且資產甚少（單身一般低於 $5,000），並為能接受工作或就業計劃的卑詩省居民。",
        "你须收入极低且资产甚少（单身一般低于 $5,000），并为能接受工作或就业计划的不列颠哥伦比亚省居民。",
      ),
    ],
    goodToKnow: [
      tri(
        "A single person can keep up to $600/month of earnings without it reducing assistance.",
        "單身人士每月最多可保留 $600 工作收入而不減少援助。",
        "单身人士每月最多可保留 $600 工作收入而不减少援助。",
      ),
      tri(
        "Extra supplements exist for crisis needs, moving, and some health costs.",
        "另有危機需要、搬遷及部分健康開支的額外補助。",
        "另有危机需要、搬迁及部分健康开支的额外补助。",
      ),
    ],
  },

  "fair-pharmacare": {
    eligibilityDetails: [
      tri(
        "You must be a BC resident enrolled in the Medical Services Plan (MSP) and register once with income consent.",
        "你須為已參加醫療服務計劃 (MSP) 的卑詩省居民，並以收入同意登記一次。",
        "你须为已参加医疗服务计划 (MSP) 的不列颠哥伦比亚省居民，并以收入同意登记一次。",
      ),
      tri(
        "Your deductible and family maximum are set by your family net income from two years ago.",
        "你的自付額與家庭上限按兩年前的家庭淨收入釐定。",
        "你的自付额与家庭上限按两年前的家庭净收入厘定。",
      ),
    ],
    goodToKnow: [
      tri(
        "Families with the lowest incomes can have a $0 deductible and higher coverage.",
        "最低收入家庭可享 $0 自付額及更高保障。",
        "最低收入家庭可享 $0 自付额及更高保障。",
      ),
      tri(
        "If you do not register, your deductible defaults to $10,000 — registering is almost always worth it.",
        "如不登記，自付額預設為 $10,000 — 登記幾乎總是值得。",
        "如不登记，自付额默认为 $10,000 — 登记几乎总是值得。",
      ),
    ],
  },

  "msp-supplementary": {
    eligibilityDetails: [
      tri(
        "You qualify if your family income is low enough for MSP supplementary benefits (roughly under $42,000, adjusted for family size).",
        "如你的家庭收入低至符合 MSP 補充福利（約 $42,000 以下，按家庭人數調整）即合資格。",
        "如你的家庭收入低至符合 MSP 补充福利（约 $42,000 以下，按家庭人数调整）即合资格。",
      ),
    ],
    goodToKnow: [
      tri(
        "It pays a set amount per visit toward acupuncture, chiropractic, massage, naturopathy, physiotherapy, and podiatry (a limited number of visits per year).",
        "它按次支付針灸、脊醫、按摩、自然療法、物理治療及足病診療的固定金額（每年次數有限）。",
        "它按次支付针灸、脊医、按摩、自然疗法、物理治疗及足病诊疗的固定金额（每年次数有限）。",
      ),
    ],
  },

  safer: {
    eligibilityDetails: [
      tri(
        "You must be 60+, a BC resident who has lived in Canada 12 months, renting your home, and not receiving BC income or disability assistance.",
        "你須年滿 60 歲、為在加拿大居住 12 個月的卑詩省居民、租住居所，且沒有領取卑詩省收入或殘障援助。",
        "你须年满 60 岁、为在加拿大居住 12 个月的不列颠哥伦比亚省居民、租住居所，且没有领取不列颠哥伦比亚省收入或残障援助。",
      ),
      tri(
        "You must pay more than 30% of your gross monthly income on rent, and your income must be within the program limit.",
        "你的租金須超過每月總收入的 30%，且收入須在計劃上限之內。",
        "你的租金须超过每月总收入的 30%，且收入须在计划上限之内。",
      ),
    ],
    goodToKnow: [
      tri(
        "Payments start from the month a complete application is received, so apply early in the month.",
        "款項由收到完整申請的月份起計，故請於月初申請。",
        "款项由收到完整申请的月份起计，故请于月初申请。",
      ),
      tri(
        "You must reconfirm your details each year to keep receiving SAFER.",
        "你每年須重新確認資料以持續領取 SAFER。",
        "你每年须重新确认资料以持续领取 SAFER。",
      ),
    ],
  },

  rap: {
    eligibilityDetails: [
      tri(
        "You must be a working family with at least one dependent child, before-tax household income of $60,000 or less, and under $100,000 in assets.",
        "你須為有至少一名受養子女的在職家庭，稅前家庭收入 $60,000 或以下，資產低於 $100,000。",
        "你须为有至少一名受养子女的在职家庭，税前家庭收入 $60,000 或以下，资产低于 $100,000。",
      ),
      tri(
        "You must have lived in BC for 12 months, be renting, pay more than 30% of income on rent, and have some employment income.",
        "你須在卑詩省居住 12 個月、租住、租金超過收入 30%，並有部分工作收入。",
        "你须在不列颠哥伦比亚省居住 12 个月、租住、租金超过收入 30%，并有部分工作收入。",
      ),
    ],
    goodToKnow: [
      tri(
        "Eligibility was expanded in 2025 (income limit raised to $60,000), so more families now qualify.",
        "資格已於 2025 年放寬（收入上限升至 $60,000），更多家庭現符合資格。",
        "资格已于 2025 年放宽（收入上限升至 $60,000），更多家庭现符合资格。",
      ),
    ],
  },

  "bc-housing-registry": {
    eligibilityDetails: [
      tri(
        "One application places you on the waitlist for subsidized housing across many BC housing providers.",
        "一份申請即可登記於卑詩省多個房屋機構的資助房屋輪候名單。",
        "一份申请即可登记于不列颠哥伦比亚省多个房屋机构的资助房屋轮候名单。",
      ),
      tri(
        "Your household income must be within the Housing Income Limits for the unit size you need.",
        "你的家庭收入須在所需單位大小的房屋收入上限之內。",
        "你的家庭收入须在所需单位大小的房屋收入上限之内。",
      ),
    ],
    goodToKnow: [
      tri(
        "Waitlists can be long — register early and keep your application updated so you keep your place.",
        "輪候名單可能很長 — 盡早登記並保持申請更新，以保留排位。",
        "轮候名单可能很长 — 尽早登记并保持申请更新，以保留排位。",
      ),
    ],
  },

  "bc-homeowner-grant": {
    eligibilityDetails: [
      tri(
        "You must own and live in the home as your principal residence, and the assessed value must be at or below the yearly threshold ($2.075M for 2026).",
        "你須擁有並以該住所為主要居所，評估價值須不超過年度門檻（2026 年為 $2.075M）。",
        "你须拥有并以该住所为主要居所，评估价值须不超过年度门槛（2026 年为 $2.075M）。",
      ),
    ],
    goodToKnow: [
      tri(
        "You must apply every year — the grant is not automatic. Seniors (65+), veterans, and people with disabilities get a larger grant.",
        "你每年都須申請 — 此津貼並非自動。長者（65 歲以上）、退伍軍人及殘障人士可獲更高津貼。",
        "你每年都须申请 — 此津贴并非自动。长者（65 岁以上）、退伍军人及残障人士可获更高津贴。",
      ),
      tri(
        "Above the threshold the grant is reduced by $5 for every $1,000 of assessed value.",
        "超過門檻後，每 $1,000 評估價值減 $5 津貼。",
        "超过门槛后，每 $1,000 评估价值减 $5 津贴。",
      ),
    ],
  },

  "bc-seniors-supplement": {
    eligibilityDetails: [
      tri(
        "You automatically qualify if you are a BC resident receiving the federal Guaranteed Income Supplement (or the Allowance).",
        "如你是領取聯邦保證收入補助金（或津貼）的卑詩省居民，即自動符合資格。",
        "如你是领取联邦保证收入补助金（或津贴）的不列颠哥伦比亚省居民，即自动符合资格。",
      ),
    ],
    goodToKnow: [
      tri(
        "There is no application — it is added automatically to your monthly payment. Just keep filing taxes.",
        "無需申請 — 會自動加入你的每月款項。只需持續報稅。",
        "无需申请 — 会自动加入你的每月款项。只需持续报税。",
      ),
    ],
  },

  "bc-family-benefit": {
    eligibilityDetails: [
      tri(
        "You qualify if you receive the Canada Child Benefit and are a BC resident — there is no separate application.",
        "如你領取加拿大兒童福利且為卑詩省居民即合資格 — 無需另行申請。",
        "如你领取加拿大儿童福利且为不列颠哥伦比亚省居民即合资格 — 无需另行申请。",
      ),
    ],
    goodToKnow: [
      tri(
        "Single parents receive an extra amount of up to $500/year.",
        "單親父母可額外獲得最多每年 $500。",
        "单亲父母可额外获得最多每年 $500。",
      ),
      tri(
        "It is paid together with the Canada Child Benefit each month, based on your tax return.",
        "它按你的報稅表，每月與加拿大兒童福利一併發放。",
        "它按你的报税表，每月与加拿大儿童福利一并发放。",
      ),
    ],
  },

  "bc-bus-pass": {
    eligibilityDetails: [
      tri(
        "You qualify if you receive BC disability or income assistance, or are a low-income senior receiving OAS and GIS (or 60+ on assistance).",
        "如你領取卑詩省殘障或收入援助，或為領取 OAS 及 GIS 的低收入長者（或 60 歲以上領取援助）即合資格。",
        "如你领取不列颠哥伦比亚省残障或收入援助，或为领取 OAS 及 GIS 的低收入长者（或 60 岁以上领取援助）即合资格。",
      ),
    ],
    goodToKnow: [
      tri(
        "The annual fee is $45 and covers unlimited transit for the calendar year.",
        "年費 $45，全年可無限次乘搭公共交通。",
        "年费 $45，全年可无限次乘搭公共交通。",
      ),
    ],
  },

  "workbc-at": {
    eligibilityDetails: [
      tri(
        "You qualify if you are a BC resident with a disability or health condition that affects your ability to get or keep a job.",
        "如你是有殘障或健康狀況、影響找到或保住工作的卑詩省居民即合資格。",
        "如你是有残障或健康状况、影响找到或保住工作的不列颠哥伦比亚省居民即合资格。",
      ),
    ],
    goodToKnow: [
      tri(
        "It can fund assistive devices, software, ergonomic equipment, and workplace changes after an assessment.",
        "評估後可資助輔助器材、軟件、人體工學設備及工作間改動。",
        "评估后可资助辅助器材、软件、人体工学设备及工作间改动。",
      ),
    ],
  },

  fhsa: {
    eligibilityDetails: [
      tri(
        "You must be a Canadian resident aged 18 to 71 and a first-time home buyer (you have not lived in a home you owned this year or the past 4 years).",
        "你須為 18 至 71 歲的加拿大居民及首次置業者（本年及過去 4 年沒有自住擁有的住所）。",
        "你须为 18 至 71 岁的加拿大居民及首次置业者（本年及过去 4 年没有自住拥有的住所）。",
      ),
      tri(
        "You can hold an FHSA for up to 15 years or until age 71.",
        "FHSA 最長可持有 15 年或至 71 歲。",
        "FHSA 最长可持有 15 年或至 71 岁。",
      ),
    ],
    goodToKnow: [
      tri(
        "You can combine the FHSA with the RRSP Home Buyers' Plan for the same purchase.",
        "同一筆置業可同時使用 FHSA 及 RRSP 置業計劃。",
        "同一笔置业可同时使用 FHSA 及 RRSP 置业计划。",
      ),
      tri(
        "Unused contribution room carries forward, up to $8,000 extra.",
        "未用的供款額度可結轉，最多額外 $8,000。",
        "未用的供款额度可结转，最多额外 $8,000。",
      ),
    ],
  },

  "home-buyers-amount": {
    eligibilityDetails: [
      tri(
        "You (or your spouse) bought a qualifying home and did not live in another home you owned in the year of purchase or the previous 4 years.",
        "你（或配偶）購買了合資格住所，且在購買當年及之前 4 年沒有自住其他擁有的住所。",
        "你（或配偶）购买了合资格住所，且在购买当年及之前 4 年没有自住其他拥有的住所。",
      ),
      tri(
        "People eligible for the Disability Tax Credit can claim it without being a first-time buyer.",
        "符合殘疾稅務抵免的人士無需是首次置業者亦可申索。",
        "符合残疾税务抵免的人士无需是首次置业者亦可申索。",
      ),
    ],
    goodToKnow: [
      tri(
        "The $10,000 credit can be split between you and your spouse, but the combined claim cannot exceed $10,000.",
        "$10,000 抵免可與配偶分攤，但合計不可超過 $10,000。",
        "$10,000 抵免可与配偶分摊，但合计不可超过 $10,000。",
      ),
    ],
  },

  "multigen-reno": {
    eligibilityDetails: [
      tri(
        "The renovation must create a self-contained secondary unit for a related senior (65+) or an adult eligible for the Disability Tax Credit.",
        "裝修須為相關長者（65 歲以上）或符合殘疾稅務抵免的成人建造獨立第二單位。",
        "装修须为相关长者（65 岁以上）或符合残疾税务抵免的成人建造独立第二单位。",
      ),
      tri(
        "The unit needs its own entrance, kitchen, bathroom, and sleeping area.",
        "該單位須有獨立入口、廚房、浴室及睡眠空間。",
        "该单位须有独立入口、厨房、浴室及睡眠空间。",
      ),
    ],
    goodToKnow: [
      tri(
        "It is refundable — you get up to $7,500 back even if you owe no tax.",
        "可退還 — 即使無稅可繳也可退回最多 $7,500。",
        "可退还 — 即使无税可缴也可退回最多 $7,500。",
      ),
    ],
  },

  "canada-learning-bond": {
    eligibilityDetails: [
      tri(
        "The child must be born in 2004 or later, be a Canadian resident, and be from a lower-income family (adjusted income roughly under $57,000).",
        "子女須於 2004 年或之後出生、為加拿大居民，並來自較低收入家庭（經調整收入約 $57,000 以下）。",
        "子女须于 2004 年或之后出生、为加拿大居民，并来自较低收入家庭（经调整收入约 $57,000 以下）。",
      ),
      tri(
        "You need an RESP and Social Insurance Numbers for you and your child.",
        "你需要 RESP，以及你和子女的社會保險號碼。",
        "你需要 RESP，以及你和子女的社会保险号码。",
      ),
    ],
    goodToKnow: [
      tri(
        "You can claim back-dated bond amounts for every past year the child was eligible, up to age 18.",
        "可為子女過往每個合資格年度追溯申領債券，最多至 18 歲。",
        "可为子女过往每个合资格年度追溯申领债券，最多至 18 岁。",
      ),
      tri(
        "Some providers offer no-fee, no-minimum RESPs designed for the bond.",
        "部分機構提供專為債券而設、免費且無最低要求的 RESP。",
        "部分机构提供专为债券而设、免费且无最低要求的 RESP。",
      ),
    ],
  },

  "canada-training-credit": {
    eligibilityDetails: [
      tri(
        "You accumulate $250 of room each year from age 26 to 65 if you have working income and file taxes.",
        "如你有工作收入並報稅，26 至 65 歲每年累積 $250 額度。",
        "如你有工作收入并报税，26 至 65 岁每年累积 $250 额度。",
      ),
      tri(
        "When you pay eligible tuition, you can claim up to half of it, limited by your accumulated room.",
        "當你支付合資格學費時，可申索最多一半，以累積額度為限。",
        "当你支付合资格学费时，可申索最多一半，以累积额度为限。",
      ),
    ],
    goodToKnow: [
      tri(
        "It is refundable and separate from the regular tuition tax credit — you can use both.",
        "它可退還，且與一般學費稅務抵免分開 — 兩者可同時使用。",
        "它可退还，且与一般学费税务抵免分开 — 两者可同时使用。",
      ),
    ],
  },

  "bc-access-grant": {
    eligibilityDetails: [
      tri(
        "You must be a BC resident (citizen, PR, or protected person) studying at a BC public post-secondary school, from a low- or middle-income family.",
        "你須為卑詩省居民（公民、永久居民或受保護人士），就讀卑詩省公立專上院校，並來自低至中等收入家庭。",
        "你须为不列颠哥伦比亚省居民（公民、永久居民或受保护人士），就读不列颠哥伦比亚省公立专上院校，并来自低至中等收入家庭。",
      ),
      tri(
        "You are assessed automatically when you apply for StudentAid BC — no separate application.",
        "申請 StudentAid BC 時會自動評估 — 無需另行申請。",
        "申请 StudentAid BC 时会自动评估 — 无需另行申请。",
      ),
    ],
    goodToKnow: [
      tri(
        "It is a grant, not a loan — you never repay it.",
        "這是助學金而非貸款 — 無需償還。",
        "这是助学金而非贷款 — 无需偿还。",
      ),
    ],
  },

  "bc-affordable-child-care": {
    eligibilityDetails: [
      tri(
        "Your family income is generally $111,000 or less (higher for larger families), and you use an eligible child care provider.",
        "你的家庭收入一般為 $111,000 或以下（家庭人數較多則較高），並使用合資格託管機構。",
        "你的家庭收入一般为 $111,000 或以下（家庭人数较多则较高），并使用合资格托管机构。",
      ),
      tri(
        "There must be a reason for care, such as working, studying, looking for work, or a medical condition.",
        "須有託管理由，例如工作、進修、求職或健康狀況。",
        "须有托管理由，例如工作、进修、求职或健康状况。",
      ),
    ],
    goodToKnow: [
      tri(
        "Families earning about $45,000 or less usually get the maximum. It often stacks with the Child Care Fee Reduction at participating providers.",
        "收入約 $45,000 或以下的家庭通常獲最高金額。在參與機構常可與託兒費減免疊加。",
        "收入约 $45,000 或以下的家庭通常获最高金额。在参与机构常可与托儿费减免叠加。",
      ),
    ],
  },

  "ontario-trillium": {
    eligibilityDetails: [
      tri(
        "You must be an Ontario resident who pays rent or property tax, or has home energy costs, and files a tax return.",
        "你須為繳付租金或物業稅、或有家居能源費用並報稅的安大略居民。",
        "你须为缴付租金或物业税、或有家居能源费用并报税的安大略居民。",
      ),
      tri(
        "It combines the Energy and Property Tax Credit, the Sales Tax Credit, and (in the north) the Northern Ontario Energy Credit.",
        "它結合能源及物業稅抵免、銷售稅抵免，以及（北部）安大略北部能源抵免。",
        "它结合能源及物业税抵免、销售税抵免，以及（北部）安大略北部能源抵免。",
      ),
    ],
    goodToKnow: [
      tri(
        "Complete the ON-BEN form with your tax return — many people miss it and lose the credit.",
        "隨報稅填寫 ON-BEN 表格 — 很多人遺漏而失去抵免。",
        "随报税填写 ON-BEN 表格 — 很多人遗漏而失去抵免。",
      ),
      tri(
        "If your benefit is over $360, you can choose a single yearly payment instead of monthly.",
        "如你的福利超過 $360，可選擇一次性年度發放而非每月。",
        "如你的福利超过 $360，可选择一次性年度发放而非每月。",
      ),
    ],
  },

  "ontario-works": {
    eligibilityDetails: [
      tri(
        "You must live in Ontario, be in financial need, and be willing to take part in activities to find work.",
        "你須居於安大略、有經濟需要，並願意參與求職活動。",
        "你须居于安大略、有经济需要，并愿意参与求职活动。",
      ),
      tri(
        "Both your income and your assets are considered.",
        "你的收入及資產都會被考慮。",
        "你的收入及资产都会被考虑。",
      ),
    ],
    goodToKnow: [
      tri(
        "It also provides health benefits, including drug and dental coverage, and help with employment.",
        "它亦提供健康福利（包括藥物及牙科保障）及就業協助。",
        "它亦提供健康福利（包括药物及牙科保障）及就业协助。",
      ),
    ],
  },

  odsp: {
    eligibilityDetails: [
      tri(
        "You must be 18+, an Ontario resident in financial need, and have a substantial physical or mental impairment expected to last a year or more.",
        "你須年滿 18 歲、為有經濟需要的安大略居民，並有預期持續一年或以上的嚴重身體或精神障礙。",
        "你须年满 18 岁、为有经济需要的安大略居民，并有预期持续一年或以上的严重身体或精神障碍。",
      ),
      tri(
        "Financial eligibility is checked first, then a Disability Determination confirms the disability.",
        "先審核經濟資格，再由殘障評定確認殘障。",
        "先审核经济资格，再由残障评定确认残障。",
      ),
    ],
    goodToKnow: [
      tri(
        "ODSP includes drug, dental, and vision coverage, and you can keep more of your earnings than on Ontario Works.",
        "ODSP 包括藥物、牙科及視力保障，且可比安大略工作援助保留更多工作收入。",
        "ODSP 包括药物、牙科及视力保障，且可比安大略工作援助保留更多工作收入。",
      ),
      tri(
        "People approved for ODSP are often also eligible for the federal Disability Tax Credit.",
        "獲批 ODSP 的人士通常亦符合聯邦殘疾稅務抵免資格。",
        "获批 ODSP 的人士通常亦符合联邦残疾税务抵免资格。",
      ),
    ],
  },

  "ontario-child-benefit": {
    eligibilityDetails: [
      tri(
        "You must receive the Canada Child Benefit, live in Ontario, and file your taxes each year.",
        "你須領取加拿大兒童福利、居於安大略，並每年報稅。",
        "你须领取加拿大儿童福利、居于安大略，并每年报税。",
      ),
    ],
    goodToKnow: [
      tri(
        "There is no separate application — it is paid together with the Canada Child Benefit.",
        "無需另行申請 — 與加拿大兒童福利一併發放。",
        "无需另行申请 — 与加拿大儿童福利一并发放。",
      ),
    ],
  },

  "ontario-gains": {
    eligibilityDetails: [
      tri(
        "You qualify if you are 65+, live in Ontario, and receive the federal Guaranteed Income Supplement.",
        "如你 65 歲以上、居於安大略並領取聯邦保證收入補助金即合資格。",
        "如你 65 岁以上、居于安大略并领取联邦保证收入补助金即合资格。",
      ),
    ],
    goodToKnow: [
      tri(
        "For most people it is automatic once you receive GIS and file your Ontario taxes.",
        "對大多數人而言，一旦領取 GIS 並在安大略報稅便自動發放。",
        "对大多数人而言，一旦领取 GIS 并在安大略报税便自动发放。",
      ),
    ],
  },

  "ontario-drug-benefit": {
    eligibilityDetails: [
      tri(
        "Everyone 65+ is covered automatically the month after turning 65 (Ontario Drug Benefit).",
        "所有 65 歲以上人士在 65 歲後翌月自動獲保障（安大略藥物福利）。",
        "所有 65 岁以上人士在 65 岁后翌月自动获保障（安大略药物福利）。",
      ),
      tri(
        "Under 65 without private insurance, the Trillium Drug Program helps when drug costs are high relative to income.",
        "65 歲以下且無私人保險者，藥費相對收入偏高時可由延齡草藥物計劃協助。",
        "65 岁以下且无私人保险者，药费相对收入偏高时可由延龄草药物计划协助。",
      ),
    ],
    goodToKnow: [
      tri(
        "Low-income seniors can join the Seniors Co-Payment Program to remove the deductible and lower the co-pay.",
        "低收入長者可加入長者共付計劃，免除自付額並降低共付。",
        "低收入长者可加入长者共付计划，免除自付额并降低共付。",
      ),
    ],
  },

  "ontario-senior-homeowner-grant": {
    eligibilityDetails: [
      tri(
        "You must be 64+ by year end, own and live in your Ontario home, and have income under $50,000 (single) or $60,000 (couple).",
        "你須在年底年滿 64 歲、擁有並居於安大略住所，收入低於 $50,000（單身）或 $60,000（夫婦）。",
        "你须在年底年满 64 岁、拥有并居于安大略住所，收入低于 $50,000（单身）或 $60,000（夫妇）。",
      ),
    ],
    goodToKnow: [
      tri(
        "Apply on your tax return each year — the grant is not automatic.",
        "每年於報稅表申請 — 此津貼並非自動。",
        "每年于报税表申请 — 此津贴并非自动。",
      ),
    ],
  },

  aish: {
    eligibilityDetails: [
      tri(
        "You must be 18-64, an Alberta resident, not yet eligible for OAS, and have a severe disability that permanently prevents you from working.",
        "你須為 18 至 64 歲的亞伯達居民、尚未符合 OAS 資格，並有永久且完全無法工作的嚴重殘障。",
        "你须为 18 至 64 岁的阿尔伯塔居民、尚未符合 OAS 资格，并有永久且完全无法工作的严重残障。",
      ),
      tri(
        "Your income and assets (generally under $100,000, with exemptions) are assessed, including a partner's.",
        "你的收入及資產（一般低於 $100,000，有豁免）會被評估，包括伴侶的。",
        "你的收入及资产（一般低于 $100,000，有豁免）会被评估，包括伴侣的。",
      ),
    ],
    goodToKnow: [
      tri(
        "AISH includes a health benefits card (drugs, dental, optical) and can be combined with the federal DTC and Canada Disability Benefit.",
        "AISH 包括健康福利卡（藥物、牙科、視光），並可與聯邦 DTC 及加拿大殘障福利並用。",
        "AISH 包括健康福利卡（药物、牙科、视光），并可与联邦 DTC 及加拿大残障福利并用。",
      ),
    ],
  },

  "alberta-seniors-benefit": {
    eligibilityDetails: [
      tri(
        "You must be 65+, have lived in Alberta 3+ months, be a citizen or PR, and receive the Old Age Security pension.",
        "你須年滿 65 歲、在亞伯達居住滿 3 個月、為公民或永久居民，並領取老年保障金。",
        "你须年满 65 岁、在阿尔伯塔居住满 3 个月、为公民或永久居民，并领取老年保障金。",
      ),
    ],
    goodToKnow: [
      tri(
        "Apply once through Seniors Financial Assistance — after that it renews from your tax return each year.",
        "透過長者財政援助申請一次 — 之後每年按報稅資料自動續期。",
        "通过长者财政援助申请一次 — 之后每年按报税资料自动续期。",
      ),
    ],
  },

  acfb: {
    eligibilityDetails: [
      tri(
        "You qualify if you are an Alberta resident with a child under 18 and file your taxes; the amount depends on income and number of children.",
        "如你是有 18 歲以下子女的亞伯達居民並報稅即合資格；金額視乎收入及子女數目。",
        "如你是有 18 岁以下子女的阿尔伯塔居民并报税即合资格；金额视乎收入及子女数目。",
      ),
      tri(
        "A working-income component adds more for families with employment income over about $2,760.",
        "工作收入超過約 $2,760 的家庭可獲額外工作收入部分。",
        "工作收入超过约 $2,760 的家庭可获额外工作收入部分。",
      ),
    ],
    goodToKnow: [
      tri(
        "No separate application — it is paid quarterly with the Canada Child Benefit.",
        "無需另行申請 — 每季與加拿大兒童福利一併發放。",
        "无需另行申请 — 每季与加拿大儿童福利一并发放。",
      ),
    ],
  },

  "alberta-income-support": {
    eligibilityDetails: [
      tri(
        "You must be an Alberta resident without enough income or assets to meet your basic needs, and willing to look for work if able.",
        "你須為亞伯達居民、收入或資產不足以滿足基本需要，並在有能力時願意求職。",
        "你须为阿尔伯塔居民、收入或资产不足以满足基本需要，并在有能力时愿意求职。",
      ),
    ],
    goodToKnow: [
      tri(
        "It includes a health benefits card and help with employment and training.",
        "它包括健康福利卡及就業與培訓協助。",
        "它包括健康福利卡及就业与培训协助。",
      ),
    ],
  },

  "alberta-adult-health-benefit": {
    eligibilityDetails: [
      tri(
        "You qualify if your household income is under the program limits — it is aimed at low-income adults and families, including those leaving Income Support or AISH for work.",
        "如你的家庭收入低於計劃上限即合資格 — 面向低收入成人及家庭，包括因就業而離開收入援助或 AISH 的人士。",
        "如你的家庭收入低于计划上限即合资格 — 面向低收入成人及家庭，包括因就业而离开收入援助或 AISH 的人士。",
      ),
    ],
    goodToKnow: [
      tri(
        "It covers prescription drugs, dental, optical, diabetic supplies, and emergency ambulance.",
        "它涵蓋處方藥、牙科、視光、糖尿病用品及緊急救護車。",
        "它涵盖处方药、牙科、视光、糖尿病用品及紧急救护车。",
      ),
    ],
  },

  "manitoba-child-benefit": {
    eligibilityDetails: [
      tri(
        "You must be a Manitoba resident, receive the Canada Child Benefit, and have a lower income (full benefit at or under about $15,000).",
        "你須為緬尼托巴居民、領取加拿大兒童福利，並屬較低收入（約 $15,000 或以下可獲全額）。",
        "你须为曼尼托巴居民、领取加拿大儿童福利，并属较低收入（约 $15,000 或以下可获全额）。",
      ),
    ],
    goodToKnow: [
      tri(
        "A partial benefit is paid up to about $25,864 depending on the number of children. There is also a benefit for the cost of children's eyeglasses.",
        "按子女數目，收入約 $25,864 以下可獲部分福利。另有子女眼鏡費用福利。",
        "按子女数目，收入约 $25,864 以下可获部分福利。另有子女眼镜费用福利。",
      ),
    ],
  },

  "manitoba-rent-assist": {
    eligibilityDetails: [
      tri(
        "You must rent in the private market and have a low income. The benefit fills the gap between 80% of median market rent and 30% of your net income.",
        "你須在私人市場租住且收入低。援助填補市場租金中位數 80% 與你淨收入 30% 之間的差額。",
        "你须在私人市场租住且收入低。援助填补市场租金中位数 80% 与你净收入 30% 之间的差额。",
      ),
    ],
    goodToKnow: [
      tri(
        "If you receive Employment and Income Assistance, Rent Assist is included automatically.",
        "如你領取就業及收入援助，租金援助會自動包括。",
        "如你领取就业及收入援助，租金援助会自动包括。",
      ),
    ],
  },

  "manitoba-55-plus": {
    eligibilityDetails: [
      tri(
        "You must be 55+, a Manitoba resident, with income within the program limits (based on last year's tax return).",
        "你須年滿 55 歲、為緬尼托巴居民，收入在計劃上限內（按去年報稅表）。",
        "你须年满 55 岁、为曼尼托巴居民，收入在计划上限内（按去年报税表）。",
      ),
    ],
    goodToKnow: [
      tri(
        "You cannot receive 55 PLUS at the same time as full Employment and Income Assistance.",
        "你不能同時領取 55 PLUS 及全額就業及收入援助。",
        "你不能同时领取 55 PLUS 及全额就业及收入援助。",
      ),
    ],
  },

  "manitoba-eia": {
    eligibilityDetails: [
      tri(
        "You must be a Manitoba resident without enough income or assets for basic needs. There is a separate, higher rate category for people with a disability.",
        "你須為緬尼托巴居民、收入或資產不足以應付基本需要。殘障人士有獨立且較高的標準。",
        "你须为曼尼托巴居民、收入或资产不足以应付基本需要。残障人士有独立且较高的标准。",
      ),
    ],
    goodToKnow: [
      tri(
        "EIA includes health benefits and the Rent Assist shelter benefit.",
        "EIA 包括健康福利及租金援助住屋福利。",
        "EIA 包括健康福利及租金援助住房福利。",
      ),
    ],
  },

  "manitoba-pharmacare": {
    eligibilityDetails: [
      tri(
        "Any Manitoban with Manitoba Health coverage can register. Your deductible is a percentage of your family income, so lower incomes pay less.",
        "任何有緬尼托巴健康保障的居民均可登記。自付額為家庭收入的百分比，收入越低付得越少。",
        "任何有曼尼托巴健康保障的居民均可登记。自付额为家庭收入的百分比，收入越低付得越少。",
      ),
    ],
    goodToKnow: [
      tri(
        "Register each benefit year (April) to have your deductible tracked from your first purchase.",
        "每個福利年度（4 月）登記，讓自付額由首次購藥起計算。",
        "每个福利年度（4 月）登记，让自付额由首次购药起计算。",
      ),
    ],
  },

  said: {
    eligibilityDetails: [
      tri(
        "You must be 18+, a Saskatchewan resident, and have a significant and enduring disability confirmed by a disability impact assessment.",
        "你須年滿 18 歲、為薩斯喀徹溫居民，並有經殘障影響評估確認的重大且持久殘障。",
        "你须年满 18 岁、为萨斯喀彻温居民，并有经残障影响评估确认的重大且持久残障。",
      ),
    ],
    goodToKnow: [
      tri(
        "SAID lets you keep more of your employment earnings than general income support, and includes health benefits.",
        "SAID 讓你比一般收入援助保留更多工作收入，並附健康福利。",
        "SAID 让你比一般收入援助保留更多工作收入，并附健康福利。",
      ),
    ],
  },

  sis: {
    eligibilityDetails: [
      tri(
        "You must be a Saskatchewan resident in financial need, without enough income or assets to meet basic needs.",
        "你須為有經濟需要的薩斯喀徹溫居民，收入或資產不足以應付基本需要。",
        "你须为有经济需要的萨斯喀彻温居民，收入或资产不足以应付基本需要。",
      ),
    ],
    goodToKnow: [
      tri(
        "SIS pays a set shelter and basic amount; you manage the payments and pay your own landlord and utilities.",
        "SIS 支付固定的住屋及基本金額；你自行管理款項並支付房東及水電。",
        "SIS 支付固定的住房及基本金额；你自行管理款项并支付房东及水电。",
      ),
    ],
  },

  slitc: {
    eligibilityDetails: [
      tri(
        "You must be a Saskatchewan resident and file a tax return; the credit is calculated automatically from your income and family size.",
        "你須為薩斯喀徹溫居民並報稅；抵免按你的收入及家庭人數自動計算。",
        "你须为萨斯喀彻温居民并报税；抵免按你的收入及家庭人数自动计算。",
      ),
    ],
    goodToKnow: [
      tri(
        "It is paid together with the federal GST/HST credit — no separate application.",
        "它與聯邦 GST/HST 抵免一併發放 — 無需另行申請。",
        "它与联邦 GST/HST 抵免一并发放 — 无需另行申请。",
      ),
    ],
  },

  sip: {
    eligibilityDetails: [
      tri(
        "You qualify if you are 65+, a Saskatchewan resident, and receive the federal Guaranteed Income Supplement.",
        "如你 65 歲以上、為薩斯喀徹溫居民並領取聯邦保證收入補助金即合資格。",
        "如你 65 岁以上、为萨斯喀彻温居民并领取联邦保证收入补助金即合资格。",
      ),
    ],
    goodToKnow: [
      tri(
        "Your SIP amount moves with your GIS — the maximum GIS gives the maximum SIP.",
        "SIP 金額隨 GIS 變動 — 最高 GIS 即最高 SIP。",
        "SIP 金额随 GIS 变动 — 最高 GIS 即最高 SIP。",
      ),
    ],
  },

  "ns-child-benefit": {
    eligibilityDetails: [
      tri(
        "You must be a Nova Scotia resident receiving the Canada Child Benefit, with family income under $34,000 (full benefit under $26,000).",
        "你須為領取加拿大兒童福利的新斯科舍居民，家庭收入低於 $34,000（$26,000 以下獲全額）。",
        "你须为领取加拿大儿童福利的新斯科舍居民，家庭收入低于 $34,000（$26,000 以下获全额）。",
      ),
    ],
    goodToKnow: [
      tri(
        "It is paid automatically with the Canada Child Benefit — just keep filing your taxes.",
        "它與加拿大兒童福利一併自動發放 — 只需持續報稅。",
        "它与加拿大儿童福利一并自动发放 — 只需持续报税。",
      ),
    ],
  },
  "ns-affordable-living": {
    eligibilityDetails: [
      tri(
        "Any Nova Scotia resident who files taxes with a modest income qualifies; the credit reduces above $30,000 of family income.",
        "任何報稅且收入不高的新斯科舍居民即合資格；家庭收入超過 $30,000 後遞減。",
        "任何报税且收入不高的新斯科舍居民即合资格；家庭收入超过 $30,000 后递减。",
      ),
    ],
    goodToKnow: [
      tri(
        "No application — it is paid with the federal GST/HST credit.",
        "無需申請 — 與聯邦 GST/HST 抵免一併發放。",
        "无需申请 — 与联邦 GST/HST 抵免一并发放。",
      ),
    ],
  },
  "ns-income-assistance": {
    eligibilityDetails: [
      tri(
        "You must be a Nova Scotia resident in financial need. A disability supplement is available for people with a disability.",
        "你須為有經濟需要的新斯科舍居民。殘障人士可獲殘障補助。",
        "你须为有经济需要的新斯科舍居民。残障人士可获残障补助。",
      ),
    ],
    goodToKnow: [
      tri(
        "It includes a Pharmacare card and other health benefits.",
        "它包括藥物保障卡及其他健康福利。",
        "它包括药物保障卡及其他健康福利。",
      ),
    ],
  },
  "ns-disability-support": {
    eligibilityDetails: [
      tri(
        "For Nova Scotians with a disability who need support with daily living, housing, or community participation.",
        "適用於在日常生活、住屋或社區參與上需要支援的新斯科舍殘障人士。",
        "适用于在日常生活、住房或社区参与上需要支援的新斯科舍残障人士。",
      ),
    ],
    goodToKnow: [
      tri(
        "It offers several residential and community options, not only income support.",
        "它提供多種居住及社區選項，不只是收入支援。",
        "它提供多种居住及社区选项，不只是收入支援。",
      ),
    ],
  },

  "nb-seniors-benefit": {
    eligibilityDetails: [
      tri(
        "You qualify if you were a New Brunswick resident on Dec 31 and receive the federal GIS, Allowance, or Allowance for the Survivor.",
        "如你在 12 月 31 日為新不倫瑞克居民並領取聯邦 GIS、津貼或遺屬津貼即合資格。",
        "如你在 12 月 31 日为新不伦瑞克居民并领取联邦 GIS、津贴或遗属津贴即合资格。",
      ),
    ],
    goodToKnow: [
      tri(
        "You must reapply each year during the application period.",
        "你每年須在申請期內重新申請。",
        "你每年须在申请期内重新申请。",
      ),
    ],
  },
  "nb-social-assistance": {
    eligibilityDetails: [
      tri(
        "The Transitional Assistance Program is for general need; the Extended Benefits Program is for people with a long-term disability.",
        "過渡援助計劃適用於一般需要；延伸福利計劃適用於長期殘障人士。",
        "过渡援助计划适用于一般需要；延伸福利计划适用于长期残障人士。",
      ),
    ],
    goodToKnow: [
      tri(
        "It includes a health card and prescription drug coverage.",
        "它包括健康卡及處方藥保障。",
        "它包括健康卡及处方药保障。",
      ),
    ],
  },
  "nb-child-tax-benefit": {
    eligibilityDetails: [
      tri(
        "You must be a New Brunswick resident receiving the Canada Child Benefit, with a low family income.",
        "你須為領取加拿大兒童福利、家庭收入低的新不倫瑞克居民。",
        "你须为领取加拿大儿童福利、家庭收入低的新不伦瑞克居民。",
      ),
    ],
    goodToKnow: [
      tri(
        "It is paid automatically with the Canada Child Benefit.",
        "它與加拿大兒童福利一併自動發放。",
        "它与加拿大儿童福利一并自动发放。",
      ),
    ],
  },

  "pei-sales-tax-credit": {
    eligibilityDetails: [
      tri(
        "Any Island resident who files taxes with a low or modest income qualifies.",
        "任何報稅且收入低或中等的愛德華王子島居民即合資格。",
        "任何报税且收入低或中等的爱德华王子岛居民即合资格。",
      ),
    ],
    goodToKnow: [
      tri(
        "No application — it is paid with the federal GST/HST credit. It becomes the PEI Essentials Benefit in late 2026.",
        "無需申請 — 與聯邦 GST/HST 抵免一併發放。2026 年底改為愛德華王子島必需品福利。",
        "无需申请 — 与联邦 GST/HST 抵免一并发放。2026 年底改为爱德华王子岛必需品福利。",
      ),
    ],
  },
  "pei-child-benefit": {
    eligibilityDetails: [
      tri(
        "You must be a PEI resident receiving the Canada Child Benefit, with family income of $80,000 or less.",
        "你須為領取加拿大兒童福利、家庭收入 $80,000 或以下的愛德華王子島居民。",
        "你须为领取加拿大儿童福利、家庭收入 $80,000 或以下的爱德华王子岛居民。",
      ),
    ],
    goodToKnow: [
      tri(
        "This benefit began in 2025 and is paid automatically with the Canada Child Benefit.",
        "此福利於 2025 年開始，與加拿大兒童福利一併自動發放。",
        "此福利于 2025 年开始，与加拿大儿童福利一并自动发放。",
      ),
    ],
  },
  "pei-social-assistance": {
    eligibilityDetails: [
      tri(
        "For Islanders without enough income or assets to meet basic needs.",
        "適用於收入或資產不足以應付基本需要的愛德華王子島居民。",
        "适用于收入或资产不足以应付基本需要的爱德华王子岛居民。",
      ),
    ],
    goodToKnow: [
      tri(
        "It includes health benefits and help returning to work.",
        "它包括健康福利及重投工作的協助。",
        "它包括健康福利及重投工作的帮助。",
      ),
    ],
  },
  "pei-accessability": {
    eligibilityDetails: [
      tri(
        "For Islanders with a disability who need an assured income or disability-related supports.",
        "適用於需要保障收入或殘障相關支援的愛德華王子島殘障人士。",
        "适用于需要保障收入或残障相关支援的爱德华王子岛残障人士。",
      ),
    ],
    goodToKnow: [
      tri(
        "Supports are tailored through an assessment of your needs.",
        "支援會透過需要評估度身訂造。",
        "支援会通过需要评估度身订造。",
      ),
    ],
  },

  "nl-child-benefit": {
    eligibilityDetails: [
      tri(
        "You must be a NL resident receiving the Canada Child Benefit, with family income under about $28,990.",
        "你須為領取加拿大兒童福利、家庭收入約 $28,990 以下的紐芬蘭與拉布拉多居民。",
        "你须为领取加拿大儿童福利、家庭收入约 $28,990 以下的纽芬兰与拉布拉多居民。",
      ),
    ],
    goodToKnow: [
      tri(
        "Amounts rose sharply in 2025 and include a Mother Baby Nutrition Supplement for young children.",
        "金額於 2025 年大幅上升，並包括為幼兒而設的母嬰營養補助。",
        "金额于 2025 年大幅上升，并包括为幼儿而设的母婴营养补助。",
      ),
    ],
  },
  "nl-income-support": {
    eligibilityDetails: [
      tri(
        "For NL residents without enough income or assets to meet basic needs; each adult receives an individual benefit amount.",
        "適用於收入或資產不足以應付基本需要的紐芬蘭與拉布拉多居民；每名成人獲個人福利金額。",
        "适用于收入或资产不足以应付基本需要的纽芬兰与拉布拉多居民；每名成人获个人福利金额。",
      ),
    ],
    goodToKnow: [
      tri(
        "It includes drug coverage and other health benefits.",
        "它包括藥物保障及其他健康福利。",
        "它包括药物保障及其他健康福利。",
      ),
    ],
  },
  "nl-disability-benefit": {
    eligibilityDetails: [
      tri(
        "You must be approved for the federal Disability Tax Credit and have a lower income. It started in July 2025.",
        "你須已獲批聯邦殘疾稅務抵免且收入較低。2025 年 7 月起實施。",
        "你须已获批联邦残疾税务抵免且收入较低。2025 年 7 月起实施。",
      ),
    ],
    goodToKnow: [
      tri(
        "It stacks with the federal Canada Disability Benefit — together up to $600/month.",
        "它可與聯邦加拿大殘障福利疊加 — 合共最多每月 $600。",
        "它可与联邦加拿大残障福利叠加 — 合共最多每月 $600。",
      ),
    ],
  },
  "nl-seniors-benefit": {
    eligibilityDetails: [
      tri(
        "For NL seniors (65+) with family income under about $30,078 for the full amount.",
        "適用於家庭收入約 $30,078 以下、可獲全額的紐芬蘭與拉布拉多長者（65 歲以上）。",
        "适用于家庭收入约 $30,078 以下、可获全额的纽芬兰与拉布拉多长者（65 岁以上）。",
      ),
    ],
    goodToKnow: [
      tri(
        "No application — it is paid automatically from your tax return.",
        "無需申請 — 按你的報稅表自動發放。",
        "无需申请 — 按你的报税表自动发放。",
      ),
    ],
  },
  "nl-income-supplement": {
    eligibilityDetails: [
      tri(
        "For low-income NL individuals, seniors, and families who file taxes.",
        "適用於報稅的紐芬蘭與拉布拉多低收入個人、長者及家庭。",
        "适用于报税的纽芬兰与拉布拉多低收入个人、长者及家庭。",
      ),
    ],
    goodToKnow: [
      tri(
        "No application — it is paid with the federal GST/HST credit each quarter.",
        "無需申請 — 每季與聯邦 GST/HST 抵免一併發放。",
        "无需申请 — 每季与联邦 GST/HST 抵免一并发放。",
      ),
    ],
  },
};
