import type { ScheduleValue } from "@/components/workspace/scheduled-task-schedule-input";

export type RecipeTitleKey =
  | "trending"
  | "news"
  | "issues"
  | "weekly"
  | "portfolioDaily";

export type Recipe = {
  id: string;
  icon: string;
  titleKey: RecipeTitleKey;
  schedule: ScheduleValue;
};

// Front-end-only starter recipes. Title, description and instructions live in
// i18n (`scheduledTasks.recipes.<titleKey>`), so a recipe applied in Chinese
// stores Chinese instructions. The schedule's timezone is left empty so the
// ScheduleInput falls back to the browser-detected timezone when applied.
// `{{repo}}` / `{{holdings}}` style placeholders are intentional — the user
// fills them in the instructions after applying the recipe.
export const RECIPES: Recipe[] = [
  {
    id: "portfolio-daily",
    icon: "📈",
    titleKey: "portfolioDaily",
    schedule: {
      // Weekday 18:30 local — after CN A-share close; browser timezone fills in.
      schedule_type: "cron",
      schedule_spec: { cron: "30 18 * * 1-5" },
      timezone: "",
    },
  },
  {
    id: "trending",
    icon: "🔥",
    titleKey: "trending",
    schedule: {
      schedule_type: "cron",
      schedule_spec: { cron: "0 9 * * *" },
      timezone: "",
    },
  },
  {
    id: "news",
    icon: "📰",
    titleKey: "news",
    schedule: {
      schedule_type: "cron",
      schedule_spec: { cron: "0 9 * * *" },
      timezone: "",
    },
  },
  {
    id: "issues",
    icon: "🏷️",
    titleKey: "issues",
    schedule: {
      schedule_type: "cron",
      schedule_spec: { cron: "0 9 * * *" },
      timezone: "",
    },
  },
  {
    id: "weekly",
    icon: "📅",
    titleKey: "weekly",
    schedule: {
      schedule_type: "cron",
      schedule_spec: { cron: "0 9 * * 1" },
      timezone: "",
    },
  },
];
