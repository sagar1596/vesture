const DAY = 86_400_000;

export function parseISO(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y!, (m ?? 1) - 1, d ?? 1);
}
export function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface CalendarCell {
  date: string;
  /** Column (week) and row (weekday offset from weekStart). */
  week: number;
  row: number;
  value: number | undefined;
  month: number;
}

/** Lays [start, end] (inclusive ISO dates) onto a week-column grid. */
export function buildCalendar(
  start: string,
  end: string,
  values: Map<string, number>,
  weekStart: 0 | 1 | 6
): { cells: CalendarCell[]; weeks: number } {
  const s = parseISO(start);
  const e = parseISO(end);
  const startDow = (new Date(s).getUTCDay() - weekStart + 7) % 7;
  const gridStart = s - startDow * DAY;
  const cells: CalendarCell[] = [];
  for (let t = s; t <= e; t += DAY) {
    const idx = Math.round((t - gridStart) / DAY);
    const iso = toISO(t);
    cells.push({ date: iso, week: Math.floor(idx / 7), row: idx % 7, value: values.get(iso), month: new Date(t).getUTCMonth() });
  }
  return { cells, weeks: cells.length ? cells[cells.length - 1]!.week + 1 : 0 };
}

/** Maps a value onto 0..levels-1 over [min, max]; 0 is reserved for "no activity". */
export function levelFor(value: number | undefined, min: number, max: number, levels: number): number {
  if (value === undefined || value <= 0 || levels < 2) return 0;
  if (max <= min) return levels - 1;
  const frac = (value - min) / (max - min);
  return Math.min(levels - 1, Math.max(1, 1 + Math.floor(frac * (levels - 1))));
}
