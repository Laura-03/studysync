import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-brand-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center sm:pt-24">
        <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Focused studying, together
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          StudySync
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Get matched with another student who is studying the same subject for
          the same amount of time. Join a private audio/video study room, focus
          together, and stay accountable.
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:w-auto"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:w-auto"
              >
                Create an account
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                Log in
              </Link>
            </>
          )}
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              1. Set preferences
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose your subject, session length, and study style.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              2. Get matched
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              We pair you with a student on the same subject for the same
              duration.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              3. Study together
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Join a live audio/video room with a shared countdown timer.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}