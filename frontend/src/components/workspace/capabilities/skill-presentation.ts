import {
  BookOpenIcon,
  BriefcaseIcon,
  ChartNoAxesCombinedIcon,
  ClipboardListIcon,
  CodeIcon,
  FileSearchIcon,
  ImageIcon,
  LineChartIcon,
  MicIcon,
  PresentationIcon,
  RadarIcon,
  ScaleIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react";

import type { Skill } from "@/core/skills/type";

// Curated card summaries, not copies of the runtime skill descriptions.
// Keep keys aligned with skills/public; the catalog contract test checks this.
export const builtinSkillPresentation: Readonly<
  Record<string, { title: string; description: string; icon: LucideIcon }>
> = {
  "deep-research": {
    title: "深度研究",
    description: "并行分轨检索并核对一手来源，合成带引用与未决项的研究报告。",
    icon: SearchIcon,
  },
  "data-analysis": {
    title: "数据分析",
    description: "分析表格与结构化数据，发现规律，并用图表清晰呈现结论。",
    icon: ChartNoAxesCombinedIcon,
  },
  "academic-paper-review": {
    title: "学术论文审阅",
    description: "梳理论文的方法、贡献与不足，生成结构化评审和改进建议。",
    icon: BookOpenIcon,
  },
  "ppt-generation": {
    title: "演示文稿",
    description: "将想法与资料组织成完整的演示文稿，让内容更清晰、更易表达。",
    icon: PresentationIcon,
  },
  "frontend-design": {
    title: "前端设计",
    description: "按版式匹配开屏、字体纪律与反模板工艺，交付有观点的界面。",
    icon: CodeIcon,
  },
  "image-generation": {
    title: "图像创作",
    description: "根据描述生成图片，把构思变成可直接查看和使用的视觉素材。",
    icon: ImageIcon,
  },
  "podcast-generation": {
    title: "播客制作",
    description: "将资料和主题整理成播客内容，完成从脚本到音频的创作。",
    icon: MicIcon,
  },
  "skill-creator": {
    title: "技能创建",
    description: "把你的工作方法整理成可复用技能，帮助 Agent 掌握新的任务。",
    icon: SparklesIcon,
  },
  "skill-reviewer": {
    title: "技能审阅",
    description: "检查技能包的质量与潜在问题，给出可执行的改进建议。",
    icon: ShieldCheckIcon,
  },
  "systematic-literature-review": {
    title: "系统文献综述",
    description: "系统检索和整理研究文献，梳理主题、证据与尚待解决的问题。",
    icon: FileSearchIcon,
  },
  "invest-research-protocol": {
    title: "投研协议",
    description: "先定决策与可证伪假设，再按统一门槛推进个股、尽调与扫描。",
    icon: ScaleIcon,
  },
  "equity-research": {
    title: "个股研究",
    description: "按协议写上市标的研究笔记：评级、目标价、情景与证据链门槛。",
    icon: LineChartIcon,
  },
  "ic-memo": {
    title: "投委会备忘录",
    description:
      "私有/成长项目尽调：市场到条款全维度，给出 Invest/Pass/Watch。",
    icon: ClipboardListIcon,
  },
  "sector-scan": {
    title: "赛道扫描",
    description:
      "360° 梳理赛道定义、价值链、公司图谱与投资结论，并保留检索日志。",
    icon: RadarIcon,
  },
  "portfolio-review": {
    title: "持仓复盘",
    description: "检查 thesis 漂移与集中度风险，给出 hold/trim/add/exit 建议。",
    icon: BriefcaseIcon,
  },
  "reverse-dcf": {
    title: "反推 DCF",
    description: "从市价反解隐含增速，把估值要求翻译成可检验的经营条件。",
    icon: TrendingUpIcon,
  },
  "evidence-chain": {
    title: "证据链",
    description: "给主张打可验证证据分；草稿门槛 50，发布/投委会门槛 80。",
    icon: ShieldCheckIcon,
  },
  "stock-quote": {
    title: "行情快查",
    description:
      "查询 A 股与港股报价，并标出来源、证据档位和是否延时。不替代研究笔记。",
    icon: ChartNoAxesCombinedIcon,
  },
};

export function presentSkill(skill: Skill, locale: string) {
  const presentation =
    skill.category === "public" &&
    Object.hasOwn(builtinSkillPresentation, skill.name)
      ? builtinSkillPresentation[skill.name]
      : undefined;
  return {
    title: locale === "zh-CN" && presentation ? presentation.title : skill.name,
    description:
      locale === "zh-CN" && presentation
        ? presentation.description
        : skill.description,
    icon: presentation?.icon,
  };
}
