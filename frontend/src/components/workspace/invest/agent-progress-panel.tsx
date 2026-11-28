"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AnalystState, DebateTurn, Phase } from "@/lib/invest/types";
import { cn } from "@/lib/utils";

interface Props {
  phase: Phase;
  analysts: AnalystState[];
  debate: DebateTurn[];
  verdict: string;
}

const PHASE_LABEL: Record<Phase, string> = {
  idle: "待开始",
  planning: "规划中",
  awaiting_outline: "等待大纲确认",
  analysts: "4 位分析师并行",
  debate: "多空辩论（2 轮）",
  verifying: "数值验算",
  done: "已完成",
  rejected: "已打回",
};

export function AgentProgressPanel({ phase, analysts, debate, verdict }: Props) {
  const done = analysts.filter((a) => a.status === "done").length;
  const pct = analysts.length ? Math.round((done / analysts.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <Card data-testid="progress-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>执行进度</span>
            <span className="font-mono text-xs text-muted-foreground" data-testid="phase">
              {PHASE_LABEL[phase]}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Progress value={pct} className="h-1.5" />
            <span className="font-mono text-xs text-muted-foreground" data-testid="analyst-count">
              {done}/{analysts.length}
            </span>
          </div>
          <ul className="space-y-1.5" data-testid="analyst-list">
            {analysts.map((a) => (
              <li
                key={a.key}
                data-testid={"analyst-" + a.key}
                data-status={a.status}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    a.status === "done" && "bg-foreground",
                    a.status === "running" && "bg-muted-foreground",
                    a.status === "pending" && "bg-border",
                  )}
                />
                <span className={cn(a.status === "pending" && "text-muted-foreground")}>{a.title}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{a.status}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card data-testid="debate-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>多空辩论</span>
            <span className="font-mono text-xs text-muted-foreground" data-testid="debate-count">
              {debate.length}/4
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {debate.length === 0 ? (
            <p className="text-sm text-muted-foreground">尚未开始</p>
          ) : (
            debate.map((turn, i) => (
              <div key={i} className="rounded-md border border-border px-3 py-2" data-testid="debate-turn">
                <Badge variant={turn.side === "bull" ? "default" : "secondary"} className="mb-1">
                  {turn.side === "bull" ? "正方" : "反方"} · 第 {turn.round} 轮
                </Badge>
                <p className="text-sm">{turn.text}</p>
              </div>
            ))
          )}
          {verdict ? (
            <div className="rounded-md bg-secondary px-3 py-2 text-sm" data-testid="verdict">
              <span className="text-muted-foreground">裁决：</span>
              {verdict}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
