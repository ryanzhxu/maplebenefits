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
    en: "A free, private tool that helps people in Canada discover government benefits they may be eligible for, estimate the value, and learn how to apply.",
    "zh-Hant":
      "免費且保護私隱的工具，協助加拿大居民發掘他們可能符合資格的政府福利、估算金額，並了解申請方法。",
    "zh-Hans":
      "免费且保护隐私的工具，帮助加拿大居民发现他们可能符合资格的政府福利、估算金额，并了解申请方法。",
  },
  /** Region covered in the MVP. */
  region: {
    en: "Federal · BC · Ontario",
    "zh-Hant": "聯邦 · 卑詩省 · 安大略省",
    "zh-Hans": "联邦 · 不列颠哥伦比亚省 · 安大略省",
  },
  /** Number of benefits covered — keep in sync with the data registry. */
  benefitCount: 43,
  /** Contact / project links (optional). */
  githubUrl: "",
} as const;

export type SiteConfig = typeof SITE;
