"use client";

import { useI18n } from "@/i18n/LocaleProvider";
import { SITE } from "@/config/site";
import { ACTIVE_BENEFITS, BENEFITS } from "@/data/benefits";

export default function AboutPage() {
  const { t } = useI18n();

  const sections = [
    { title: t("about.missionTitle"), body: t("about.missionBody") },
    { title: t("about.privacyTitle"), body: t("about.privacyBody") },
    { title: t("about.sourcesTitle"), body: t("about.sourcesBody") },
    { title: t("about.accuracyTitle"), body: t("about.accuracyBody") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        {t("about.title")}
      </h1>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
        <span className="rounded-full border border-line bg-surface px-3 py-1">
          {BENEFITS.length} {t("home.statBenefits")}
        </span>
        <span className="rounded-full border border-line bg-surface px-3 py-1">
          {ACTIVE_BENEFITS.length} active
        </span>
      </div>

      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-bold text-ink">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-[var(--radius-card)] border border-possible/30 bg-possible-soft p-5">
        <h2 className="text-lg font-bold text-possible">
          {t("about.disclaimerTitle")}
        </h2>
        <p className="mt-2 leading-relaxed text-ink">
          {t("about.disclaimerBody")}
        </p>
        <p className="mt-3 text-sm font-medium text-ink">
          {t("about.notAffiliated")}
        </p>
      </section>
    </div>
  );
}
