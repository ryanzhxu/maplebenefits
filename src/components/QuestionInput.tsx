"use client";

import { useEffect, useState } from "react";
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

  const currentYear = new Date().getFullYear();
  const isBirthYearSlider =
    question.inputType === "slider" && question.birthYearSlider === true;

  // Seed a slider's defaultValue as the actual answer the first time this
  // question is shown unanswered, so it opens pre-filled instead of at 0. A
  // birth-year slider's defaultValue is a birth year; the stored answer is
  // always the derived age.
  useEffect(() => {
    if (
      question.inputType === "slider" &&
      question.defaultValue !== undefined &&
      value === undefined
    ) {
      onChange(
        isBirthYearSlider
          ? currentYear - question.defaultValue
          : question.defaultValue,
      );
    }
  }, [
    question.inputType,
    isBirthYearSlider,
    question.defaultValue,
    value,
    onChange,
    currentYear,
  ]);

  const label =
    helping && question.questionHelping
      ? r(question.questionHelping)
      : r(question.question);

  // The value actually stored in context -- an age, even for the
  // birth-year slider.
  const storedValue =
    value === undefined || value === null
      ? isBirthYearSlider
        ? currentYear - (question.defaultValue ?? currentYear)
        : question.defaultValue ?? question.min ?? 0
      : Number(value);

  // What the slider itself displays: a birth year for the age question, the
  // stored value directly for any other slider.
  const sliderValue = isBirthYearSlider
    ? currentYear - storedValue
    : storedValue;

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

        {question.inputType === "slider" && (
          <div>
            <div className="mb-3">
              <div className="text-2xl font-semibold text-ink">
                {sliderValue}
                {!isBirthYearSlider && question.unit && (
                  <span className="ml-2 text-base font-normal text-muted">
                    {r(question.unit)}
                  </span>
                )}
              </div>
              {isBirthYearSlider && question.unit && (
                <div className="text-sm text-muted">
                  {storedValue} {r(question.unit)}
                </div>
              )}
            </div>
            <input
              type="range"
              min={question.min}
              max={question.max}
              step={1}
              value={sliderValue}
              onChange={(e) =>
                onChange(
                  isBirthYearSlider
                    ? currentYear - Number(e.target.value)
                    : Number(e.target.value),
                )
              }
              aria-label={label}
              className="w-full accent-brand"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>{question.min}</span>
              <span>{question.max}</span>
            </div>
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
