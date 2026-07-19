import { vars } from "@vesture/tokens";

/** Pixel height of one `slotDuration` row in the time grid — shared between layout math and Scheduler.css.ts's gridline background sizing. */
export const SLOT_HEIGHT_PX = 24;

export interface OverlapLayoutInput {
  id: string;
  start: Date;
  end: Date;
}

export interface OverlapLayoutResult {
  id: string;
  /** 0-based column within this event's overlap cluster. */
  columnIndex: number;
  /** Total columns in this event's overlap cluster — width = 100% / columnCount. */
  columnCount: number;
}

/**
 * Cluster-and-pack overlap layout for a single day's timed (non-all-day) events.
 *
 * 1. Sort by start time.
 * 2. Sweep forward, grouping events into overlap clusters: an event joins the current
 *    cluster if it starts before the cluster's running max end time, so two events that
 *    don't directly overlap can still land in the same cluster when a third event bridges
 *    them (sorting by start makes this sweep equivalent to transitive-overlap grouping).
 * 3. Within each cluster, greedily assign each event the lowest-index column whose
 *    previous occupant has already ended by this event's start (classic interval-graph
 *    coloring). Touching endpoints (a.end === b.start) do not count as overlapping.
 */
export function layoutOverlappingEvents(
  events: OverlapLayoutInput[]
): OverlapLayoutResult[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => {
    const startDiff = a.start.getTime() - b.start.getTime();
    if (startDiff !== 0) return startDiff;
    return a.end.getTime() - b.end.getTime();
  });

  const results = new Map<string, OverlapLayoutResult>();

  let cluster: OverlapLayoutInput[] = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const columnEndTimes: number[] = [];
    for (const event of cluster) {
      const startTime = event.start.getTime();
      let columnIndex = columnEndTimes.findIndex((end) => end <= startTime);
      if (columnIndex === -1) {
        columnIndex = columnEndTimes.length;
        columnEndTimes.push(event.end.getTime());
      } else {
        columnEndTimes[columnIndex] = event.end.getTime();
      }
      results.set(event.id, { id: event.id, columnIndex, columnCount: 0 });
    }
    const columnCount = columnEndTimes.length;
    for (const event of cluster) {
      results.get(event.id)!.columnCount = columnCount;
    }
    cluster = [];
  };

  for (const event of sorted) {
    const startTime = event.start.getTime();
    const endTime = event.end.getTime();
    if (cluster.length === 0 || startTime < clusterEnd) {
      cluster.push(event);
      clusterEnd = Math.max(clusterEnd, endTime);
    } else {
      flushCluster();
      cluster.push(event);
      clusterEnd = endTime;
    }
  }
  flushCluster();

  return events.map((event) => results.get(event.id)!);
}

export interface VerticalMetrics {
  /** Percentage (0-100) from the top of the visible grid. */
  top: number;
  /** Percentage (0-100) of the visible grid's height. */
  height: number;
}

/**
 * Maps an event's start/end into a percentage-based vertical position within the visible
 * `[startHour, endHour)` range, clipping either edge that falls outside it. Returns `null`
 * when the event doesn't intersect the visible range at all — clip-don't-exclude is the
 * chosen behavior for partially-visible events (an event that starts before the grid but
 * runs into it should still show a truncated block), but events entirely outside the range
 * are dropped rather than rendered as zero-height slivers.
 */
export function getVerticalMetrics(
  start: Date,
  end: Date,
  startHour: number,
  endHour: number
): VerticalMetrics | null {
  const rangeStartMinutes = startHour * 60;
  const rangeEndMinutes = endHour * 60;
  const totalMinutes = rangeEndMinutes - rangeStartMinutes;
  if (totalMinutes <= 0) return null;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const clippedStart = Math.max(startMinutes, rangeStartMinutes);
  const clippedEnd = Math.min(endMinutes, rangeEndMinutes);
  if (clippedEnd <= clippedStart) return null;

  return {
    top: ((clippedStart - rangeStartMinutes) / totalMinutes) * 100,
    height: ((clippedEnd - clippedStart) / totalMinutes) * 100,
  };
}

