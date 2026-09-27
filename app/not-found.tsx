import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          404
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you were looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}