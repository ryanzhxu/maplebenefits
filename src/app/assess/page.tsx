"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/LocaleProvider";
import { useAssessment } from "@/store/assessment";
import { activeQuestions, questionsForFields } from "@/data/intake";
import { getBenefit } from "@/data/benefits";
import { evaluate } from "@/lib/engine";
import { QuestionInput } from "@/components/QuestionInput";
import { ResultCard } from "@/components/ResultCard";

function AssessInner() {
  const { t, r } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const focusId = params.get("focus") ?? undefined;
  const focusBenefit =
    focusId && !getBenefit(focusId)?.discontinued
      ? getBenefit(focusId)
      : undefined;

  const { context, completed, setHelpingSomeoneElse, setAnswer, setCompleted } =
    useAssessment();
  const helping = context.helpingSomeoneElse === true;

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);

  const questions = useMemo(
    () =>
      focusBenefit
        ? questionsForFields(focusBenefit.contextFields, context)
        : activeQuestions(context),
    [focusBenefit, context],
  );

  const total = questions.length;
  const atResult = focusBenefit && step >= total;
  const current = questions[Math.min(step, total - 1)];

  // Intro / mode selection (full assessment only)
  if (!started && !focusBenefit) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          {t("assess.title")}
        </h1>
        <p className="mt-3 leading-relaxed text-muted">{t("assess.intro")}</p>

        <fieldset className="mt-8">
          <legend className="text-lg font-semibold text-ink">
            {t("assess.modeQuestion")}
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { v: false, label: t("assess.modeSelf") },
              { v: true, label: t("assess.modeOther") },
            ].map((m) => (
              <button
                key={String(m.v)}
                type="button"
                onClick={() => setHelpingSomeoneElse(m.v)}
                aria-pressed={context.helpingSomeoneElse === m.v}
                className={`rounded-xl border px-5 py-4 text-base font-semibold transition-colors ${
                  context.helpingSomeoneElse === m.v
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface text-ink hover:border-brand"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-8 inline-flex items-center rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white hover:bg-brand-dark"
        >
          {t("assess.startButton")} →
        </button>
      </div>
    );
  }

  // Single-benefit result
  if (atResult && focusBenefit) {
    const result = evaluate(focusBenefit, context);
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {r(focusBenefit.name)}
        </h1>
        <div className="mt-5">
          <ResultCard benefit={focusBenefit} result={result} defaultOpen />
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setStep(0)}
            className="text-sm font-medium text-brand"
          >
            ← {t("results.retake")}
          </button>
          <Link href="/assess" className="text-sm font-medium text-brand">
            {t("common.startAssessment")} →
          </Link>
        </div>
      </div>
    );
  }

  if (!current) {
    // No questions to ask (shouldn't happen) — go to results.
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/assess/results" className="text-brand">
          {t("common.seeResults")} →
        </Link>
      </div>
    );
  }

  const value = context[current.field];
  const answered = value !== undefined && value !== null && value !== "";
  const canProceed = answered || current.required === false;
  const isLast = step === total - 1;

  const goNext = () => {
    if (isLast) {
      if (focusBenefit) {
        setStep(total); // show result
      } else {
        setCompleted(true);
        router.push("/assess/results");
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            {r(current.group)} · {t("assess.progress", { current: step + 1, total })}
          </span>
          {helping && <span className="text-brand">{t("assess.helperNote")}</span>}
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-soft"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <QuestionInput
        question={current}
        helping={helping}
        value={value}
        onChange={(v) => setAnswer(current.field, v)}
      />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted disabled:opacity-40"
        >
          ← {t("common.previous")}
        </button>

        <div className="flex items-center gap-3">
          {current.required === false && !answered && (
            <button
              type="button"
              onClick={goNext}
              className="text-sm font-medium text-muted underline"
            >
              {t("common.skip")}
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed}
            className="rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
          >
            {isLast ? t("assess.finish") : t("common.next")} →
          </button>
        </div>
      </div>

      {!completed && (
        <p className="mt-8 text-center text-xs text-muted">
          🔒 {t("home.statPrivate")}
        </p>
      )}
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-12" />}>
      <AssessInner />
    </Suspense>
  );
}
