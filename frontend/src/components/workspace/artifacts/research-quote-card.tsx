"use client";

import type { ResearchQuote } from "@/core/artifacts/research-quote";
import { useI18n } from "@/core/i18n/hooks";
import { cn } from "@/lib/utils";

function formatChange(value: string | undefined) {
  if (!value) return undefined;
  if (value.includes("%")) return value;
  if (/^[+-]?\d+(\.\d+)?$/.test(value)) {
    const amount = Number(value);
    const sign = amount > 0 ? "+" : "";
    return `${sign}${value}%`;
  }
  return value;
}

function Provenance({ quote }: { quote: ResearchQuote }) {
  const { t } = useI18n();
  const labels = t.researchQuote;
  return (
    <div
      className="flex flex-wrap items-center gap-1"
      data-testid="research-quote-provenance"
    >
      {quote.source && (
        <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
          {quote.source}
        </span>
      )}
      {quote.sourceTier !== undefined && (
        <span className="border-border rounded-full border px-2 py-0.5 text-xs">
          {labels.tier} {quote.sourceTier}
        </span>
      )}
      {quote.delayed && (
        <span className="border-border rounded-full border px-2 py-0.5 text-xs">
          {labels.delayed}
        </span>
      )}
      {quote.sourceClass === "data" && (
        <span className="text-muted-foreground text-xs">
          {labels.dataNotOfficial}
        </span>
      )}
    </div>
  );
}

export function ResearchQuoteCard({
  quotes,
  className,
}: {
  quotes: ResearchQuote[];
  className?: string;
}) {
  const { t } = useI18n();
  const labels = t.researchQuote;
  if (quotes.length === 0) return null;

  return (
    <section
      className={cn(
        "bg-background/95 border-border flex shrink-0 flex-col gap-2 border-b px-4 py-2.5",
        className,
      )}
      data-testid="research-quote-card"
      aria-label={labels.region}
    >
      {quotes.map((quote, index) => {
        const change = formatChange(quote.changePct);
        return (
          <article
            key={`${quote.ticker}-${index}`}
            className="flex min-w-0 flex-col gap-1"
            data-testid="research-quote-row"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-sm font-medium">{quote.ticker}</span>
              {quote.name && (
                <span className="text-muted-foreground text-sm">
                  {quote.name}
                </span>
              )}
              {quote.last && (
                <span className="text-sm font-semibold">{quote.last}</span>
              )}
              {change && (
                <span className="text-muted-foreground text-sm">{change}</span>
              )}
              {quote.asOf && (
                <span className="text-muted-foreground text-xs">
                  {labels.asOf} {quote.asOf}
                </span>
              )}
            </div>
            <Provenance quote={quote} />
            {quote.error && (
              <p className="text-muted-foreground text-xs">
                {labels.unavailable}: {quote.error}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
