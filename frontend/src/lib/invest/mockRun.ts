import type {
  AnalystState,
  Citation,
  DebateTurn,
  MatrixRow,
  OutlineItem,
  RunState,
  Track,
} from "./types";

export const ROLES: Record<Track, { key: string; title: string }[]> = {
  PRIMARY_PE_VC: [
    { key: "tech_bom", title: "技术路线与产业链 BOM" },
    { key: "bm_tam", title: "商业模式与 Bottom-up TAM" },
    { key: "team_cap", title: "团队背景与股权融资" },
    { key: "exit_comps", title: "退出路径与可比公司" },
  ],
  SECONDARY_EQUITY: [
    { key: "fin_stmt", title: "基本面与财报勾稽" },
    { key: "val_model", title: "估值建模与预期差" },
    { key: "cycle_supply", title: "行业周期与供应链" },
    { key: "sentiment", title: "舆情、政策与催化" },
  ],
};

export const OUTLINE: OutlineItem[] = [
  { section: "一、赛道与产业链", why: "确定环节价值量与卡脖子点" },
  { section: "二、竞争格局", why: "判断公司位次与份额天花板" },
  { section: "三、公司与团队", why: "验证兑现记录与执行力" },
  { section: "四、估值与退出", why: "算 IRR/MOIC 与安全边际" },
  { section: "五、证伪条件", why: "给出可监控的 Kill Criteria" },
];

const DEBATE: DebateTurn[] = [
  { side: "bull", round: 1, text: "环节价值量高且路线已收敛，公司处在收敛侧。" },
  { side: "bear", round: 1, text: "客户双供应商政策把单家份额压到 40% 以下，30% 假设已接近上限。" },
  { side: "bull", round: 2, text: "良率 72.4% 已过盈亏平衡，规模上去毛利率仍有弹性。" },
  { side: "bear", round: 2, text: "订单可见度仅 4 个月，A 客户定点存在未消解冲突。" },
];

export const CITATIONS: Citation[] = [
  { docId: "bp_primary", page: 1, chunkId: "c_001", bbox: [60, 110, 510, 190], label: "BOM 占比 8–12%" },
  { docId: "bp_primary", page: 2, chunkId: "c_005", bbox: [60, 60, 510, 130], label: "2025 营收 4.2 亿" },
  { docId: "annual_secondary", page: 1, chunkId: "c_010", bbox: [60, 110, 510, 180], label: "应收周转 78 天" },
];

const PRIMARY_MATRIX: MatrixRow[] = [
  { key: "a", cells: { company: "项目A · 华擎精密", round: "B+ (2025)", post_money: "30 亿", route: "行星滚柱", status: "小批量 → 量产爬坡", customer: "两家整车厂", grade: "A" } },
  { key: "b", cells: { company: "恒立精密", round: "A 轮", post_money: "12 亿", route: "行星滚柱", status: "送样验证", customer: "未披露", grade: "B" } },
  { key: "c", cells: { company: "贝斯特 300580", round: "已上市", post_money: "78 亿", route: "滚珠 + 滚柱", status: "已量产", customer: "工业为主", grade: "S" } },
  { key: "d", cells: { company: "五洲新春 603667", round: "已上市", post_money: "95 亿", route: "布局中", status: "布局", customer: "—", grade: "S" } },
  { key: "e", cells: { company: "秦川机床 000837", round: "已上市", post_money: "112 亿", route: "设备端", status: "磨床设备", customer: "—", grade: "S" } },
];

const SECONDARY_MATRIX: MatrixRow[] = [
  { key: "a", cells: { ticker: "600519.SH", name: "贵州茅台", cap: "1836 亿", rev_cagr: "8.2%", gross: "91.6%", roe: "31.4%", fpe: "22.4x", pct: "38%" } },
  { key: "b", cells: { ticker: "300580.SZ", name: "贝斯特", cap: "78 亿", rev_cagr: "18.4%", gross: "31.2%", roe: "9.8%", fpe: "38.6x", pct: "72%" } },
  { key: "c", cells: { ticker: "603667.SH", name: "五洲新春", cap: "95 亿", rev_cagr: "12.1%", gross: "22.6%", roe: "7.4%", fpe: "42.1x", pct: "81%" } },
  { key: "d", cells: { ticker: "000837.SZ", name: "秦川机床", cap: "112 亿", rev_cagr: "-3.4%", gross: "18.9%", roe: "4.2%", fpe: "29.5x", pct: "56%" } },
  { key: "e", cells: { ticker: "300770.SZ", name: "示例高估值", cap: "24 亿", rev_cagr: "22.0%", gross: "17.6%", roe: "-6.1%", fpe: "96.2x", pct: "95%" } },
];

export function initialRun(track: Track, projectId = ""): RunState {
  return {
    track,
    phase: "idle",
    projectId: track === "PRIMARY_PE_VC" ? projectId : "",
    attempts: 0,
    outline: OUTLINE,
    analysts: ROLES[track].map((r) => ({ ...r, status: "pending" })),
    debate: [],
    verdict: "",
    citations: CITATIONS,
    matrix: track === "PRIMARY_PE_VC" ? PRIMARY_MATRIX : SECONDARY_MATRIX,
  };
}

export function switchTrack(state: RunState, track: Track): RunState {
  return { ...initialRun(track, state.projectId), phase: "planning", attempts: 0 };
}

export function analystsFor(track: Track): AnalystState[] {
  return ROLES[track].map((r) => ({ ...r, status: "pending" as const }));
}

export function debateTurns(): DebateTurn[] {
  return DEBATE.map((t) => ({ ...t }));
}

export function verdictText(track: Track): string {
  return track === "PRIMARY_PE_VC"
    ? "持续跟踪：标的成立、价格偏贵，触发价 ≤ 25 亿。"
    : "增持偏中性：预期差主要来自毛利率，目标价区间 28–34。";
}
