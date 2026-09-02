/**
 * Central site configuration.
 *
 * To rename the app, change SITE_NAME here (or set NEXT_PUBLIC_SITE_NAME at
 * build time). No component hard-codes the app name — everything reads from
 * this file, so a rename is a one-line change.
 */

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "MapleBenefits";

export const SITE = {
  /** App name. Shown in header, footer, page titles, print header. */
  name: SITE_NAME,
  /** Short tagline used under the name on the landing hero. */
  tagline: {
    en: "Find the Canadian benefits you may be missing",
    "zh-Hant": "找出你可能錯過的加拿大福利",
    "zh-Hans": "找出你可能错过的加拿大福利",
  },
  /** Used in meta description / SEO. */
  description: {
    en: "Answer a few questions to see which federal and provincial benefits you may qualify for, what they're worth, and how to apply.",
    "zh-Hant":
      "回答幾條問題，即可看到你可能符合資格的聯邦及省級福利、金額估算，以及申請方法。",
    "zh-Hans":
      "回答几个问题，即可看到你可能符合资格的联邦及省级福利、金额估算，以及申请方法。",
  },
  /** Region covered in the MVP. */
  region: {
    en: "Federal + provinces",
    "zh-Hant": "聯邦 + 各省",
    "zh-Hans": "联邦 + 各省",
  },
  /** Number of benefits covered — keep in sync with the data registry. */
  benefitCount: 75,
  /** Contact / project links (optional). */
  githubUrl: "",
} as const;

export type SiteConfig = typeof SITE;
