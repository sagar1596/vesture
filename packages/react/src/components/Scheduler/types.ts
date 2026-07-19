export interface SchedulerEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  data?: unknown;
}

export interface SchedulerProps {
  events: SchedulerEvent[];
  /** Any date within the week being displayed. */
  date: Date;
  /** Fired by the prev/next/today week-navigation controls. */
  onDateChange?: (date: Date) => void;
  weekStartsOn?: 0 | 1;
  /** Visible time range, in hours (0-24). */
  startHour?: number;
  endHour?: number;
  /** Gridline density, in minutes. */
  slotDuration?: number;
  onEventClick?: (event: SchedulerEvent) => void;
  /**
   * Fired on drag-move drop or resize-release. Scheduler never mutates `events` itself —
   * same controlled philosophy as the rest of the library — the consumer decides whether to
   * accept the change and re-render with updated data.
   */
  onEventChange?: (event: SchedulerEvent, newStart: Date, newEnd: Date) => void;
  /**
   * Enables drag-to-move, drag-to-resize, and their keyboard equivalents (arrow keys to
   * move, Shift+arrow to resize) on timed events. All-day events are never draggable.
   * Defaults to false — existing consumers see zero behavior change.
   */
  editable?: boolean;
  /** Minimum resize duration, in minutes. Defaults to `slotDuration`. */
  minEventDuration?: number;
  /** Controlled highlight. */
  selectedEventId?: string;
  /** BCP 47 locale used for day/time label formatting via Intl.DateTimeFormat. */
  locale?: string;
  className?: string;
}
