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
  startedAt: string | null;
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
const [liveStartedAt, setLiveStartedAt] = useState<string | null>(startedAt);
const [retryKey, setRetryKey] = useState(0);
const leftRef = useRef(false);
useEffect(() => {
  let cancelled = false;

  const checkSession = async () => {
    const { data, error } = await supabase
      .from("study_sessions")
      .select("started_at, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (cancelled || error || !data) return;

    setLiveStartedAt(data.started_at ?? null);
    setStatus(data.status);
  };

  void checkSession();

  const interval = setInterval(() => {
    void checkSession();
  }, 2000);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [sessionId, supabase]);
  const handleConnected = useCallback(async () => {
    try {
      const response = await fetch("/api/study-sessions/ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not confirm your connection.");
      }

      if (result.bothConnected) {
        setStatus("active");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not confirm your study session is ready."
      );
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function fetchToken() {
      setError(null);

      try {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const json = await response.json();

        if (!response.ok || !json.token || !json.url) {
          throw new Error(
            json.error || "LiveKit is not configured correctly."
          );
        }

        if (!cancelled) {
          setToken(json.token);
          setServerUrl(json.url);
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Unknown error"
        );
      }
    }

    void fetchToken();

    return () => {
      cancelled = true;
    };
  }, [sessionId, retryKey]);

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
        .select("left_at")
        .eq("session_id", sessionId);

      const rows = participants ?? [];
      const everyoneLeft =
        rows.length > 0 &&
        rows.every((row) => row.left_at !== null);

      if (everyoneLeft) {
        await supabase
          .from("study_sessions")
          .update({
            status: "completed",
            ended_at: now,
          })
          .eq("id", sessionId);

        setStatus("completed");
      }
    } catch {
      // Continue to feedback even if updating the session fails.
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

        <p className="mt-1 text-sm text-rose-600">
          {error}
        </p>

        <div className="mt-4 flex justify-center gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setError(null);
              setToken(null);
              setServerUrl(null);
              setRetryKey((key) => key + 1);
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Subject
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
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
  <StudyTimer
    startedAt={liveStartedAt}
    durationMinutes={durationMinutes}
  />
</div>

<div
  data-lk-theme="default"
  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm"
  style={{ height: "62vh", minHeight: "380px" }}
>
        {token && serverUrl ? (
          <LiveKitRoom
            key={retryKey}
            token={token}
            serverUrl={serverUrl}
            connect
            audio
            video
            onConnected={handleConnected}
            onDisconnected={() => {
              setError(
                "Your connection to the study room was interrupted. Please try reconnecting."
              );
            }}
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