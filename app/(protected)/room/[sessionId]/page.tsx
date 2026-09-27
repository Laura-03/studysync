import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoomClient from "@/components/RoomClient";

export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  subject_id: number | null;
  custom_subject: string | null;
  duration: number;
  study_style: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

interface ParticipantRow {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string | null;
  left_at: string | null;
}

export default async function RoomPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessionData } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!sessionData) {
    notFound();
  }

  const session = sessionData as SessionRow;

  const { data: participantsData } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", sessionId);

  const participants = (participantsData ?? []) as ParticipantRow[];
  const me = participants.find((p) => p.user_id === user.id);

  if (!me) {
    redirect("/dashboard");
  }

  if (me.left_at) {
    redirect(`/feedback/${sessionId}`);
  }

  if (session.status === "completed" || session.status === "cancelled") {
    redirect(`/feedback/${sessionId}`);
  }

  let subjectLabel = session.custom_subject ?? "Study session";

  if (!session.custom_subject && session.subject_id !== null) {
    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", session.subject_id)
      .maybeSingle();

    const name = (subjectRow as { name?: string } | null)?.name;
    if (name) {
      subjectLabel = name;
    } else {
      subjectLabel = `Subject #${session.subject_id}`;
    }
  }

  if (!me.joined_at) {
    await supabase
      .from("session_participants")
      .update({ joined_at: new Date().toISOString() })
      .eq("id", me.id);
  }

  if (!session.started_at) {
    await supabase
      .from("study_sessions")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", sessionId);
  }

  const startedAt = session.started_at ?? new Date().toISOString();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Study room
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Focus together. The timer runs until your session ends.
        </p>
      </div>

      <RoomClient
        sessionId={sessionId}
        userId={user.id}
        subjectLabel={subjectLabel}
        studyStyle={session.study_style}
        durationMinutes={session.duration}
        startedAt={startedAt}
        initialStatus={session.status}
      />
    </div>
  );
}