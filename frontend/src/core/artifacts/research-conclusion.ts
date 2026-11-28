export type ResearchConclusion = {
  rating?: string;
  targetPrice?: string;
  risk?: string;
  asOf?: string;
  evidenceScore?: string;
  evidenceThreshold?: string;
  subject?: string;
};

// Accept ```conclusion or ~~~conclusion (skills nest the latter inside
// outer markdown fences in SKILL.md templates).
const FENCE_RE =
  /(?:```|~~~)conclusion\s*\n([\s\S]*?)(?:```|~~~)/i;

const BULLET_MAP: ReadonlyArray<{
  keys: RegExp;
  field: keyof ResearchConclusion;
}> = [
  { keys: /^(?:rating|recommendation)\b/i, field: "rating" },
  { keys: /^(?:target(?:\s*price)?|目标价)\b/i, field: "targetPrice" },
  { keys: /^(?:risk|风险)\b/i, field: "risk" },
  { keys: /^(?:as\s*of|截至|日期)\b/i, field: "asOf" },
  {
    keys: /^(?:evidence(?:\s*score)?|证据(?:链)?(?:分|分数)?)\b/i,
    field: "evidenceScore",
  },
  {
    keys: /^(?:evidence(?:\s*threshold)?|门槛)\b/i,
    field: "evidenceThreshold",
  },
  { keys: /^(?:subject|ticker|标的)\b/i, field: "subject" },
];

function assignLine(out: ResearchConclusion, raw: string) {
  const line = raw.trim().replace(/^[-*]\s+/, "");
  if (!line || line.startsWith("#")) return;
  const match = line.match(/^([^:：]+)[:：]\s*(.+)$/);
  if (!match) return;
  const label = match[1]?.trim() ?? "";
  const value = match[2]?.trim() ?? "";
  if (!value) return;
  for (const { keys, field } of BULLET_MAP) {
    if (keys.test(label) && !out[field]) {
      out[field] = value;
      break;
    }
  }
  // Also accept fence keys that match English snake/camel loosely.
  const key = label.toLowerCase().replace(/[\s_-]+/g, "");
  if (key === "targetprice" && !out.targetPrice) out.targetPrice = value;
  if (key === "evidencescore" && !out.evidenceScore) out.evidenceScore = value;
  if (key === "evidencethreshold" && !out.evidenceThreshold) {
    out.evidenceThreshold = value;
  }
}

function parseLines(text: string): ResearchConclusion {
  const out: ResearchConclusion = {};
  for (const raw of text.split(/\r?\n/)) {
    assignLine(out, raw);
  }
  return out;
}

function hasAny(conclusion: ResearchConclusion) {
  return Object.values(conclusion).some((value) => Boolean(value));
}

/** Prefer a fenced ```conclusion block; else scan the leading bullet list. */
export function extractResearchConclusion(
  markdown: string,
): ResearchConclusion | null {
  const fence = markdown.match(FENCE_RE);
  if (fence?.[1]) {
    const fromFence = parseLines(fence[1]);
    if (hasAny(fromFence)) return fromFence;
  }

  const head = markdown.slice(0, 2500);
  const beforeSection = head.split(/\n##\s+/)[0] ?? head;
  const fromBullets = parseLines(beforeSection);
  return hasAny(fromBullets) ? fromBullets : null;
}

/** Remove the fenced conclusion block from preview body (keep bullets). */
export function stripResearchConclusionFence(markdown: string): string {
  return markdown.replace(FENCE_RE, "").replace(/\n{3,}/g, "\n\n").trimStart();
}

export function isResearchArtifactPath(filepath: string | undefined): boolean {
  if (!filepath) return false;
  const name = filepath.toLowerCase();
  return (
    name.includes("equity-note") ||
    name.includes("ic-memo") ||
    name.includes("sector-scan") ||
    name.includes("portfolio-review") ||
    name.includes("research-protocol")
  );
}
