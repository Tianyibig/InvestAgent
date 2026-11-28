import { NextResponse } from "next/server";

// Server-side proxy: the browser never holds a token, and the API URL stays out
// of the client bundle. A real deployment swaps the dev token for the session
// cookie issued at login.
const API = process.env.INVEST_API_URL ?? "http://127.0.0.1:8100";

interface Payload {
  market_track: "PRIMARY_PE_VC" | "SECONDARY_EQUITY";
  sector_tag: string;
  original_thesis: string;
  missed_risks: string;
  lesson_learned: string;
  project_id?: string;
}

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!payload?.lesson_learned?.trim()) {
    return NextResponse.json({ error: "lesson_learned is required" }, { status: 400 });
  }

  const role = payload.market_track === "PRIMARY_PE_VC" ? "PE_TEAM" : "SECONDARY_TEAM";
  try {
    const tokenRes = await fetch(API + "/auth/dev-token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: "local-user", role, allowed_projects: [] }),
      cache: "no-store",
    });
    if (!tokenRes.ok) {
      return NextResponse.json({ error: "token unavailable" }, { status: 502 });
    }
    const { token } = (await tokenRes.json()) as { token: string };

    const res = await fetch(API + "/reflections", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + token },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = (await res.json()) as Record<string, unknown>;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "api unreachable" }, { status: 503 });
  }
}
