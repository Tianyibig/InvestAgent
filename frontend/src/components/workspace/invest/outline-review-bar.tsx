"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OutlineItem, Phase } from "@/lib/invest/types";

interface Props {
  outline: OutlineItem[];
  phase: Phase;
  attempts: number;
  onApprove: () => void;
  onReject: () => void;
}

export function OutlineReviewBar({ outline, phase, attempts, onApprove, onReject }: Props) {
  const awaiting = phase === "awaiting_outline";
  return (
    <Card data-testid="outline-bar">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>研究大纲</span>
          <span className="font-mono text-xs text-muted-foreground" data-testid="outline-attempts">
            第 {attempts + 1} 版
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ol className="space-y-2" data-testid="outline-list">
          {outline.map((item) => (
            <li key={item.section} className="rounded-md border border-border px-3 py-2">
              <p className="text-sm">{item.section}</p>
              <p className="text-xs text-muted-foreground">{item.why}</p>
            </li>
          ))}
        </ol>
        <div className="flex gap-2">
          <Button data-testid="outline-approve" size="sm" disabled={!awaiting} onClick={onApprove}>
            确认大纲，开始分析
          </Button>
          <Button
            data-testid="outline-reject"
            size="sm"
            variant="outline"
            disabled={!awaiting}
            onClick={onReject}
          >
            打回重规划
          </Button>
          {!awaiting ? (
            <span className="self-center text-xs text-muted-foreground">
              等待规划完成…
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
