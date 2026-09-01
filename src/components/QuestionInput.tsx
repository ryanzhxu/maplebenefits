"use client";

import { useState } from "react";
import type { IntakeQuestion } from "@/types/benefit";
import { useI18n } from "@/i18n/LocaleProvider";

export function QuestionInput({
  question,
  helping,
  value,
  onChange,
}: {
  question: IntakeQuestion;
  helping: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { t, r } = useI18n();
  const [showHelp, setShowHelp] = useState(false);

  const label =
    helping && question.questionHelping
      ? r(question.questionHelping)
      : r(question.question);

  return (
    <div>
      <h2 className="text-2xl font-semibold leading-snug text-ink">{label}</h2>

      {question.helpText && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="text-sm font-medium text-brand"
            aria-expanded={showHelp}
          >
            {t("common.whatDoesThisMean")}
          </button>
          {showHelp && (
            <p className="mt-2 rounded-lg bg-brand-soft px-3 py-2 text-sm leading-relaxed text-ink">
              {r(question.helpText)}
            </p>
          )}
        </div>
      )}

      <div className="mt-6">
        {question.inputType === "yes-no" && (
          <div className="flex gap-3">
            {[
              { v: true, label: t("common.yes") },
              { v: false, label: t("common.no") },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => onChange(opt.v)}
                aria-pressed={value === opt.v}
                className={`flex-1 rounded-xl border px-5 py-4 text-base font-semibold transition-colors ${
                  value === opt.v
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface text-ink hover:border-brand"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {question.inputType === "number" && (
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={question.min}
              max={question.max}
              value={value === undefined || value === null ? "" : String(value)}
              onChange={(e) =>
                onChange(e.target.value === "" ? undefined : Number(e.target.value))
              }
              aria-label={label}
              className="w-40 rounded-xl border border-line bg-surface px-4 py-3 text-lg text-ink"
            />
            {question.unit && (
              <span className="text-muted">{r(question.unit)}</span>
            )}
          </div>
        )}

        {question.inputType === "select" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {question.options?.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                aria-pressed={value === o.value}
                className={`rounded-xl border px-4 py-3 text-left text-base font-medium transition-colors ${
                  value === o.value
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface text-ink hover:border-brand"
                }`}
              >
                {r(o.label)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
