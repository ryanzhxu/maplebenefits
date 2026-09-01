"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/config/site";
import { useI18n } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

function MapleMark() {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 place-items-center rounded-lg bg-maple text-white text-lg leading-none"
    >
      🍁
    </span>
  );
}

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/benefits", label: t("nav.browse") },
    { href: "/assess", label: t("nav.assess") },
    { href: "/about", label: t("nav.about") },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-ink"
          onClick={() => setOpen(false)}
        >
          <MapleMark />
          <span className="text-lg tracking-tight">{SITE.name}</span>
        </Link>

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

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-line p-2 text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-surface px-4 py-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-3 text-base font-medium ${
                isActive(l.href) ? "text-brand" : "text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
