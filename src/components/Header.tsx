"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { useI18n } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Wordmark } from "./Wordmark";

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [
    { href: "/benefits", label: t("nav.browse") },
    { href: "/assess", label: t("nav.assess") },
    { href: "/about", label: t("nav.about") },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link
          href="/"
          aria-label={SITE.name}
          className="flex min-w-0 items-center"
        >
          <Wordmark className="truncate text-lg sm:text-xl" />
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:bg-neutral-soft hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="ml-2">
            <LanguageSwitcher />
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line text-ink md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
            {open ? (
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav className="border-t border-line bg-surface px-4 py-3 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-muted">
              {t("common.language")}
            </span>
            <LanguageSwitcher />
          </div>
          <div className="border-t border-line pt-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-lg px-3 py-3 text-base font-medium ${
                  isActive(l.href)
                    ? "bg-brand-soft text-brand"
                    : "text-ink hover:bg-neutral-soft"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
