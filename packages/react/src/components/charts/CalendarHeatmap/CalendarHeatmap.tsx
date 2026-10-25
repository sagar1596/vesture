import type { ReactElement } from "react";
import { vars } from "@vesture/tokens";
import { buildCalendar, levelFor, toISO } from "./calendar-heatmap";
import { cell as cellClass, legend, legendCell, root, text } from "./CalendarHeatmap.css";

export interface CalendarHeatmapDatum {
  /** ISO `YYYY-MM-DD`. Duplicate dates are summed. */
  date: string;
  value: number;
}

export interface CalendarHeatmapProps {
  data: CalendarHeatmapDatum[];
  /** Inclusive ISO range. Defaults to the 53 weeks ending at `end` (today when omitted). */
  start?: string;
  end?: string;
  /** Shortcut: show Jan 1 – Dec 31 of this year. */
  year?: number;
  weekStart?: 0 | 1 | 6;
  cellSize?: number;
  gap?: number;
  cellRadius?: number;
  /** One color per level; index 0 is the empty color. Defaults to 5 tints of the primary token. */
  colors?: string[];
  /** Override the auto-detected [min, max] used for level mapping. */
  domain?: [number, number];
  showMonthLabels?: boolean;
  showWeekdayLabels?: boolean;
  showLegend?: boolean;
  legendLabels?: [string, string];
  /** Replaces the default `date: value` tooltip text. */
  formatTooltip?: (date: string, value: number | undefined) => string;
  onDayClick?: (date: string, value: number | undefined) => void;
  className?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const defaultColors = [0, 25, 45, 70, 100].map((pct) =>
  pct === 0 ? vars.color.surfaceRaised : `color-mix(in srgb, ${vars.color.primary} ${pct}%, ${vars.color.surface})`
);

/** GitHub-style contribution calendar: one cell per day, columns are weeks. */
export function CalendarHeatmap({
  data,
  start,
  end,
  year,
  weekStart = 0,
  cellSize = 12,
  gap = 3,
  cellRadius = 2,
  colors = defaultColors,
  domain,
  showMonthLabels = true,
  showWeekdayLabels = true,
  showLegend = true,
  legendLabels = ["Less", "More"],
  formatTooltip = (d, v) => `${d}: ${v ?? 0}`,
  onDayClick,
  className
}: CalendarHeatmapProps): ReactElement {
  const endISO = year !== undefined ? `${year}-12-31` : (end ?? toISO(Date.now()));
  const startISO =
    year !== undefined
      ? `${year}-01-01`
      : (start ?? toISO(Date.parse(`${endISO}T00:00:00Z`) - 52 * 7 * 86_400_000));
  const values = new Map<string, number>();
  for (const d of data) values.set(d.date, (values.get(d.date) ?? 0) + d.value);
  const { cells, weeks } = buildCalendar(startISO, endISO, values, weekStart);
  const inRange = cells.map((c) => c.value).filter((v): v is number => v !== undefined && v > 0);
  const [min, max] = domain ?? [inRange.length ? Math.min(...inRange) : 0, inRange.length ? Math.max(...inRange) : 0];
  const step = cellSize + gap;
  const left = showWeekdayLabels ? 30 : 0;
  const top = showMonthLabels ? 18 : 0;
  const width = left + weeks * step;
  const height = top + 7 * step;

  const monthLabels: { week: number; label: string }[] = [];
  let lastMonth = -1;
  for (const c of cells) {
    if (c.row === 0 || c === cells[0]) {
      if (c.month !== lastMonth) {
        monthLabels.push({ week: c.week, label: MONTHS[c.month]! });
        lastMonth = c.month;
      }
    }
  }

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width: "fit-content", maxWidth: "100%", overflowX: "auto" }}>
      <svg width={width} height={height} role="img" aria-label="Calendar heatmap">
        {showMonthLabels
          ? monthLabels.map((m) => (
              <text key={`${m.week}${m.label}`} className={text} x={left + m.week * step} y={11}>
                {m.label}
              </text>
            ))
          : null}
        {showWeekdayLabels
          ? [1, 3, 5].map((r) => (
              <text key={r} className={text} x={0} y={top + r * step + cellSize - 2}>
                {WEEKDAYS[(r + weekStart) % 7]}
              </text>
            ))
          : null}
        {cells.map((c) => {
          const level = levelFor(c.value, min, max, colors.length);
          return (
            <rect
              key={c.date}
              className={cellClass}
              data-testid="calendar-day"
              data-date={c.date}
              data-level={level}
              x={left + c.week * step}
              y={top + c.row * step}
              width={cellSize}
              height={cellSize}
              rx={cellRadius}
              fill={colors[level]}
              tabIndex={onDayClick ? 0 : undefined}
              role={onDayClick ? "button" : undefined}
              aria-label={formatTooltip(c.date, c.value)}
              style={onDayClick ? { cursor: "pointer" } : undefined}
              onClick={onDayClick ? () => onDayClick(c.date, c.value) : undefined}
              onKeyDown={
                onDayClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onDayClick(c.date, c.value);
                      }
                    }
                  : undefined
              }
            >
              <title>{formatTooltip(c.date, c.value)}</title>
            </rect>
          );
        })}
      </svg>
      {showLegend ? (
        <div className={legend}>
          <span>{legendLabels[0]}</span>
          {colors.map((c, i) => (
            <span key={i} className={legendCell} style={{ background: c, borderRadius: cellRadius }} />
          ))}
          <span>{legendLabels[1]}</span>
        </div>
      ) : null}
    </div>
  );
}
