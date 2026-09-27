"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { isValidUuid } from "@/lib/utils";

interface MatchingClientProps {
  userId: string;
  subjectId: number | null;
  customSubject: string | null;
  duration: number;
  studyStyle: string;
  subjectLabel: string;
}

type Status = "starting" | "waiting" | "error" | "matched";

function extractSessionId(data: unknown): string | null {
  if (data === null || data === undefined) return null;

  if (typeof data === "string") {
    return isValidUuid(data) ? data : null;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const id = extractSessionId(item);
      if (id) return id;
    }
    return null;
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    const sessionCandidate = obj.session_id ?? obj.sessionId;
    if (typeof sessionCandidate === "string" && isValidUuid(sessionCandidate)) {
      return sessionCandidate;
    }

    if (
      obj.matched === true &&
      typeof obj.id === "string" &&
      isValidUuid(obj.id)
    ) {
      return obj.id;
    }

    if (obj.data !== undefined) {
      const id = extractSessionId(obj.data);
      if (id) return id;
    }

    if (obj.match !== undefined) {
      const id = extractSessionId(obj.match);
      if (id) return id;
    }
  }

  return null;
}

export default function MatchingClient({
  userId,
  subjectId,
  customSubject,
  duration,
  studyStyle,
  subjectLabel,
}: MatchingClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [status, setStatus] = useState<Status>("starting");
  const [message, setMessage] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const startedRef = useRef(false);
  const redirectedRef = useRef(false);

  const goToRoom = useCallback(
    (sessionId: string) => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      setStatus("matched");
      router.push(`/room/${sessionId}`);
    },
    [router]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function run() {
      const { data, error } = await supabase.rpc("match_user", {
        p_user_id: userId,
        p_subject_id: subjectId,
        p_custom_subject: customSubject,
        p_duration: duration,
        p_study_style: studyStyle,
      });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      const sessionId = extractSessionId(data);
      if (sessionId) {
        goToRoom(sessionId);
        return;
      }

      setStatus("waiting");
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    customSubject,
    duration,
    goToRoom,
    studyStyle,
    subjectId,
    supabase,
    userId,
  ]);

  useEffect(() => {
    if (status !== "waiting") return;

    const channel = supabase
      .channel(`studysync-match-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { session_id?: string };
          if (row?.session_id) {
            goToRoom(row.session_id);
          }
        }
      )
      .subscribe();

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const sessionId = (data as { session_id?: string } | null)?.session_id;
      if (sessionId) {
        goToRoom(sessionId);
      }
    }, 4000);

    const ticker = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(poll);
      clearInterval(ticker);
      void supabase.removeChannel(channel);
    };
  }, [goToRoom, status, supabase, userId]);

  async function handleCancel() {
    try {
      await supabase.from("matching_queue").delete().eq("user_id", userId);
    } catch {
      // ignore
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (status === "starting") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Spinner />
        <p className="text-sm font-medium text-slate-600">
          Finding you a study partner…
        </p>
      </div>
    );
  }

  if (status === "matched") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Spinner />
        <p className="text-sm font-medium text-emerald-600">
          Matched! Joining your study room…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm font-medium text-rose-600">
          We couldn&apos;t start matching: {message ?? "unknown error"}
        </p>
        <div className="flex justify-center gap-3">
          <Button
            variant="secondary"
            onClick={() => router.push("/preferences")}
          >
            Change preferences
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-200 opacity-60" />
          <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Looking for a partner…
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            We&apos;ll match you with another student studying the same thing
            for the same amount of time.
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Waiting {elapsed}s
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Subject
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-900">
            {subjectLabel}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Duration
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {duration} min
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Style
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{studyStyle}</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="secondary" onClick={handleCancel}>
          Cancel and leave queue
        </Button>
      </div>
    </div>
  );
}