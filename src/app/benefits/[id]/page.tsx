import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BENEFITS, getBenefit } from "@/data/benefits";
import { resolve } from "@/i18n/locale";
import { BenefitDetail } from "@/components/BenefitDetail";

export function generateStaticParams() {
  return BENEFITS.map((b) => ({ id: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const benefit = getBenefit(id);
  if (!benefit) return {};
  return {
    title: resolve(benefit.name, "en"),
    description: resolve(benefit.description, "en"),
  };
}

export default async function BenefitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const benefit = getBenefit(id);
  if (!benefit) notFound();

  const name = resolve(benefit.name, "en");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Browse benefits",
        item: "https://getmaplebenefits.ca/benefits",
      },
      {
        "@type": "ListItem",
        position: 2,
        name,
        item: `https://getmaplebenefits.ca/benefits/${benefit.id}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BenefitDetail id={id} />
    </>
  );
}
