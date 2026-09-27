import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MatchingClient from "@/components/MatchingClient";
import { Card } from "@/components/ui/Card";
import { DURATIONS, STUDY_STYLES, type StudyStyle } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  subjectId?: string;
  customSubject?: string;
  duration?: string;
  style?: string;
}

export default async function MatchingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const durationNum = Number(searchParams.duration ?? "0");
  const duration = DURATIONS.includes(durationNum) ? durationNum : 30;

  const styleParam = searchParams.style ?? "Silent";
  const studyStyle: StudyStyle = (STUDY_STYLES as string[]).includes(
    styleParam
  )
    ? (styleParam as StudyStyle)
    : "Silent";

  const rawSubjectId = searchParams.subjectId;
  let subjectId: number | null = null;
  let customSubject: string | null = null;
  let subjectLabel = "Custom subject";

  if (rawSubjectId) {
    const parsed = Number(rawSubjectId);
    if (Number.isFinite(parsed)) {
      subjectId = parsed;
    }
  } else if (searchParams.customSubject) {
    customSubject = searchParams.customSubject.trim() || null;
    subjectLabel = customSubject ?? "Custom subject";
  }

  if (subjectId !== null) {
    const { data: subjectRow } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .maybeSingle();

    if (
      subjectRow &&
      typeof (subjectRow as { name?: string }).name === "string"
    ) {
      subjectLabel = (subjectRow as { name: string }).name;
    } else {
      subjectLabel = `Subject #${subjectId}`;
    }
  }

  if (subjectId === null && !customSubject) {
    redirect("/preferences");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Matching
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Hang tight while we find your study partner.
        </p>
      </div>

      <Card>
        <MatchingClient
          userId={user.id}
          subjectId={subjectId}
          customSubject={customSubject}
          duration={duration}
          studyStyle={studyStyle}
          subjectLabel={subjectLabel}
        />
      </Card>
    </div>
  );
}