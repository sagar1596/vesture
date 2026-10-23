import type { ReactNode } from "react";

export interface GanttTask {
  id: string;
  name: string;
  /** ISO date, `YYYY-MM-DD`. */
  start: string;
  /** ISO date, inclusive: a one-day task has `start === end`. */
  end: string;
  /** 0-100. */
  progress?: number;
  /** Nests this task under another; a task with children renders as a summary bar spanning them. */
  parentId?: string;
  /** Ids of tasks that must finish before this one starts; drawn as arrows. */
  dependsOn?: string[];
  /** `"milestone"` renders a diamond on `start` (its `end` is ignored). */
  type?: "task" | "milestone";
  /** Any CSS color for this task's bar; overrides `getBarColor` and the theme primary. */
  color?: string;
}

export interface GanttTaskChange {
  start: string;
  end: string;
}

export interface GanttColumn {
  key: string;
  header: ReactNode;
  /** Column width in px. */
  width: number;
  render: (task: GanttTask) => ReactNode;
}

export interface GanttProps {
  tasks: GanttTask[];
  /** Width of one day column in px. */
  dayWidth?: number;
  rowHeight?: number;
  /** Width of the task-name column in px. */
  listWidth?: number;
  /** Extra columns shown beside the task name (owner, status, dates...). */
  columns?: GanttColumn[];
  /** Header text for the name column. */
  nameHeader?: ReactNode;
  /** Forces the visible date range (ISO, inclusive) instead of fitting the tasks. */
  range?: { start: string; end: string };
  /** `"week"` labels only the first day of each week, for long projects at a small `dayWidth`. */
  scale?: "day" | "week";
  /** Days shaded as non-working, as `Date#getUTCDay` numbers (0 = Sunday). Default `[0, 6]`; pass `[]` for none. */
  weekendDays?: number[];
  showToday?: boolean;
  showDependencies?: boolean;
  /** Task ids collapsed on first render. */
  defaultCollapsed?: string[];
  /** Whole days a drag/Arrow key moves by. Default 1; use 7 to snap to weeks. */
  snapDays?: number;
  /** Per-task editing gate, in addition to `onTaskChange` being set (e.g. lock completed tasks). */
  isTaskEditable?: (task: GanttTask) => boolean;
  /** Bar color per task when `task.color` isn't set. */
  getBarColor?: (task: GanttTask) => string | undefined;
  /** Replaces the text drawn inside a bar. Return null for none. */
  renderBarLabel?: (task: GanttTask) => ReactNode;
  /** Highlights this date (ISO) instead of the real current date; mainly for tests and stories. */
  today?: string;
  /** Passing this enables dragging bars to move/resize and Arrow-key editing. */
  onTaskChange?: (taskId: string, change: GanttTaskChange) => void;
  onTaskClick?: (task: GanttTask) => void;
  className?: string;
}
