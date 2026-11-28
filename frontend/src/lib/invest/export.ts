import type { MatrixRow, Track } from "./types";

const TITLES: Record<Track, string[]> = {
  PRIMARY_PE_VC: ["公司", "最新轮次", "投后估值", "技术路线", "量产状态", "核心客户", "来源等级"],
  SECONDARY_EQUITY: ["代码", "名称", "总市值", "营收 CAGR", "毛利率", "ROE", "Forward PE", "PE 分位"],
};

const FIELDS: Record<Track, string[]> = {
  PRIMARY_PE_VC: ["company", "round", "post_money", "route", "status", "customer", "grade"],
  SECONDARY_EQUITY: ["ticker", "name", "cap", "rev_cagr", "gross", "roe", "fpe", "pct"],
};

export function toRows(track: Track, rows: MatrixRow[]): (string | number)[][] {
  const header = TITLES[track];
  const body = rows.map((r) => FIELDS[track].map((f) => r.cells[f] ?? ""));
  return [header, ...body];
}

export async function exportMatrix(track: Track, rows: MatrixRow[]): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(toRows(track, rows)), "matrix");
  const filename = "invest-matrix-" + track.toLowerCase() + ".xlsx";
  XLSX.writeFile(workbook, filename);
  return filename;
}
