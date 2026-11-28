import type { Citation, DebateTurn, OutlineItem, Track } from "./types";

export interface StreamEvent {
  type: "phase" | "outline" | "analyst" | "debate" | "verifier";
  [key: string]: unknown;
}

export interface StreamRequest {
  mode: "start" | "approve" | "reject";
  task_id: string;
  query: string;
  market_track: Track;
  sector_tag?: string;
  project_id?: string;
}

/** Open the SSE stream. Returns null when the streaming service is not running,
 *  so the caller can fall back to the local demo run instead of hanging. */
export async function openRunStream(body: StreamRequest): Promise<ReadableStreamDefaultReader<Uint8Array> | null> {
  try {
    const res = await fetch("/api/invest/stream", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) return null;
    return res.body.getReader();
  } catch {
    return null;
  }
}

export async function consumeStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        onEvent(JSON.parse(line.slice(6)) as StreamEvent);
      } catch {
        // ignore keep-alive or partial frames
      }
    }
  }
}

export function outlineFrom(event: StreamEvent): OutlineItem[] {
  return (event.outline as OutlineItem[]) ?? [];
}

export function citationsFrom(items: Citation[]): Citation[] {
  return items;
}

export function debateFrom(event: StreamEvent): DebateTurn {
  return { side: event.side as DebateTurn["side"], round: Number(event.round), text: String(event.text) };
}
