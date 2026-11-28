"use client";

import type { ResearchConclusion } from "@/core/artifacts/research-conclusion";
import { useI18n } from "@/core/i18n/hooks";
import { cn } from "@/lib/utils";

function Chip({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px] leading-none tracking-wide uppercase">
        {label}
      </span>
      <span
        className={cn(
          "truncate text-sm leading-tight",
          emphasize ? "font-semibold" : "font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function ResearchConclusionBar({
  conclusion,
  className,
}: {
  conclusion: ResearchConclusion;
  className?: string;
}) {
  const { t } = useI18n();
  const labels = t.researchConclusion;
  const items: Array<{ label: string; value: string; emphasize?: boolean }> =
    [];

  if (conclusion.rating) {
    items.push({
      label: labels.rating,
      value: conclusion.rating,
      emphasize: true,
    });
  }
  if (conclusion.targetPrice) {
    items.push({ label: labels.target, value: conclusion.targetPrice });
  }
  if (conclusion.risk) {
    items.push({ label: labels.risk, value: conclusion.risk });
  }
  if (conclusion.asOf) {
    items.push({ label: labels.asOf, value: conclusion.asOf });
  }
  if (conclusion.evidenceScore) {
    const score = conclusion.evidenceThreshold
      ? `${conclusion.evidenceScore}/${conclusion.evidenceThreshold}`
      : conclusion.evidenceScore;
    items.push({ label: labels.evidence, value: score });
  }
  if (conclusion.subject && items.length < 5) {
    items.push({ label: labels.subject, value: conclusion.subject });
  }

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "bg-background/95 border-border flex shrink-0 flex-wrap items-start gap-x-5 gap-y-2 border-b px-4 py-2.5 backdrop-blur",
        className,
      )}
      data-testid="research-conclusion-bar"
      role="region"
      aria-label={labels.region}
    >
      {items.map((item) => (
        <Chip
          key={item.label}
          label={item.label}
          value={item.value}
          emphasize={item.emphasize}
        />
      ))}
    </div>
  );
}
