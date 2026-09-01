"use client";

import Link from "next/link";
import { SITE } from "@/config/site";
import { useI18n } from "@/i18n/LocaleProvider";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="no-print border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="font-semibold text-ink">{SITE.name}</span>
          <span>{t("footer.tagline")}</span>
          <Link href="/about" className="hover:text-ink">
            {t("nav.about")}
          </Link>
          <Link href="/benefits" className="hover:text-ink">
            {t("nav.browse")}
          </Link>
        </div>
        <p className="mt-4 max-w-3xl leading-relaxed">{t("footer.disclaimer")}</p>
        <p className="mt-2 leading-relaxed">{t("about.notAffiliated")}</p>
      </div>
    </footer>
  );
}