/**
 * Converts a pointer's vertical pixel delta into a snapped minutes delta, using the same
 * SLOT_HEIGHT_PX-per-slotDuration relationship the time grid renders with — this is the one
 * place pixel-to-time conversion happens; drag-to-move, resize, and their keyboard
 * equivalents all funnel through this rather than re-deriving the mapping.
 */
export function pixelDeltaToSnappedMinutes(deltaPx: number, slotDuration: number): number {
  const rawSlots = deltaPx / SLOT_HEIGHT_PX;
  return Math.round(rawSlots) * slotDuration;
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Builds a Date on `day`'s calendar date at `minutesOfDay` time-of-day. */
export function combineDayAndMinutes(day: Date, minutesOfDayValue: number): Date {
  const result = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  result.setMinutes(minutesOfDayValue);
  return result;
}

export interface MoveResult {
  start: Date;
  end: Date;
}

/**
 * Computes a moved event's new start/end from a pixel delta + target day, snapped to
 * slotDuration and clamped so the event never starts before startHour or ends after endHour.
 * Duration is always preserved exactly — a move never changes an event's length.
 */
export function computeMoveResult(params: {
  originalStart: Date;
  originalEnd: Date;
  targetDay: Date;
  deltaYPx: number;
  slotDuration: number;
  startHour: number;
  endHour: number;
}): MoveResult {
  const { originalStart, originalEnd, targetDay, deltaYPx, slotDuration, startHour, endHour } =
    params;
  const durationMinutes = (originalEnd.getTime() - originalStart.getTime()) / 60000;
  const deltaMinutes = pixelDeltaToSnappedMinutes(deltaYPx, slotDuration);
  const rawStartMinutes = minutesOfDay(originalStart) + deltaMinutes;

  const rangeStart = startHour * 60;
  const rangeEnd = endHour * 60;
  const maxStart = Math.max(rangeStart, rangeEnd - durationMinutes);
  const clampedStartMinutes = Math.min(Math.max(rawStartMinutes, rangeStart), maxStart);

  const start = combineDayAndMinutes(targetDay, clampedStartMinutes);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return { start, end };
}

/**
 * Computes a resized event's new end time from a pixel delta, snapped to slotDuration and
 * clamped to [originalStart + minEventDuration, endHour]. Start time never changes.
 */
export function computeResizeResult(params: {
  originalStart: Date;
  originalEnd: Date;
  deltaYPx: number;
  slotDuration: number;
  minEventDuration: number;
  endHour: number;
}): { end: Date } {
  const { originalStart, originalEnd, deltaYPx, slotDuration, minEventDuration, endHour } =
    params;
  const deltaMinutes = pixelDeltaToSnappedMinutes(deltaYPx, slotDuration);
  const rawEndMinutes = minutesOfDay(originalEnd) + deltaMinutes;
  const startMinutes = minutesOfDay(originalStart);
  const rangeEnd = endHour * 60;
  const clampedEndMinutes = Math.min(
    Math.max(rawEndMinutes, startMinutes + minEventDuration),
    rangeEnd
  );
  const end = combineDayAndMinutes(originalStart, clampedEndMinutes);
  return { end };
}

/** Same fixed-order categorical cycle the chart components use, for visual consistency. */
export const SERIES_COLOR_CYCLE: readonly string[] = [
  vars.chart.series1,
  vars.chart.series2,
  vars.chart.series3,
  vars.chart.series4,
  vars.chart.series5,
  vars.chart.series6,
  vars.chart.series7,
  vars.chart.series8,
];

/** Stable djb2-style string hash, used to key an event's fallback color to its id so the same event always gets the same color across re-renders. */
export function hashStringToIndex(value: string, bucketCount: number): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash) % bucketCount;
}

export function getEventColor(id: string, override: string | undefined): string {
  if (override) return override;
  return SERIES_COLOR_CYCLE[hashStringToIndex(id, SERIES_COLOR_CYCLE.length)]!;
}
