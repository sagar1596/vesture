import type { KanbanColumn } from "./types";

export interface AxisRect {
  start: number;
  end: number;
}

/**
 * Index at which to insert among `rects` — each the [start, end] extent of an
 * existing item along a single axis (Y for cards within a column, X for
 * columns along the board), in DOM order, with the dragged item itself
 * already excluded. Compares `pointerCoord` against each rect's midpoint;
 * can return `rects.length` (append at the end).
 */
export function findInsertIndex(pointerCoord: number, rects: AxisRect[]): number {
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i]!;
    if (pointerCoord < (rect.start + rect.end) / 2) return i;
  }
  return rects.length;
}

/**
 * Which of `rects` (in DOM order, one per column) the pointer currently sits
 * over horizontally — clamped to the first/last column when the pointer is
 * outside every column's bounds, since a card drag always needs a valid
 * target column, unlike `findInsertIndex`'s "append past the end" case.
 */
export function findHoveredIndex(pointerCoord: number, rects: AxisRect[]): number {
  if (rects.length === 0) return 0;
  for (let i = 0; i < rects.length; i++) {
    if (pointerCoord < rects[i]!.end) return i;
  }
  return rects.length - 1;
}

/**
 * Moves a card from `sourceColumnId`/`sourceIndex` to `targetIndex` within
 * `targetColumnId`. `targetIndex` is always relative to the target column's
 * cards with the dragged card already excluded (matching what
 * `findInsertIndex` returns) — for a same-column reorder that list is the
 * column's cards minus the dragged card, so `targetIndex` can be spliced in
 * directly with no off-by-one correction.
 */
export function moveCard(
  columns: KanbanColumn[],
  sourceColumnId: string,
  sourceIndex: number,
  targetColumnId: string,
  targetIndex: number
): KanbanColumn[] {
  const sourceColumn = columns.find((c) => c.id === sourceColumnId);
  const card = sourceColumn?.cards[sourceIndex];
  if (!sourceColumn || !card) return columns;

  return columns.map((col) => {
    if (col.id === sourceColumnId && col.id === targetColumnId) {
      const withoutCard = col.cards.filter((_, i) => i !== sourceIndex);
      const next = [...withoutCard];
      next.splice(targetIndex, 0, card);
      return { ...col, cards: next };
    }
    if (col.id === sourceColumnId) {
      return { ...col, cards: col.cards.filter((_, i) => i !== sourceIndex) };
    }
    if (col.id === targetColumnId) {
      const next = [...col.cards];
      next.splice(targetIndex, 0, card);
      return { ...col, cards: next };
    }
    return col;
  });
}

/** Reorders `columns` by moving the column at `sourceIndex` to `targetIndex` (relative to the other columns, same convention as `moveCard`'s `targetIndex`). */
export function reorderColumns(
  columns: KanbanColumn[],
  sourceIndex: number,
  targetIndex: number
): KanbanColumn[] {
  const moved = columns[sourceIndex];
  if (!moved) return columns;
  const without = columns.filter((_, i) => i !== sourceIndex);
  const next = [...without];
  next.splice(targetIndex, 0, moved);
  return next;
}

/**
 * Interleaves `column.cards` with a single indicator marker at `dropIndex`
 * (relative to the cards-with-dragged-card-excluded list, same convention as
 * `moveCard`). The dragged card, if it belongs to this column, stays in the
 * walk at its original position (rendered dimmed by the caller) rather than
 * being filtered out — `dropIndex` only advances past non-dragged cards, so
 * the indicator lands in the right visual slot regardless of where the
 * dragged card's own (dimmed) placeholder currently sits.
 */
export function buildColumnRenderItems<Card extends { id: string }>(
  cards: Card[],
  draggedCardId: string | null,
  showIndicator: boolean,
  dropIndex: number
): Array<{ type: "card"; card: Card } | { type: "indicator" }> {
  const items: Array<{ type: "card"; card: Card } | { type: "indicator" }> = [];
  let filteredIndex = 0;
  let inserted = false;

  for (const card of cards) {
    const isDragged = card.id === draggedCardId;
    // Skip the check on the dragged card's own iteration — otherwise the
    // indicator lands immediately before its dimmed placeholder instead of
    // after it, since filteredIndex hasn't advanced past that slot yet.
    if (!isDragged && showIndicator && !inserted && filteredIndex === dropIndex) {
      items.push({ type: "indicator" });
      inserted = true;
    }
    items.push({ type: "card", card });
    if (!isDragged) filteredIndex++;
  }

  if (showIndicator && !inserted) {
    items.push({ type: "indicator" });
  }

  return items;
}
