import type { MetadataRoute } from "next";
import { BENEFITS } from "@/data/benefits";

const BASE = "https://getmaplebenefits.ca";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/benefits", "/assess", "/about"].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date("2026-09-01"),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const benefitRoutes = BENEFITS.map((b) => ({
    url: `${BASE}/benefits/${b.id}`,
    lastModified: new Date(b.lastUpdated),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...benefitRoutes];
}
