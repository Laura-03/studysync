import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { sessionId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const sessionId = body.sessionId;

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  const { data: participant, error: participantError } = await supabase
    .from("session_participants")
    .select("user_id")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (participantError || !participant) {
    return NextResponse.json(
      { error: "You are not a participant in this session" },
      { status: 403 }
    );
  }

  const { error: connectionError } = await supabase
    .from("session_participants")
    .update({ is_connected: true })
    .eq("session_id", sessionId)
    .eq("user_id", user.id);

  if (connectionError) {
    console.error("Failed to record participant connection:", connectionError);

    return NextResponse.json(
      { error: "Could not record your connection" },
      { status: 500 }
    );
  }

  const { data: participants, error: participantsError } = await supabase
    .from("session_participants")
    .select("user_id, is_connected")
    .eq("session_id", sessionId);

  if (participantsError || !participants || participants.length !== 2) {
    return NextResponse.json(
      { error: "Could not verify both participants" },
      { status: 500 }
    );
  }

  const bothConnected = participants.every(
    (item) => item.is_connected === true
  );

  if (bothConnected) {
    const { data: session, error: sessionError } = await supabase
      .from("study_sessions")
      .select("started_at, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Could not find the study session" },
        { status: 500 }
      );
    }

    if (!session.started_at) {
      const { error: startError } = await supabase
        .from("study_sessions")
        .update({
          started_at: new Date().toISOString(),
          status: "active",
        })
        .eq("id", sessionId)
        .is("started_at", null);

      if (startError) {
        console.error("Failed to start study session:", startError);

        return NextResponse.json(
          { error: "Could not start the study session" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({
    success: true,
    bothConnected,
  });
}