import { useMemo, useState } from "react";

export interface FilterableItem {
  id: string;
  label: string;
  group?: string;
  keywords?: string[];
  disabled?: boolean;
}

export function defaultFilterItems<T extends FilterableItem>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const haystack = [item.label, item.group, ...(item.keywords ?? [])].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

export interface UseFilterableListResult<T extends FilterableItem> {
  filteredItems: T[];
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  /** Moves to the next non-disabled item in `direction`, wrapping around. */
  moveActiveIndex: (direction: 1 | -1) => void;
  activeItem: T | undefined;
}

/**
 * Shared list-filtering + arrow-key active-index management, factored out of
 * CommandPalette so RichTextEditor's inline slash-command menu can reuse the
 * exact same filtering/navigation behavior without either duplicating it or
 * being forced through CommandPalette's full modal/overlay presentation
 * (which the slash menu — anchored inline at the text cursor, not centered
 * full-screen — has no use for). `query` is owned by the caller rather than
 * this hook, since CommandPalette gets it from its own <input> while the
 * slash menu derives it from contentEditable text after "/" — two
 * different sources feeding the same filtering/navigation core.
 */
export function useFilterableList<T extends FilterableItem>(
  items: T[],
  query: string,
  filter: (items: T[], query: string) => T[] = defaultFilterItems,
  onActiveIndexChange?: (index: number) => void
): UseFilterableListResult<T> {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const filteredItems = useMemo(() => filter(items, query), [items, query, filter]);

  function moveActiveIndex(direction: 1 | -1) {
    if (filteredItems.length === 0) return;
    let next = activeIndex ?? (direction === 1 ? -1 : filteredItems.length);
    for (let step = 0; step < filteredItems.length; step++) {
      next = (next + direction + filteredItems.length) % filteredItems.length;
      if (!filteredItems[next]?.disabled) {
        setActiveIndex(next);
        onActiveIndexChange?.(next);
        return;
      }
    }
  }

  const activeItem = activeIndex !== null ? filteredItems[activeIndex] : undefined;

  return { filteredItems, activeIndex, setActiveIndex, moveActiveIndex, activeItem };
}
