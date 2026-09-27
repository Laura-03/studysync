import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { roomNameForSession } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface TokenRequestBody {
  sessionId?: string;
}

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TokenRequestBody;
  try {
    body = (await request.json()) as TokenRequestBody;
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

  const { data: participant } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json(
      { error: "You are not a participant of this session" },
      { status: 403 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    (profile as { name?: string } | null)?.name ??
    user.email?.split("@")[0] ??
    "Student";

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json(
      { error: "LiveKit is not configured on the server" },
      { status: 500 }
    );
  }

  const roomName = roomNameForSession(sessionId);

  const accessToken = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: displayName,
    ttl: "2h",
  });

  accessToken.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await accessToken.toJwt();

  return NextResponse.json({
    token,
    url: livekitUrl,
    room: roomName,
  });
}