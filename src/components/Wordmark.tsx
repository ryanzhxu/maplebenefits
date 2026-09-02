/**
 * The MapleBenefits wordmark: a two-color, no-icon logo.
 * "maple" in maple-red, "benefits" in trust-blue, set in Manrope 800.
 * Accessible name comes from the containing link (aria-label), so this is
 * marked aria-hidden to avoid a screen reader announcing "maplebenefits".
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex font-extrabold leading-none tracking-tight ${className}`}
      style={{ fontFamily: "var(--font-wordmark), ui-sans-serif, system-ui, sans-serif" }}
    >
      <span className="text-maple">maple</span>
      <span className="text-brand">benefits</span>
    </span>
  );
}
