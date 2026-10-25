import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, ReactElement, ReactNode } from "react";
import { layoutHeightInRows, moveItem, normalizeLayout, resizeItem } from "./grid-layout";
import type { GridItem } from "./grid-layout";
import { item as itemClass, placeholder, resizeHandle, root, visuallyHidden } from "./DashboardGrid.css";

export interface DashboardGridProps {
  /** Controlled layout. */
  layout?: GridItem[];
  defaultLayout?: GridItem[];
  onLayoutChange?: (layout: GridItem[]) => void;
  /** Renders one tile's content. Elements marked `data-no-drag` inside it won't start a drag. */
  renderItem: (item: GridItem) => ReactNode;
  /** Number of grid columns. */
  cols?: number;
  /** Height of one row in px. */
  rowHeight?: number;
  /** Space between tiles in px. */
  gap?: number;
  /** Turns on drag + resize + keyboard editing. */
  editable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  /** Keep tiles packed upward after every change. */
  compactVertically?: boolean;
  /** Fixed pixel width. By default the grid measures its container. */
  width?: number;
  /** Fires when a drag or resize begins / ends. */
  onInteractionStart?: (item: GridItem, mode: "move" | "resize") => void;
  onInteractionEnd?: (layout: GridItem[]) => void;
  className?: string;
}

interface DragState {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  base: GridItem[];
  origin: GridItem;
  dx: number;
  dy: number;
  preview: GridItem[];
}

