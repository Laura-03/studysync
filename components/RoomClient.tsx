"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import StudyTimer from "@/components/StudyTimer";

interface RoomClientProps {
  sessionId: string;
  userId: string;
  subjectLabel: string;
  studyStyle: string;
  durationMinutes: number;
  startedAt: string;
  initialStatus: string;
}

export default function RoomClient({
  sessionId,
  userId,
  subjectLabel,
  studyStyle,
  durationMinutes,
  startedAt,
  initialStatus,
}: RoomClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [status, setStatus] = useState<string>(initialStatus);

  const leftRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchToken() {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "Failed to obtain LiveKit token");
        }

        const json = (await res.json()) as { token: string; url: string };
        if (cancelled) return;

        if (!json.token || !json.url) {
          throw new Error("LiveKit is not configured correctly.");
        }

        setToken(json.token);
        setServerUrl(json.url);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }

    void fetchToken();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const handleLeave = useCallback(async () => {
    if (leftRef.current) return;
    leftRef.current = true;
    setLeaving(true);

    try {
      const now = new Date().toISOString();

      await supabase
        .from("session_participants")
        .update({ left_at: now })
        .eq("session_id", sessionId)
        .eq("user_id", userId);

      const { data: participants } = await supabase
        .from("session_participants")
        .select("*")
        .eq("session_id", sessionId);

      const rows = (participants ?? []) as Array<{ left_at: string | null }>;
      const everyoneLeft =
        rows.length > 0 && rows.every((row) => row.left_at !== null);

      if (everyoneLeft) {
        await supabase
          .from("study_sessions")
          .update({ status: "completed", ended_at: now })
          .eq("id", sessionId);
        setStatus("completed");
      }
    } catch {
      // best-effort; continue to feedback
    }

    router.push(`/feedback/${sessionId}`);
    router.refresh();
  }, [router, sessionId, supabase, userId]);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">
          Could not join the study room
        </p>
        <p className="mt-1 text-sm text-rose-600">{error}</p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => router.refresh()}>
            Retry
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Subject
          </p>
          <p className="mt-1 truncate text-sm font-medium text-slate-900">
            {subjectLabel}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Study style
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {studyStyle}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Status
          </p>
          <p className="mt-1 text-sm font-medium capitalize text-slate-900">
            {status}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <StudyTimer startedAt={startedAt} durationMinutes={durationMinutes} />
      </div>

      <div
        data-lk-theme="default"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm"
        style={{ height: "62vh", minHeight: "380px" }}
      >
        {token && serverUrl ? (
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect
            audio
            video
            onDisconnected={handleLeave}
            style={{ height: "100%" }}
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
            <Spinner className="border-white/30 border-t-white" />
            <p className="text-sm font-medium text-white/80">
              Connecting to your study room…
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="danger"
          onClick={handleLeave}
          loading={leaving}
          disabled={leaving}
        >
          {leaving ? "Leaving…" : "Leave session"}
        </Button>
      </div>
    </div>
  );
}