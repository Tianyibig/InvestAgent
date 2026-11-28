// Shared types for the investment workbench. Mirrors the backend AgentState subset
// so the mock runner can be swapped for the SSE stream in M5 without UI changes.

export type Track = "PRIMARY_PE_VC" | "SECONDARY_EQUITY";

export type Phase =
  | "idle"
  | "planning"
  | "awaiting_outline"
  | "analysts"
  | "debate"
  | "verifying"
  | "done"
  | "rejected";

export interface OutlineItem {
  section: string;
  why: string;
}

export interface AnalystState {
  key: string;
  title: string;
  status: "pending" | "running" | "done";
  text?: string;
}

export interface DebateTurn {
  side: "bull" | "bear";
  round: number;
  text: string;
}

export interface Citation {
  docId: string;
  page: number;
  chunkId: string;
  bbox: [number, number, number, number];
  label: string;
}

export interface MatrixRow {
  key: string;
  cells: Record<string, string | number>;
}

export interface RunState {
  track: Track;
  phase: Phase;
  projectId: string;
  attempts: number;
  outline: OutlineItem[];
  analysts: AnalystState[];
  debate: DebateTurn[];
  verdict: string;
  citations: Citation[];
  matrix: MatrixRow[];
}
