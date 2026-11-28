"use client";

import { Input } from "@/components/ui/input";
import type { Track } from "@/lib/invest/types";
import { cn } from "@/lib/utils";

interface Props {
  track: Track;
  projectId: string;
  onTrackChange: (track: Track) => void;
  onProjectChange: (projectId: string) => void;
  disabled?: boolean;
}

export function ModeSwitcher({ track, projectId, onTrackChange, onProjectChange, disabled }: Props) {
  const primary = track === "PRIMARY_PE_VC";
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="mode-switcher">
      <div className="inline-flex rounded-md border border-border bg-secondary p-0.5" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={primary}
          data-testid="mode-primary"
          className={cn(
            "rounded-sm px-3 py-1 text-sm transition-colors",
            primary ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
          )}
          onClick={() => onTrackChange("PRIMARY_PE_VC")}
          disabled={disabled}
        >
          一级市场（PE/VC）
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!primary}
          data-testid="mode-secondary"
          className={cn(
            "rounded-sm px-3 py-1 text-sm transition-colors",
            !primary ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
          )}
          onClick={() => onTrackChange("SECONDARY_EQUITY")}
          disabled={disabled}
        >
          二级市场（股票）
        </button>
      </div>

      {primary ? (
        <>
          <Input
            data-testid="project-input"
            className="h-8 w-44 text-sm"
            placeholder="project_id，如 PROJ_A"
            value={projectId}
            onChange={(e) => onProjectChange(e.target.value)}
            disabled={disabled}
          />
          <label className="text-sm text-muted-foreground">
            <span className="mr-2">Data Room</span>
            <input
              type="file"
              data-testid="dataroom-input"
              className="text-sm text-muted-foreground file:mr-2 file:rounded-md file:border file:border-border file:bg-card file:px-2 file:py-1 file:text-sm"
              disabled={disabled}
            />
          </label>
        </>
      ) : (
        <span className="text-sm text-muted-foreground" data-testid="ticker-hint">
          标的：600519.SH · 数据源 akshare
        </span>
      )}
    </div>
  );
}
