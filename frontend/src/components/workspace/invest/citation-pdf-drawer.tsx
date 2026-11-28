"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { boxToRect, scaleFor, type Rect } from "@/lib/invest/bbox";
import type { Citation } from "@/lib/invest/types";

interface Props {
  citation: Citation | null;
  pdfUrl: string;
  onClose: () => void;
}

export function CitationPdfDrawer({ citation, pdfUrl, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!citation) {
      setRect(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/invest/pdf.worker.min.mjs";
        const doc = await pdfjs.getDocument({ url: pdfUrl }).promise;
        const page = await doc.getPage(citation.page);
        const base = page.getViewport({ scale: 1 });
        const containerWidth = canvasRef.current?.parentElement?.clientWidth ?? 520;
        const scale = scaleFor(base.width, containerWidth);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        if (!cancelled) setRect(boxToRect(citation.bbox, base.height, scale));
        setError("");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "PDF 渲染失败");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [citation, pdfUrl]);

  if (!citation) return null;

  return (
    <aside
      data-testid="pdf-drawer"
      className="fixed inset-y-0 right-0 z-50 flex w-[560px] max-w-full flex-col border-l border-border bg-card shadow-lg"
      aria-label="原文溯源"
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{citation.label}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {citation.docId} · p.{citation.page} · {citation.chunkId}
          </p>
        </div>
        <Button className="ml-auto" size="sm" variant="outline" onClick={onClose} data-testid="pdf-close">
          关闭
        </Button>
      </header>
      <div className="relative flex-1 overflow-auto p-4" data-testid="pdf-stage">
        <div className="relative inline-block">
          <canvas ref={canvasRef} className="block rounded-md border border-border" />
          {rect ? (
            <div
              data-testid="pdf-highlight"
              className="pointer-events-none absolute rounded-sm border border-destructive bg-destructive/15"
              style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
            />
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>
    </aside>
  );
}
