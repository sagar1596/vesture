import { useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
} from "react";
import {
  allDayCell,
  allDayEventBlock,
  allDayGutter,
  allDayRow,
  dayColumn,
  dayHeaderCell,
  dayHeaderDateNumber,
  dayHeaderGutter,
  dayHeaderRow,
  dragPreview,
  dragPreviewLabel,
  eventBlock,
  eventTime,
  eventTitle,
  header,
  headerNav,
  hourLabel,
  navButton,
  nowLine,
  nowLineDot,
  rangeLabel,
  resizeHandle,
  root,
  scrollArea,
  timeGutter,
  todayButton,
  visuallyHidden,
} from "./Scheduler.css";
import {
  computeMoveResult,
  computeResizeResult,
  getEventColor,
  getVerticalMetrics,
  layoutOverlappingEvents,
  SLOT_HEIGHT_PX,
} from "./scheduler-layout";
import type { SchedulerEvent, SchedulerProps } from "./types";
import { addDays, clampToMidnight, isSameDay, startOfWeek } from "../../utils/date";

function formatEventTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

interface DragState {
  kind: "move" | "resize";
  event: SchedulerEvent;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startDayIndex: number;
  currentDayIndex: number;
  currentStart: Date;
  currentEnd: Date;
  moved: boolean;
}

