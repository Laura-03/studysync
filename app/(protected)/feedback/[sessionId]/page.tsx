import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedbackForm from "@/components/FeedbackForm";
import { Card, CardHeader } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  subject_id: number | null;
  custom_subject: string | null;
  duration: number;
  study_style: string;
  status: string;
}

interface ParticipantRow {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string | null;
  left_at: string | null;
}

export default async function FeedbackPage({
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

  let subjectLabel = session.custom_subject ?? "Study session";

  if (!session.custom_subject && session.subject_id !== null) {
    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", session.subject_id)
      .maybeSingle();

    const name = (subjectRow as { name?: string } | null)?.name;
    subjectLabel = name ?? `Subject #${session.subject_id}`;
  }

  const partner = participants.find((p) => p.user_id !== user.id);
  let partnerName = "";

  if (partner) {
    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", partner.user_id)
      .maybeSingle();

    partnerName = (partnerProfile as { name?: string } | null)?.name ?? "";
  }

  const { data: existingFeedback } = await supabase
    .from("feedback")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingFeedback) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader
            title="Thanks for your feedback!"
            subtitle="You already submitted feedback for this session."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Session complete
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Tell us how it went so we can improve StudySync.
        </p>
      </div>

      <Card>
        <CardHeader title="Leave feedback" />
        <FeedbackForm
          sessionId={sessionId}
          userId={user.id}
          partnerName={partnerName}
          subjectLabel={subjectLabel}
        />
      </Card>
    </div>
  );
}