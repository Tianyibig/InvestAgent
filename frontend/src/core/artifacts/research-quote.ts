export type ResearchQuote = {
  ticker: string;
  name?: string;
  market?: string;
  last?: string;
  changePct?: string;
  asOf?: string;
  source?: string;
  sourceClass?: string;
  sourceTier?: number;
  delayed?: boolean;
  error?: string;
};

// Skills emit ```quote or ~~~quote around the stock-quote JSON payload.
// A fresh expression avoids a shared lastIndex between extract and strip.
function quoteFencePattern() {
  return /(?:```|~~~)quote[ \t]*\n([\s\S]*?)(?:```|~~~)/gi;
}

function stringField(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function asQuote(raw: unknown): ResearchQuote | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const ticker = stringField(row, "ticker") ?? stringField(row, "code");
  if (!ticker) return null;
  const tierRaw = row.source_tier ?? row.sourceTier;
  const sourceTier =
    typeof tierRaw === "number" && Number.isFinite(tierRaw)
      ? tierRaw
      : typeof tierRaw === "string" &&
          tierRaw.trim() !== "" &&
          Number.isFinite(Number(tierRaw))
        ? Number(tierRaw)
        : undefined;
  const error = stringField(row, "error");
  return {
    ticker,
    name: stringField(row, "name"),
    market: stringField(row, "market"),
    last: stringField(row, "last"),
    changePct: stringField(row, "change_pct") ?? stringField(row, "changePct"),
    asOf: stringField(row, "as_of") ?? stringField(row, "asOf"),
    source: stringField(row, "source"),
    sourceClass:
      stringField(row, "source_class") ?? stringField(row, "sourceClass"),
    sourceTier,
    delayed: row.delayed === true,
    error,
  };
}

function parseQuotePayload(body: string): ResearchQuote[] {
  try {
    const parsed = JSON.parse(body) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { quotes?: unknown }).quotes)
        ? (parsed as { quotes: unknown[] }).quotes
        : [parsed];
    return rows.flatMap((row) => {
      const quote = asQuote(row);
      return quote ? [quote] : [];
    });
  } catch {
    return [];
  }
}

/** Quotes from fenced ```quote blocks. Returns null when none parse. */
export function extractResearchQuotes(
  markdown: string,
): ResearchQuote[] | null {
  const found: ResearchQuote[] = [];
  for (const match of markdown.matchAll(quoteFencePattern())) {
    const body = match[1]?.trim();
    if (!body) continue;
    found.push(...parseQuotePayload(body));
  }
  return found.length > 0 ? found : null;
}

/** Remove fenced quote payloads from the preview body. */
export function stripResearchQuoteFence(markdown: string): string {
  return markdown
    .replace(quoteFencePattern(), "")
    .replace(/\n{3,}/g, "\n\n")
    .trimStart();
}
