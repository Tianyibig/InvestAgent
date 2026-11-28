"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { analystsFor, debateTurns, initialRun, switchTrack, verdictText } from "@/lib/invest/mockRun";
import { consumeStream, debateFrom, openRunStream, outlineFrom } from "@/lib/invest/stream";
import type { Citation, RunState, Track } from "@/lib/invest/types";

import { AgentProgressPanel } from "./agent-progress-panel";
import { ModeSwitcher } from "./mode-switcher";
import { OutlineReviewBar } from "./outline-review-bar";

const CompetitorMatrix = dynamic(() => import("./competitor-matrix").then((m) => m.CompetitorMatrix), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-lg border border-border" />,
});

const CitationPdfDrawer = dynamic(
  () => import("./citation-pdf-drawer").then((m) => m.CitationPdfDrawer),
  { ssr: false },
);

const QUERY = "具身智能灵巧手用行星滚柱丝杠项目A";

export function InvestWorkbench() {
  const [run, setRun] = useState<RunState>(() => initialRun("PRIMARY_PE_VC", "PROJ_A"));
  const [citation, setCitation] = useState<Citation | null>(null);
  const [lesson, setLesson] = useState("");
  const [archive, setArchive] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // "pending" until the streaming service answers; "local" drives the demo run.}
  const [mode, setMode] = useState<"pending" | "stream" | "local">("pending");
  const taskRef = useRef<string>("");
  const analystsRef = useRef(run.analysts);
  analystsRef.current = run.analysts;

  // planning -> awaiting_outline (local demo only)
  useEffect(() => {
    if (mode !== "local" || run.phase !== "planning") return;
    const timer = setTimeout(() => setRun((r) => ({ ...r, phase: "awaiting_outline" })), 350);
    return () => clearTimeout(timer);
  }, [mode, run.phase]);

  // analysts: stagger completion, then move to debate
  useEffect(() => {
    if (mode !== "local" || run.phase !== "analysts") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const base = 250;
    const step = 150;
    const count = analystsRef.current.length;
    setRun((r) => ({ ...r, analysts: r.analysts.map((a) => ({ ...a, status: "running" })) }));
    Array.from({ length: count }).forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setRun((r) => ({
            ...r,
            analysts: r.analysts.map((a, j) => (j === i ? { ...a, status: "done", text: "完成" } : a)),
          }));
        }, base + i * step),
      );
    });
    timers.push(
      setTimeout(() => setRun((r) => ({ ...r, phase: "debate" })), base + count * step + 150),
    );
    return () => timers.forEach(clearTimeout);
    // Depends on the phase only: watching the analysts array would restart the timers forever.
  }, [mode, run.phase]);

  // debate: append 4 turns, then verify, then done
  useEffect(() => {
    if (mode !== "local" || run.phase !== "debate") return;
    const turns = debateTurns();
    const timers: ReturnType<typeof setTimeout>[] = [];
    turns.forEach((turn, i) => {
      timers.push(setTimeout(() => setRun((r) => ({ ...r, debate: [...r.debate, turn] })), 150 + i * 150));
    });
    timers.push(setTimeout(() => setRun((r) => ({ ...r, phase: "verifying" })), 150 + turns.length * 150 + 120));
    return () => timers.forEach(clearTimeout);
  }, [mode, run.phase]);

  useEffect(() => {
    if (mode !== "local" || run.phase !== "verifying") return;
    const timer = setTimeout(
      () => setRun((r) => ({ ...r, phase: "done", verdict: verdictText(r.track) })),
      420,
    );
    return () => clearTimeout(timer);
  }, [mode, run.phase, run.track]);

  const start = useCallback(() => {
    taskRef.current = "t-" + Math.random().toString(36).slice(2, 10);
    setArchive("idle");
    // Start in local mode so the demo works without the runs service; the
    // stream upgrades the mode as soon as its first event arrives.
    setMode("local");
    setRun((r) => ({ ...r, phase: "planning", attempts: 0, debate: [], verdict: "", analysts: analystsFor(r.track) }));
    void (async () => {
      const reader = await openRunStream({
        mode: "start",
        task_id: taskRef.current,
        query: QUERY,
        market_track: run.track,
        sector_tag: run.track === "PRIMARY_PE_VC" ? "行星滚柱丝杠" : "机床零部件",
        project_id: run.projectId || undefined,
      });
      if (!reader) return;
      await consumeStream(reader, (event) => {
        setMode("stream");
        if (event.type === "outline") {
          const outline = outlineFrom(event);
          setRun((r) => ({ ...r, phase: "awaiting_outline", outline: outline.length ? outline : r.outline }));
        }
      });
    })();
  }, [run.track, run.projectId]);

  const approve = useCallback(() => {
    setRun((r) => ({ ...r, phase: "analysts", analysts: analystsFor(r.track) }));
    if (mode !== "stream") return;
    void (async () => {
      const reader = await openRunStream({
        mode: "approve",
        task_id: taskRef.current,
        query: QUERY,
        market_track: run.track,
      });
      if (!reader) return;
      await consumeStream(reader, (event) => {
        setMode("stream");
        if (event.type === "analyst") {
          setRun((r) => ({
            ...r,
            analysts: r.analysts.map((a) => (a.key === event.key ? { ...a, status: "done" } : a)),
          }));
        } else if (event.type === "debate") {
          setRun((r) => ({ ...r, debate: [...r.debate, debateFrom(event)] }));
        } else if (event.type === "phase" && event.phase === "done") {
          setRun((r) => ({ ...r, phase: "done", verdict: verdictText(r.track) }));
        }
      });
    })();
  }, [mode, run.track]);

  const reject = useCallback(() => {
    setRun((r) => ({ ...r, phase: "planning", attempts: r.attempts + 1 }));
    if (mode !== "stream") return;
    void (async () => {
      const reader = await openRunStream({
        mode: "reject",
        task_id: taskRef.current,
        query: QUERY,
        market_track: run.track,
      });
      if (!reader) return;
      await consumeStream(reader, (event) => {
        if (event.type === "outline") {
          const outline = outlineFrom(event);
          setRun((r) => ({ ...r, phase: "awaiting_outline", outline: outline.length ? outline : r.outline }));
        } else if (event.type === "phase" && event.phase === "failed") {
          setRun((r) => ({ ...r, phase: "rejected" }));
        }
      });
    })();
  }, [mode, run.track]);

  const changeTrack = useCallback((track: Track) => {
    setRun((r) => switchTrack(r, track));
  }, []);

  const archiveReflection = useCallback(async () => {
    if (!lesson.trim()) return;
    setArchive("saving");
    try {
      const res = await fetch("/api/invest/reflections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          market_track: run.track,
          sector_tag: run.track === "PRIMARY_PE_VC" ? "行星滚柱丝杠" : "机床零部件",
          original_thesis: run.verdict || "未给出结论",
          missed_risks: "订单可见度不足",
          lesson_learned: lesson,
          project_id: run.projectId || undefined,
        }),
      });
      setArchive(res.ok ? "saved" : "error");
    } catch {
      setArchive("error");
    }
  }, [lesson, run.track, run.verdict, run.projectId]);

  const busy = useMemo(
    () => ["planning", "analysts", "debate", "verifying", "awaiting_outline"].includes(run.phase),
    [run.phase],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-4 px-6 py-4">
          <div>
            <h1 className="text-base font-medium">投研工作台</h1>
            <p className="text-sm text-muted-foreground">
              双轨：一级市场尽调 · 二级市场覆盖 ·{" "}
              <span data-testid="stream-mode" className="font-mono text-xs">
                {mode === "stream" ? "SSE 实时流" : mode === "local" ? "本地演示" : "未连接"}
              </span>
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ModeSwitcher
              track={run.track}
              projectId={run.projectId}
              onTrackChange={changeTrack}
              onProjectChange={(projectId) => setRun((r) => ({ ...r, projectId }))}
              disabled={busy}
            />
            <Button data-testid="start-run" size="sm" onClick={start} disabled={busy}>
              开始研究
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1280px] gap-4 px-6 py-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="space-y-3">
          <OutlineReviewBar
            outline={run.outline}
            phase={run.phase}
            attempts={run.attempts}
            onApprove={approve}
            onReject={reject}
          />
          <Card data-testid="archive-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">复盘归档</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                data-testid="archive-lesson"
                className="min-h-16 text-sm"
                placeholder="这次判断错在哪？下次同类项目要记住什么"
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button
                  data-testid="archive-reflection"
                  size="sm"
                  disabled={run.phase !== "done" || !lesson.trim() || archive === "saving"}
                  onClick={() => void archiveReflection()}
                >
                  归档复盘
                </Button>
                <span className="text-xs text-muted-foreground" data-testid="archive-status">
                  {archive === "saved"
                    ? "已归档，下次同赛道辩论会引用"
                    : archive === "error"
                      ? "归档失败（API 未启动？）"
                      : run.phase === "done"
                        ? "可归档"
                        : "研究完成后可归档"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">证据溯源</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {run.citations.map((c) => (
                <button
                  key={c.chunkId}
                  type="button"
                  data-testid={"citation-" + c.chunkId}
                  className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => setCitation(c)}
                >
                  <span>{c.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">p.{c.page}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <AgentProgressPanel
            phase={run.phase}
            analysts={run.analysts}
            debate={run.debate}
            verdict={run.verdict}
          />
          <CompetitorMatrix track={run.track} rows={run.matrix} />
        </section>
      </main>

      <CitationPdfDrawer citation={citation} pdfUrl="/invest/sample.pdf" onClose={() => setCitation(null)} />
    </div>
  );
}
