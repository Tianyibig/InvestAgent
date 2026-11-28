"use client";


import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportMatrix } from "@/lib/invest/export";
import type { MatrixRow, Track } from "@/lib/invest/types";

ModuleRegistry.registerModules([AllCommunityModule]);

const COLUMNS: Record<Track, { field: string; headerName: string }[]> = {
  PRIMARY_PE_VC: [
    { field: "company", headerName: "公司" },
    { field: "round", headerName: "最新轮次" },
    { field: "post_money", headerName: "投后估值" },
    { field: "route", headerName: "技术路线" },
    { field: "status", headerName: "量产状态" },
    { field: "customer", headerName: "核心客户" },
    { field: "grade", headerName: "来源等级" },
  ],
  SECONDARY_EQUITY: [
    { field: "ticker", headerName: "代码" },
    { field: "name", headerName: "名称" },
    { field: "cap", headerName: "总市值" },
    { field: "rev_cagr", headerName: "营收 CAGR" },
    { field: "gross", headerName: "毛利率" },
    { field: "roe", headerName: "ROE" },
    { field: "fpe", headerName: "Forward PE" },
    { field: "pct", headerName: "PE 分位" },
  ],
};

interface Props {
  track: Track;
  rows: MatrixRow[];
}

export function CompetitorMatrix({ track, rows }: Props) {
  const columnDefs = useMemo<ColDef<MatrixRow>[]>(
    () =>
      COLUMNS[track].map((c) => ({
        colId: c.field,
        headerName: c.headerName,
        valueGetter: (p) => p.data?.cells[c.field] ?? "",
      })),
    [track],
  );
  const rowData = rows;

  return (
    <Card data-testid="matrix-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>{track === "PRIMARY_PE_VC" ? "竞争格局矩阵" : "可比估值矩阵"}</span>
          <Button
            data-testid="export-xlsx"
            size="sm"
            variant="outline"
            onClick={() => void exportMatrix(track, rowData)}
          >
            导出 Excel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full" data-testid="matrix-grid">
          <AgGridReact
            theme={themeQuartz}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{ flex: 1, minWidth: 110, resizable: true }}
            suppressCellFocus
            headerHeight={36}
            rowHeight={34}
          />
        </div>
      </CardContent>
    </Card>
  );
}
