import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement, ReactNode, Ref, UIEvent } from "react";
import { buildOffsets, scrollTopFor, visibleRange } from "./virtual-math";
import { empty as emptyClass, inner, item as itemClass, root, status } from "./VirtualList.css";

export interface VirtualListHandle {
  scrollToIndex: (index: number, align?: "start" | "center" | "end" | "auto") => void;
  scrollToTop: () => void;
  /** The scrolling element. */
  element: HTMLDivElement | null;
}

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Viewport height in px. */
  height: number;
  /**
   * Row height. A number is fixed; a function gives a known per-row height. Omit it to
   * measure rows after they render (best for wrapping text) starting from `estimateItemHeight`.
   */
  itemHeight?: number | ((item: T, index: number) => number);
  estimateItemHeight?: number;
  /** Space between rows in px. */
  gap?: number;
  /** Extra rows rendered above/below the viewport. */
  overscan?: number;
  getKey?: (item: T, index: number) => string | number;
  /** Fires once when the user scrolls within `endReachedThreshold` px of the bottom. Re-arms when `items` grows. */
  onEndReached?: () => void;
  endReachedThreshold?: number;
  /** Shows `loadingIndicator` after the last row. */
  loading?: boolean;
  loadingIndicator?: ReactNode;
  emptyState?: ReactNode;
  onScroll?: (scrollTop: number) => void;
  "aria-label"?: string;
  className?: string;
}

const STATUS_HEIGHT = 48;

function VirtualListInner<T>(
  {
    items,
    renderItem,
    height,
    itemHeight,
    estimateItemHeight = 44,
    gap = 0,
    overscan = 4,
    getKey,
    onEndReached,
    endReachedThreshold = 200,
    loading = false,
    loadingIndicator = "Loading…",
    emptyState = "Nothing to show",
    onScroll,
    "aria-label": ariaLabel = "List",
    className
  }: VirtualListProps<T>,
  ref: Ref<VirtualListHandle>
): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [version, setVersion] = useState(0);
  const measured = useRef(new Map<string | number, number>());
  const observer = useRef<ResizeObserver | null>(null);
  const nodeKeys = useRef(new Map<Element, string | number>());
  const endFired = useRef(false);
  const keyOf = (item: T, i: number) => (getKey ? getKey(item, i) : i);

  const sizes = useMemo(
    () =>
      items.map((it, i) =>
        typeof itemHeight === "number"
          ? itemHeight
          : typeof itemHeight === "function"
            ? itemHeight(it, i)
            : (measured.current.get(keyOf(it, i)) ?? estimateItemHeight)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, itemHeight, estimateItemHeight, version, getKey]
  );
  const offsets = useMemo(() => buildOffsets(sizes, gap), [sizes, gap]);
  const contentHeight = (offsets[offsets.length - 1] ?? 0) + (loading ? STATUS_HEIGHT : 0);
  const [from, to] = visibleRange(offsets, scrollTop, height, overscan);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined" || itemHeight !== undefined) return;
    observer.current = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const key = nodeKeys.current.get(entry.target);
        if (key === undefined) continue;
        const h = Math.round((entry.target as HTMLElement).offsetHeight);
        if (h > 0 && measured.current.get(key) !== h) {
          measured.current.set(key, h);
          changed = true;
        }
      }
      if (changed) setVersion((v) => v + 1);
    });
    for (const node of nodeKeys.current.keys()) observer.current.observe(node);
    return () => observer.current?.disconnect();
  }, [itemHeight]);

  // Re-arm the end-reached trigger whenever more items arrive.
  useLayoutEffect(() => {
    endFired.current = false;
  }, [items.length]);

  const checkEnd = (top: number) => {
    if (!onEndReached || endFired.current || loading) return;
    if (top + height >= contentHeight - endReachedThreshold) {
      endFired.current = true;
      onEndReached();
    }
  };
  // A list shorter than the viewport can't scroll, so check once after layout too.
  useEffect(() => {
    checkEnd(scrollRef.current?.scrollTop ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, contentHeight, height, loading]);

  const scrollTo = (top: number) => {
    const el = scrollRef.current;
    if (el) el.scrollTop = top;
    setScrollTop(top);
  };
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index, align = "auto") => {
        const i = Math.min(items.length - 1, Math.max(0, index));
        scrollTo(scrollTopFor(offsets, i, height, align, scrollRef.current?.scrollTop ?? 0));
      },
      scrollToTop: () => scrollTo(0),
      get element() {
        return scrollRef.current;
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offsets, height, items.length]
  );

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    setScrollTop(top);
    onScroll?.(top);
    checkEnd(top);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const cur = e.currentTarget.scrollTop;
    const page = height * 0.9;
    const max = Math.max(0, contentHeight - height);
    const next =
      e.key === "PageDown" ? cur + page : e.key === "PageUp" ? cur - page : e.key === "Home" ? 0 : e.key === "End" ? max : e.key === "ArrowDown" ? cur + 40 : e.key === "ArrowUp" ? cur - 40 : null;
    if (next === null) return;
    e.preventDefault();
    scrollTo(Math.min(max, Math.max(0, next)));
  };

  if (items.length === 0 && !loading) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ height }}>
        <div className={emptyClass}>{emptyState}</div>
      </div>
    );
  }

  const rows: ReactElement[] = [];
  for (let i = from; i < to; i++) {
    const it = items[i]!;
    const key = keyOf(it, i);
    rows.push(
      <div
        key={key}
        className={itemClass}
        role="listitem"
        aria-posinset={i + 1}
        aria-setsize={items.length}
        data-index={i}
        style={{ top: offsets[i], height: itemHeight === undefined ? undefined : sizes[i] }}
        ref={(el) => {
          if (itemHeight !== undefined) return;
          if (el) {
            nodeKeys.current.set(el, key);
            observer.current?.observe(el);
          }
        }}
      >
        {renderItem(it, i)}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={[root, className].filter(Boolean).join(" ")}
      style={{ height }}
      tabIndex={0}
      role="list"
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      data-testid="virtual-list"
    >
      <div className={inner} style={{ height: contentHeight }}>
        {rows}
        {loading ? (
          <div className={status} role="status" style={{ top: offsets[offsets.length - 1] ?? 0 }}>
            {loadingIndicator}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Windowed list for large or infinitely-loading data, with fixed, known or measured row heights. */
export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: Ref<VirtualListHandle> }
) => ReactElement;
