import { NextResponse } from "next/server";

// Proxy to the streaming service (LangGraph lives in the backend venv, so it
// runs as its own process on 8101). The browser never sees the dev token.
const RUNS = process.env.INVEST_RUNS_URL ?? "http://127.0.0.1:8101";

interface Body {
  mode: "start" | "approve" | "reject";
  task_id: string;
  query: string;
  market_track: "PRIMARY_PE_VC" | "SECONDARY_EQUITY";
  sector_tag?: string;
  project_id?: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const role = body.market_track === "PRIMARY_PE_VC" ? "PE_TEAM" : "SECONDARY_TEAM";
  try {
    const tokenRes = await fetch(RUNS.replace("8101", "8100") + "/auth/dev-token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user_id: "local-user", role, allowed_projects: [] }),
      cache: "no-store",
    });
    if (!tokenRes.ok) return NextResponse.json({ error: "token unavailable" }, { status: 502 });
    const { token } = (await tokenRes.json()) as { token: string };

    const path =
      body.mode === "start" ? "/runs/stream" : "/runs/" + body.task_id + "/" + body.mode;
    const upstream = await fetch(RUNS + path, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + token },
      body: JSON.stringify({
        task_id: body.task_id,
        query: body.query,
        market_track: body.market_track,
        sector_tag: body.sector_tag ?? "",
        project_id: body.project_id ?? "",
      }),
      cache: "no-store",
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "stream unavailable" }, { status: 502 });
    }
    return new NextResponse(upstream.body, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        "x-accel-buffering": "no",
      },
    });
  } catch {
    return NextResponse.json({ error: "runs service unreachable" }, { status: 503 });
  }
}