export function Scheduler({
  events,
  date,
  onDateChange,
  weekStartsOn = 1,
  startHour = 0,
  endHour = 24,
  slotDuration = 30,
  onEventClick,
  onEventChange,
  editable = false,
  minEventDuration,
  selectedEventId,
  locale = "en-US",
  className,
}: SchedulerProps): ReactElement {
  const weekStart = useMemo(
    () => startOfWeek(clampToMidnight(date), weekStartsOn),
    [date, weekStartsOn]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const today = useMemo(() => clampToMidnight(new Date()), []);
  const now = useMemo(() => new Date(), []);

  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short" }),
    [locale]
  );
  const dayNumberFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric" }),
    [locale]
  );
  const monthDayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }),
    [locale]
  );
  const yearFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { year: "numeric" }),
    [locale]
  );
  const hourFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "numeric" }),
    [locale]
  );
  const weekdayLongFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long" }),
    [locale]
  );

  const weekEnd = days[6]!;
  const rangeLabelText = `${monthDayFormatter.format(weekStart)} – ${monthDayFormatter.format(weekEnd)}, ${yearFormatter.format(weekEnd)}`;

  const totalMinutes = (endHour - startHour) * 60;
  const slotsCount = Math.max(1, Math.ceil(totalMinutes / slotDuration));
  const totalHeightPx = slotsCount * SLOT_HEIGHT_PX;
  const resolvedMinEventDuration = minEventDuration ?? slotDuration;

  const hourMarks = useMemo(() => {
    const marks: { hour: number; label: string; top: number }[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      const labelDate = new Date(2000, 0, 1, hour === 24 ? 0 : hour, 0);
      marks.push({
        hour,
        label: hourFormatter.format(labelDate),
        top: ((hour - startHour) * 60 / totalMinutes) * 100,
      });
    }
    return marks;
  }, [startHour, endHour, totalMinutes, hourFormatter]);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMinutes >= startHour * 60 && nowMinutes < endHour * 60;
  const nowTop = ((nowMinutes - startHour * 60) / totalMinutes) * 100;

  const allDayEventsByDay = useMemo(
    () =>
      days.map((day) =>
        events.filter((event) => event.allDay && isSameDay(event.start, day))
      ),
    [days, events]
  );

  const timedEventsByDay = useMemo(
    () =>
      days.map((day) => {
        const dayEvents = events.filter(
          (event) => !event.allDay && isSameDay(event.start, day)
        );
        const layout = layoutOverlappingEvents(
          dayEvents.map((event) => ({
            id: event.id,
            start: event.start,
            end: event.end,
          }))
        );
        const layoutById = new Map(layout.map((l) => [l.id, l]));
        return dayEvents
          .map((event) => {
            const metrics = getVerticalMetrics(
              event.start,
              event.end,
              startHour,
              endHour
            );
            if (!metrics) return null;
            const placement = layoutById.get(event.id)!;
            return { event, metrics, placement };
          })
          .filter(
            (
              entry
            ): entry is {
              event: SchedulerEvent;
              metrics: NonNullable<ReturnType<typeof getVerticalMetrics>>;
              placement: ReturnType<typeof layoutOverlappingEvents>[number];
            } => entry !== null
          );
      }),
    [days, events, startHour, endHour]
  );

  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const suppressClickRef = useRef(false);
  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>([]);

  const announceMove = (event: SchedulerEvent, start: Date, end: Date) => {
    setAnnouncement(
      `${event.title} moved to ${weekdayLongFormatter.format(start)}, ${formatEventTime(start, locale)} to ${formatEventTime(end, locale)}.`
    );
  };

  const announceResize = (event: SchedulerEvent, end: Date) => {
    setAnnouncement(
      `${event.title} resized to end at ${formatEventTime(end, locale)}.`
    );
  };

  const handleEventActivate = (event: SchedulerEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onEventClick?.(event);
  };

  const handleMovePointerDown =
    (event: SchedulerEvent, dayIndex: number) => (pointerEvent: ReactPointerEvent<HTMLButtonElement>) => {
      if (!editable) return;
      pointerEvent.preventDefault();
      const target = pointerEvent.currentTarget;
      try {
        target.setPointerCapture(pointerEvent.pointerId);
      } catch {
        // Pointer capture isn't implemented in every test/DOM environment; drag still
        // works without it as long as the pointer stays over the captured element.
      }
      target.focus();
      setDrag({
        kind: "move",
        event,
        pointerId: pointerEvent.pointerId,
        startClientX: pointerEvent.clientX,
        startClientY: pointerEvent.clientY,
        startDayIndex: dayIndex,
        currentDayIndex: dayIndex,
        currentStart: event.start,
        currentEnd: event.end,
        moved: false,
      });
    };

  const handleResizePointerDown =
    (event: SchedulerEvent, dayIndex: number) => (pointerEvent: ReactPointerEvent<HTMLSpanElement>) => {
      if (!editable) return;
      pointerEvent.preventDefault();
      pointerEvent.stopPropagation();
      const target = pointerEvent.currentTarget;
      try {
        target.setPointerCapture(pointerEvent.pointerId);
      } catch {
        // See handleMovePointerDown.
      }
      setDrag({
        kind: "resize",
        event,
        pointerId: pointerEvent.pointerId,
        startClientX: pointerEvent.clientX,
        startClientY: pointerEvent.clientY,
        startDayIndex: dayIndex,
        currentDayIndex: dayIndex,
        currentStart: event.start,
        currentEnd: event.end,
        moved: false,
      });
    };

  const handleDragPointerMove = (
    pointerEvent: ReactPointerEvent<HTMLButtonElement | HTMLSpanElement>
  ) => {
    if (!drag || pointerEvent.pointerId !== drag.pointerId) return;
    // The resize handle is nested inside the event button, and both have pointer handlers —
    // without this, a resize-handle event would bubble up and re-run the button's copy too.
    pointerEvent.stopPropagation();
    const deltaY = pointerEvent.clientY - drag.startClientY;

    if (drag.kind === "move") {
      const deltaX = pointerEvent.clientX - drag.startClientX;
      const columnWidth =
        dayColumnRefs.current[drag.startDayIndex]?.getBoundingClientRect().width ?? 0;
      const dayDelta = columnWidth > 0 ? Math.round(deltaX / columnWidth) : 0;
      const targetDayIndex = Math.min(6, Math.max(0, drag.startDayIndex + dayDelta));
      const targetDay = days[targetDayIndex]!;
      const { start, end } = computeMoveResult({
        originalStart: drag.event.start,
        originalEnd: drag.event.end,
        targetDay,
        deltaYPx: deltaY,
        slotDuration,
        startHour,
        endHour,
      });
      const moved =
        targetDayIndex !== drag.startDayIndex ||
        start.getTime() !== drag.event.start.getTime();
      setDrag({ ...drag, currentDayIndex: targetDayIndex, currentStart: start, currentEnd: end, moved });
    } else {
      const { end } = computeResizeResult({
        originalStart: drag.event.start,
        originalEnd: drag.event.end,
        deltaYPx: deltaY,
        slotDuration,
        minEventDuration: resolvedMinEventDuration,
        endHour,
      });
      const moved = end.getTime() !== drag.event.end.getTime();
      setDrag({ ...drag, currentEnd: end, moved });
    }
  };

  const handleDragPointerUp = (
    pointerEvent: ReactPointerEvent<HTMLButtonElement | HTMLSpanElement>
  ) => {
    if (!drag || pointerEvent.pointerId !== drag.pointerId) return;
    pointerEvent.stopPropagation();
    const finished = drag;
    setDrag(null);

    if (finished.kind === "move") {
      if (!finished.moved) {
        suppressClickRef.current = true;
        onEventClick?.(finished.event);
        return;
      }
      onEventChange?.(finished.event, finished.currentStart, finished.currentEnd);
      announceMove(finished.event, finished.currentStart, finished.currentEnd);
      return;
    }

    if (!finished.moved) return;
    onEventChange?.(finished.event, finished.currentStart, finished.currentEnd);
    announceResize(finished.event, finished.currentEnd);
  };

  const handleDragPointerCancel = (
    pointerEvent: ReactPointerEvent<HTMLButtonElement | HTMLSpanElement>
  ) => {
    if (!drag || pointerEvent.pointerId !== drag.pointerId) return;
    pointerEvent.stopPropagation();
    setDrag(null);
  };

  const handleEventKeyDown = (
    keyboardEvent: ReactKeyboardEvent<HTMLButtonElement>,
    event: SchedulerEvent,
    dayIndex: number
  ) => {
    if (!editable) return;

    if (keyboardEvent.shiftKey && (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "ArrowUp")) {
      keyboardEvent.preventDefault();
      const direction = keyboardEvent.key === "ArrowDown" ? 1 : -1;
      const { end } = computeResizeResult({
        originalStart: event.start,
        originalEnd: event.end,
        deltaYPx: direction * SLOT_HEIGHT_PX,
        slotDuration,
        minEventDuration: resolvedMinEventDuration,
        endHour,
      });
      if (end.getTime() === event.end.getTime()) return;
      onEventChange?.(event, event.start, end);
      announceResize(event, end);
      return;
    }

    switch (keyboardEvent.key) {
      case "ArrowUp":
      case "ArrowDown": {
        keyboardEvent.preventDefault();
        const direction = keyboardEvent.key === "ArrowDown" ? 1 : -1;
        const { start, end } = computeMoveResult({
          originalStart: event.start,
          originalEnd: event.end,
          targetDay: days[dayIndex]!,
          deltaYPx: direction * SLOT_HEIGHT_PX,
          slotDuration,
          startHour,
          endHour,
        });
        if (start.getTime() === event.start.getTime()) return;
        onEventChange?.(event, start, end);
        announceMove(event, start, end);
        break;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        keyboardEvent.preventDefault();
        const direction = keyboardEvent.key === "ArrowRight" ? 1 : -1;
        const targetDayIndex = Math.min(6, Math.max(0, dayIndex + direction));
        if (targetDayIndex === dayIndex) return;
        const { start, end } = computeMoveResult({
          originalStart: event.start,
          originalEnd: event.end,
          targetDay: days[targetDayIndex]!,
          deltaYPx: 0,
          slotDuration,
          startHour,
          endHour,
        });
        onEventChange?.(event, start, end);
        announceMove(event, start, end);
        break;
      }
      default:
        return;
    }
  };

  const dragPreviewMetrics =
    drag && drag.kind === "move"
      ? getVerticalMetrics(drag.currentStart, drag.currentEnd, startHour, endHour)
      : null;

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      <div
        aria-live="polite"
        className={visuallyHidden}
      >
        {announcement}
      </div>
      <div className={header}>
        <span className={rangeLabel}>{rangeLabelText}</span>
        <div className={headerNav}>
          <button
            type="button"
            className={navButton}
            aria-label="Previous week"
            onClick={() => onDateChange?.(addDays(date, -7))}
          >
            ‹
          </button>
          <button
            type="button"
            className={todayButton}
            onClick={() => onDateChange?.(new Date())}
          >
            Today
          </button>
          <button
            type="button"
            className={navButton}
            aria-label="Next week"
            onClick={() => onDateChange?.(addDays(date, 7))}
          >
            ›
          </button>
        </div>
      </div>

      <div className={dayHeaderRow}>
        <div className={dayHeaderGutter} />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className={dayHeaderCell} data-today={isToday || undefined}>
              <span>{weekdayFormatter.format(day)}</span>
              <span className={dayHeaderDateNumber} data-today={isToday || undefined}>
                {dayNumberFormatter.format(day)}
              </span>
            </div>
          );
        })}
      </div>

      <div className={allDayRow}>
        <div className={allDayGutter}>All day</div>
        {days.map((day, dayIndex) => (
          <div key={day.toISOString()} className={allDayCell}>
            {allDayEventsByDay[dayIndex]!.map((event) => {
              const color = getEventColor(event.id, event.color);
              const selected = event.id === selectedEventId;
              return (
                <button
                  key={event.id}
                  type="button"
                  className={allDayEventBlock}
                  style={{ background: color }}
                  data-selected={selected || undefined}
                  onClick={() => handleEventActivate(event)}
                >
                  {event.title}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className={scrollArea}>
        <div className={timeGutter} style={{ height: totalHeightPx }}>
          {hourMarks.map((mark) => (
            <span
              key={mark.hour}
              className={hourLabel}
              style={{ top: `${mark.top}%` }}
            >
              {mark.label}
            </span>
          ))}
        </div>
        {days.map((day, dayIndex) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              ref={(el) => {
                dayColumnRefs.current[dayIndex] = el;
              }}
              className={dayColumn}
              style={{ height: totalHeightPx }}
            >
              {isToday && showNowLine ? (
                <div className={nowLine} style={{ top: `${nowTop}%` }}>
                  <span className={nowLineDot} />
                </div>
              ) : null}
              {timedEventsByDay[dayIndex]!.map(({ event, metrics, placement }) => {
                const color = getEventColor(event.id, event.color);
                const selected = event.id === selectedEventId;
                const isResizingThis =
                  drag?.kind === "resize" && drag.event.id === event.id;
                const isDraggingThis = drag?.event.id === event.id;
                const displayMetrics =
                  isResizingThis
                    ? getVerticalMetrics(event.start, drag!.currentEnd, startHour, endHour) ??
                      metrics
                    : metrics;
                const displayEnd = isResizingThis ? drag!.currentEnd : event.end;
                const width = 100 / placement.columnCount;
                const left = placement.columnIndex * width;
                const showTime = displayMetrics.height > 6;
                return (
                  <button
                    key={event.id}
                    type="button"
                    className={eventBlock}
                    data-selected={selected || undefined}
                    data-editable={editable || undefined}
                    data-dragging={isDraggingThis || undefined}
                    style={{
                      top: `${displayMetrics.top}%`,
                      height: `${displayMetrics.height}%`,
                      left: `${left}%`,
                      width: `${width}%`,
                      background: color,
                    }}
                    onClick={() => handleEventActivate(event)}
                    onPointerDown={editable ? handleMovePointerDown(event, dayIndex) : undefined}
                    onPointerMove={editable ? handleDragPointerMove : undefined}
                    onPointerUp={editable ? handleDragPointerUp : undefined}
                    onPointerCancel={editable ? handleDragPointerCancel : undefined}
                    onKeyDown={editable ? (e) => handleEventKeyDown(e, event, dayIndex) : undefined}
                  >
                    <span className={eventTitle}>{event.title}</span>
                    {showTime ? (
                      <span className={eventTime}>
                        {formatEventTime(event.start, locale)} –{" "}
                        {formatEventTime(displayEnd, locale)}
                      </span>
                    ) : null}
                    {editable ? (
                      <span
                        className={resizeHandle}
                        onPointerDown={handleResizePointerDown(event, dayIndex)}
                        onPointerMove={handleDragPointerMove}
                        onPointerUp={handleDragPointerUp}
                        onPointerCancel={handleDragPointerCancel}
                      />
                    ) : null}
                  </button>
                );
              })}
              {drag &&
              drag.kind === "move" &&
              drag.currentDayIndex === dayIndex &&
              dragPreviewMetrics ? (
                <div
                  className={dragPreview}
                  style={{
                    top: `${dragPreviewMetrics.top}%`,
                    height: `${dragPreviewMetrics.height}%`,
                    left: 0,
                    width: "100%",
                  }}
                >
                  <span className={dragPreviewLabel}>{drag.event.title}</span>
                  <span className={dragPreviewLabel}>
                    {formatEventTime(drag.currentStart, locale)} –{" "}
                    {formatEventTime(drag.currentEnd, locale)}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
