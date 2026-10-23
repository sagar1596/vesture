import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, ReactElement } from "react";
import {
  applyDelta,
  buildRows,
  collectDependencies,
  computeRange,
  dependencyPath,
  formatDay,
  parseDay,
  pixelsToDays,
  type DragMode,
  type GanttRow
} from "./gantt-layout";
import {
  arrowPath,
  arrows,
  bar,
  barLabel,
  barProgress,
  dayCell,
  gridLine,
  handle,
  header,
  headerCorner,
  lane,
  monthCell,
  nameCell,
  root,
  row as rowClass,
  scale,
  taskName,
  todayLine,
  toggle,
  toggleSpacer,
  visuallyHidden,
  weekendShade
} from "./Gantt.css";
import type { GanttProps } from "./types";

export type { GanttColumn, GanttProps, GanttTask, GanttTaskChange } from "./types";

const HEADER_HEIGHT = 48;

interface DragState {
  id: string;
  mode: DragMode;
  startX: number;
  origStart: number;
  origEnd: number;
  delta: number;
  moved: boolean;
}

function localToday(): string {
  const d = new Date();
  return formatDay(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Project timeline: a collapsible task tree on the left, day-scale bars on the right, progress
 * fills, and finish-to-start dependency arrows. Editing (drag to move/resize, Arrow keys) is
 * off unless `onTaskChange` is passed.
 */
export function Gantt({
  tasks,
  dayWidth = 32,
  rowHeight = 36,
  listWidth = 240,
  today,
  columns = [],
  nameHeader = "Task",
  range,
  scale = "day",
  weekendDays = [0, 6],
  showToday = true,
  showDependencies = true,
  defaultCollapsed,
  snapDays = 1,
  isTaskEditable,
  getBarColor,
  renderBarLabel,
  onTaskChange,
  onTaskClick,
  className
}: GanttProps): ReactElement {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(defaultCollapsed));
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const editable = Boolean(onTaskChange);
  const canEditRow = (r: GanttRow) => editable && !r.hasChildren && (isTaskEditable?.(r.task) ?? true);
  const extraWidth = columns.reduce((s, col) => s + col.width, 0);
  const nameWidth = listWidth; // the name column keeps `listWidth`; extra columns add to the sticky block
  const stickyWidth = nameWidth + extraWidth;
  const snap = Math.max(1, Math.round(snapDays));

  const todayDay = parseDay(today ?? localToday());
  const baseRows = buildRows(tasks, collapsed);
  const [rangeStart, rangeEnd] = range ? [parseDay(range.start), parseDay(range.end)] : computeRange(baseRows, todayDay);
  const dayCount = rangeEnd - rangeStart + 1;
  const timelineWidth = dayCount * dayWidth;

  // Live preview: the dragged row shows its in-flight span.
  const rows: GanttRow[] = baseRows.map((r) => {
    if (!drag || drag.id !== r.task.id) return r;
    const [start, end] = applyDelta(drag.mode, drag.origStart, drag.origEnd, drag.delta);
    return { ...r, start, end };
  });

  const xOf = (day: number) => (day - rangeStart) * dayWidth;
  const rowIndex = new Map(rows.map((r, i) => [r.task.id, i]));
  const rowRect = (r: GanttRow) =>
    r.task.type === "milestone"
      ? { x: xOf(r.start) + dayWidth / 2 - (rowHeight - 14) / 2, width: rowHeight - 14 }
      : { x: xOf(r.start), width: (r.end - r.start + 1) * dayWidth };

  const beginDrag = (e: ReactPointerEvent<HTMLElement>, r: GanttRow, mode: DragMode) => {
    if (!canEditRow(r) || e.button > 0) return;
    if (r.task.type === "milestone" && mode !== "move") return;
    // preventDefault blocks text selection but also the implicit click-to-focus, so focus the bar explicitly.
    e.preventDefault();
    e.stopPropagation();
    const barEl = (e.currentTarget.closest("[data-gantt-bar]") as HTMLElement | null) ?? e.currentTarget;
    barEl.focus();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* not implemented in every DOM env */
    }
    const state: DragState = {
      id: r.task.id,
      mode,
      startX: e.clientX,
      origStart: r.start,
      origEnd: r.end,
      delta: 0,
      moved: false
    };
    dragRef.current = state;
    setDrag(state);
  };

  const moveDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const cur = dragRef.current;
    if (!cur) return;
    const dx = e.clientX - cur.startX;
    const delta = Math.round(pixelsToDays(dx, dayWidth) / snap) * snap;
    const next = { ...cur, delta, moved: cur.moved || Math.abs(dx) > 3 };
    dragRef.current = next;
    setDrag(next);
  };

  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const cur = dragRef.current;
    if (!cur) return;
    dragRef.current = null;
    setDrag(null);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!cur.moved) return;
    suppressClickRef.current = true;
    if (cur.delta === 0) return;
    const [start, end] = applyDelta(cur.mode, cur.origStart, cur.origEnd, cur.delta);
    const task = tasks.find((t) => t.id === cur.id);
    onTaskChange?.(cur.id, { start: formatDay(start), end: formatDay(end) });
    setAnnouncement(`${task?.name ?? "Task"} now ${formatDay(start)} to ${formatDay(end)}`);
  };

  const onBarKeyDown = (e: KeyboardEvent<HTMLElement>, r: GanttRow) => {
    if (e.key === "Enter" && onTaskClick) {
      onTaskClick(r.task);
      return;
    }
    if (!canEditRow(r)) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const step = (e.key === "ArrowRight" ? 1 : -1) * snap;
    const resize = e.shiftKey && r.task.type !== "milestone";
    const [start, end] = applyDelta(resize ? "resize-end" : "move", r.start, r.end, step);
    onTaskChange?.(r.task.id, { start: formatDay(start), end: formatDay(end) });
    setAnnouncement(`${r.task.name} now ${formatDay(start)} to ${formatDay(end)}`);
  };

  const toggleRow = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Header cells.
  const days = Array.from({ length: dayCount }, (_, i) => rangeStart + i);
  const monthStarts = days.filter((d, i) => i === 0 || new Date(d * 86_400_000).getUTCDate() === 1);
  const isWeekend = (d: number) => weekendDays.includes(new Date(d * 86_400_000).getUTCDay());
  const showDayLabel = (d: number) => dayWidth >= 20 && (scale === "day" || new Date(d * 86_400_000).getUTCDay() === 1);

  const edges = collectDependencies(rows);
  const barTop = (i: number) => i * rowHeight + rowHeight / 2;

  return (
    <div className={[root, className].filter(Boolean).join(" ")} role="group" aria-label="Gantt chart">
      <div className={header} style={{ height: HEADER_HEIGHT, width: stickyWidth + timelineWidth }}>
        <div className={headerCorner} style={{ width: stickyWidth, height: HEADER_HEIGHT }}>
          <span style={{ width: nameWidth, flexShrink: 0 }}>{nameHeader}</span>
          {columns.map((col) => (
            <span key={col.key} style={{ width: col.width, flexShrink: 0 }}>
              {col.header}
            </span>
          ))}
        </div>
        <div className={scale} style={{ width: timelineWidth, height: HEADER_HEIGHT }}>
          {monthStarts.map((d) => {
            const date = new Date(d * 86_400_000);
            return (
              <div key={d} className={monthCell} style={{ left: xOf(d) }}>
                {MONTHS[date.getUTCMonth()]} {date.getUTCFullYear()}
              </div>
            );
          })}
          {days.map((d) => (
            <div
              key={d}
              className={dayCell}
              style={{ left: xOf(d), width: dayWidth }}
              data-weekend={isWeekend(d)}
              data-today={d === todayDay}
            >
              {showDayLabel(d) ? new Date(d * 86_400_000).getUTCDate() : ""}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", width: stickyWidth + timelineWidth }}>
        {rows.map((r) => (
          <div key={r.task.id} className={rowClass} style={{ height: rowHeight }} data-testid="gantt-row">
            <div className={nameCell} style={{ width: stickyWidth, paddingLeft: 0 }}>
              <div style={{ width: nameWidth, flexShrink: 0, display: "flex", alignItems: "center", gap: 4, paddingLeft: 8 + r.depth * 16, minWidth: 0 }}>
              {r.hasChildren ? (
                <button
                  type="button"
                  className={toggle}
                  aria-label={`${collapsed.has(r.task.id) ? "Expand" : "Collapse"} ${r.task.name}`}
                  aria-expanded={!collapsed.has(r.task.id)}
                  onClick={() => toggleRow(r.task.id)}
                >
                  {collapsed.has(r.task.id) ? "▸" : "▾"}
                </button>
              ) : (
                <span className={toggleSpacer} />
              )}
              <span className={taskName} data-summary={r.hasChildren}>
                {r.task.name}
              </span>
              </div>
              {columns.map((col) => (
                <span key={col.key} data-column={col.key} style={{ width: col.width, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {col.render(r.task)}
                </span>
              ))}
            </div>
            <div className={lane} style={{ width: timelineWidth }}>
              {days.filter(isWeekend).map((d) => (
                <div key={d} className={weekendShade} style={{ left: xOf(d), width: dayWidth }} />
              ))}
              {(() => {
                const { x, width } = rowRect(r);
                const milestone = r.task.type === "milestone";
                const barH = r.hasChildren ? 10 : rowHeight - 14;
                const barColor = r.task.color ?? getBarColor?.(r.task);
                const editableRow = canEditRow(r);
                const label = renderBarLabel ? renderBarLabel(r.task) : r.task.name;
                return (
                  <div
                    data-gantt-bar
                    data-testid="gantt-bar"
                    data-task-id={r.task.id}
                    data-start={formatDay(r.start)}
                    data-end={formatDay(r.end)}
                    data-summary={r.hasChildren}
                    data-editable={editableRow}
                    data-milestone={milestone || undefined}
                    data-dragging={drag?.id === r.task.id && drag.moved}
                    className={bar}
                    style={{
                      left: milestone ? x + dayWidth / 2 - barH / 2 : x,
                      width: milestone ? barH : width,
                      top: (rowHeight - barH) / 2,
                      height: barH,
                      ...(barColor && !r.hasChildren ? { background: barColor } : null),
                      ...(milestone ? { clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)", borderRadius: 0 } : null)
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${r.task.name}, ${formatDay(r.start)} to ${formatDay(r.end)}${
                      r.task.progress !== undefined ? `, ${r.task.progress}% complete` : ""
                    }`}
                    onKeyDown={(e) => onBarKeyDown(e, r)}
                    onPointerDown={(e) => beginDrag(e, r, "move")}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onClick={() => {
                      if (suppressClickRef.current) {
                        suppressClickRef.current = false;
                        return;
                      }
                      onTaskClick?.(r.task);
                    }}
                  >
                    {r.task.progress ? (
                      <div className={barProgress} style={{ width: `${Math.min(100, r.task.progress)}%` }} />
                    ) : null}
                    {!r.hasChildren && !milestone && width > 60 && label !== null ? <span className={barLabel}>{label}</span> : null}
                    {editableRow && !milestone ? (
                      <>
                        <span
                          className={handle}
                          data-edge="start"
                          data-testid="gantt-handle-start"
                          onPointerDown={(e) => beginDrag(e, r, "resize-start")}
                          onPointerMove={moveDrag}
                          onPointerUp={endDrag}
                          onPointerCancel={endDrag}
                        />
                        <span
                          className={handle}
                          data-edge="end"
                          data-testid="gantt-handle-end"
                          onPointerDown={(e) => beginDrag(e, r, "resize-end")}
                          onPointerMove={moveDrag}
                          onPointerUp={endDrag}
                          onPointerCancel={endDrag}
                        />
                      </>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          </div>
        ))}

        {/* Overlays share the lane's coordinate space: offset by the sticky name column. */}
        <div style={{ position: "absolute", top: 0, left: stickyWidth, width: timelineWidth, height: rows.length * rowHeight, pointerEvents: "none" }}>
          {monthStarts.map((d) => (
            <div key={d} className={gridLine} style={{ left: xOf(d) }} />
          ))}
          {showToday && todayDay >= rangeStart && todayDay <= rangeEnd ? (
            <div
              className={todayLine}
              data-testid="gantt-today"
              style={{ left: xOf(todayDay) + dayWidth / 2 - 1 }}
            />
          ) : null}
          <svg className={arrows} width={timelineWidth} height={rows.length * rowHeight} aria-hidden="true">
            <defs>
              <marker id="gantt-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
              </marker>
            </defs>
            {(showDependencies ? edges : []).map(({ fromId, toId }) => {
              const from = rows[rowIndex.get(fromId)!]!;
              const to = rows[rowIndex.get(toId)!]!;
              const a = rowRect(from);
              const b = rowRect(to);
              return (
                <path
                  key={`${fromId}->${toId}`}
                  data-testid="gantt-dependency"
                  className={arrowPath}
                  d={dependencyPath(a.x + a.width, barTop(rowIndex.get(fromId)!), b.x, barTop(rowIndex.get(toId)!))}
                  markerEnd="url(#gantt-arrow)"
                  style={{ color: "inherit" }}
                />
              );
            })}
          </svg>
        </div>
      </div>
      <div className={visuallyHidden} aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
