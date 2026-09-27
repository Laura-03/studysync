import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

interface SessionSummary {
  id: string;
  custom_subject: string | null;
  subject_id: number | null;
  duration: number;
  study_style: string;
  status: string;
  created_at: string;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const sessionRows = (sessions ?? []) as SessionSummary[];
  const sessionIds: string[] = sessionRows.map((s) => s.id);

  let mySessions: SessionSummary[] = [];

  if (sessionIds.length > 0) {
    const { data: participation } = await supabase
      .from("session_participants")
      .select("session_id")
      .eq("user_id", user.id)
      .in("session_id", sessionIds);

    const participatedIds = new Set(
      (participation ?? []).map((p: { session_id: string }) => p.session_id)
    );

    mySessions = sessionRows.filter((s) => participatedIds.has(s.id));
  }

  const displayName =
    (profile as { name?: string } | null)?.name ??
    user.email?.split("@")[0] ??
    "Student";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Hi {displayName} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Ready for a focused study session?
        </p>
      </div>

      <Card className="bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Start a new session</h2>
            <p className="mt-1 text-sm text-brand-100">
              Pick your subject, duration, and study style. We&apos;ll match you
              with a partner.
            </p>
          </div>
          <Link
            href="/preferences"
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Find a partner
          </Link>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Recent sessions"
          subtitle="Your last few study sessions."
        />
        {mySessions.length === 0 ? (
          <p className="text-sm text-slate-500">
            You haven&apos;t completed any sessions yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mySessions.map((s) => {
              const label =
                s.custom_subject ?? `Subject #${s.subject_id ?? "—"}`;
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.duration} min · {s.study_style} ·{" "}
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {s.status}
                    </span>
                    {s.status !== "completed" ? (
                      <Link
                        href={`/room/${s.id}`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Open
                      </Link>
                    ) : (
                      <Link
                        href={`/feedback/${s.id}`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Feedback
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}