/** Draggable, resizable tile grid. Tiles push each other down and (optionally) float back up. */
export function DashboardGrid({
  layout: controlledLayout,
  defaultLayout = [],
  onLayoutChange,
  renderItem,
  cols = 12,
  rowHeight = 80,
  gap = 12,
  editable = false,
  draggable = true,
  resizable = true,
  compactVertically = true,
  width: fixedWidth,
  onInteractionStart,
  onInteractionEnd,
  className
}: DashboardGridProps): ReactElement {
  const [uncontrolled, setUncontrolled] = useState(() => normalizeLayout(defaultLayout, cols, compactVertically));
  const layout = controlledLayout !== undefined ? controlledLayout : uncontrolled;
  const [measured, setMeasured] = useState(1200);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || fixedWidth !== undefined || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 0) setMeasured(el.clientWidth);
    });
    ro.observe(el);
    if (el.clientWidth > 0) setMeasured(el.clientWidth);
    return () => ro.disconnect();
  }, [fixedWidth]);

  const width = fixedWidth ?? measured;
  const colW = (width - gap * (cols - 1)) / cols;
  const cellX = colW + gap;
  const cellY = rowHeight + gap;
  const box = (i: Pick<GridItem, "x" | "y" | "w" | "h">) => ({
    left: i.x * cellX,
    top: i.y * cellY,
    width: i.w * colW + (i.w - 1) * gap,
    height: i.h * rowHeight + (i.h - 1) * gap
  });

  const commit = (next: GridItem[]) => {
    if (controlledLayout === undefined) setUncontrolled(next);
    onLayoutChange?.(next);
  };
  const canDrag = editable && draggable;
  const canResize = editable && resizable;

  const begin = (e: ReactPointerEvent<HTMLElement>, item: GridItem, mode: "move" | "resize") => {
    if (item.static) return;
    if (mode === "move" && (e.target as Element).closest("[data-no-drag], button, input, select, textarea, a")) {
      if (!(e.target as Element).closest("[data-resize-handle]")) return;
    }
    e.preventDefault();
    e.stopPropagation();
    // preventDefault above also cancels the browser's click-to-focus, so focus the tile ourselves.
    itemRefs.current.get(item.id)?.focus();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not implemented in every DOM env */
    }
    setDrag({ id: item.id, mode, startX: e.clientX, startY: e.clientY, base: layout, origin: item, dx: 0, dy: 0, preview: layout });
    onInteractionStart?.(item, mode);
  };
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const gx = Math.round(dx / cellX);
    const gy = Math.round(dy / cellY);
    const preview =
      d.mode === "move"
        ? moveItem(d.base, d.id, d.origin.x + gx, d.origin.y + gy, cols, compactVertically)
        : resizeItem(d.base, d.id, d.origin.w + gx, d.origin.h + gy, cols, compactVertically);
    setDrag({ ...d, dx, dy, preview });
  };
  const end = () => {
    const d = dragRef.current;
    if (!d) return;
    setDrag(null);
    const changed = d.preview.some((p, i) => {
      const b = d.base[i]!;
      return p.x !== b.x || p.y !== b.y || p.w !== b.w || p.h !== b.h;
    });
    if (changed) {
      commit(d.preview);
      const it = d.preview.find((p) => p.id === d.id)!;
      setAnnouncement(`${d.id} ${d.mode === "move" ? "moved to" : "resized to"} ${d.mode === "move" ? `column ${it.x + 1}, row ${it.y + 1}` : `${it.w} by ${it.h}`}`);
    }
    onInteractionEnd?.(d.preview);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, item: GridItem) => {
    if (!editable || item.static || e.target !== e.currentTarget) return;
    const dirs: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const dir = dirs[e.key];
    if (!dir) return;
    e.preventDefault();
    const next = e.shiftKey
      ? canResize
        ? resizeItem(layout, item.id, item.w + dir[0], item.h + dir[1], cols, compactVertically)
        : layout
      : canDrag
        ? moveItem(layout, item.id, item.x + dir[0], item.y + dir[1], cols, compactVertically)
        : layout;
    if (next === layout) return;
    commit(next);
    const it = next.find((p) => p.id === item.id)!;
    setAnnouncement(e.shiftKey ? `${item.id} resized to ${it.w} by ${it.h}` : `${item.id} moved to column ${it.x + 1}, row ${it.y + 1}`);
  };

  const shown = drag ? drag.preview : layout;
  const rows = layoutHeightInRows(shown);
  const height = Math.max(0, rows * rowHeight + Math.max(0, rows - 1) * gap);

  return (
    <div ref={rootRef} className={[root, className].filter(Boolean).join(" ")} style={{ height, width: fixedWidth }} role="group" aria-label="Dashboard">
      {drag ? (
        <div
          className={placeholder}
          data-testid="dashboard-placeholder"
          style={box(drag.preview.find((p) => p.id === drag.id)!)}
        />
      ) : null}
      {shown.map((item) => {
        const dragging = drag?.id === item.id;
        const base = dragging ? box(drag.origin) : box(item);
        const style = dragging
          ? drag.mode === "move"
            ? { ...base, left: base.left + drag.dx, top: base.top + drag.dy }
            : {
                ...base,
                width: Math.max(colW, base.width + drag.dx),
                height: Math.max(rowHeight, base.height + drag.dy)
              }
          : box(item);
        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) itemRefs.current.set(item.id, el);
              else itemRefs.current.delete(item.id);
            }}
            className={itemClass}
            data-testid="dashboard-item"
            data-id={item.id}
            data-editable={editable && !item.static}
            data-dragging={dragging}
            tabIndex={editable && !item.static ? 0 : undefined}
            aria-label={editable && !item.static ? `${item.id} tile. Arrow keys move, shift plus arrows resize.` : undefined}
            style={style}
            onPointerDown={canDrag ? (e) => begin(e, item, "move") : undefined}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onKeyDown={(e) => onKeyDown(e, item)}
          >
            {renderItem(item)}
            {canResize && !item.static ? (
              <button
                type="button"
                className={resizeHandle}
                data-resize-handle
                aria-label={`Resize ${item.id}`}
                onPointerDown={(e) => begin(e, item, "resize")}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                onKeyDown={(e) => {
                  const dirs: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
                  const dir = dirs[e.key];
                  if (!dir) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const next = resizeItem(layout, item.id, item.w + dir[0], item.h + dir[1], cols, compactVertically);
                  if (next !== layout) {
                    commit(next);
                    const it = next.find((p) => p.id === item.id)!;
                    setAnnouncement(`${item.id} resized to ${it.w} by ${it.h}`);
                  }
                }}
              />
            ) : null}
          </div>
        );
      })}
      <div className={visuallyHidden} aria-live="polite" role="status">
        {announcement}
      </div>
    </div>
  );
}
