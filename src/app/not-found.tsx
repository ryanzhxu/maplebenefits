import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="text-5xl">🍁</div>
      <h1 className="mt-4 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-muted">
        The page you are looking for does not exist.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-brand px-5 py-3 font-semibold text-white"
        >
          Home
        </Link>
        <Link
          href="/benefits"
          className="rounded-xl border border-line bg-surface px-5 py-3 font-semibold text-ink"
        >
          Browse benefits
        </Link>
      </div>
    </div>
  );
}
