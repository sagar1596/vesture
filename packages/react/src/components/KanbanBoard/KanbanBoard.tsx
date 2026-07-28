import { useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
} from "react";
import { Avatar } from "../Avatar";
import { Badge } from "../Badge";
import { Button } from "../Button";
import { Card } from "../Card";
import {
  addCardButton,
  addCardSlot,
  addColumn,
  board,
  cardDescription,
  cardDropIndicator,
  cardFooter,
  cardHeader,
  cardItem,
  cardList,
  cardTags,
  cardTitle,
  column,
  columnDropIndicator,
  columnHeader,
  columnTitle,
  countBadge,
  dragPreview,
  dragPreviewMeta,
  dragPreviewTitle,
  emptyColumn,
  removeButton,
  visuallyHidden,
} from "./KanbanBoard.css";
import {
  buildColumnRenderItems,
  findHoveredIndex,
  findInsertIndex,
  moveCard,
  reorderColumns,
} from "./kanban-dnd";
import type { KanbanBoardProps, KanbanCard, KanbanColumn } from "./types";

interface BaseDragState {
  pointerId: number;
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetY: number;
  width: number;
  /** False until the pointer has actually crossed into a different slot — lets pointerup distinguish a drag from a plain click, same as Scheduler's move-vs-click handling. */
  moved: boolean;
}

interface CardDragState extends BaseDragState {
  kind: "card";
  card: KanbanCard;
  sourceColumnId: string;
  sourceIndex: number;
  currentColumnId: string;
  currentIndex: number;
}

interface ColumnDragState extends BaseDragState {
  kind: "column";
  columnId: string;
  sourceIndex: number;
  currentIndex: number;
}

type DragState = CardDragState | ColumnDragState;

// The Card wrapper below (not renderCard's returned content) owns
// focusability, drag start, and keyboard reordering — a custom renderCard
// only needs to render presentation content, not manage its own tabIndex.
function DefaultCard({ card }: { card: KanbanCard }): ReactElement {
  return (
    <>
      <span className={cardTitle}>{card.title}</span>
      {card.description ? (
        <span className={cardDescription}>{card.description}</span>
      ) : null}
      {card.tags && card.tags.length > 0 ? (
        <span className={cardTags}>
          {card.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </span>
      ) : null}
      {card.assignee ? (
        <span className={cardFooter}>
          <Avatar
            name={card.assignee.name}
            src={card.assignee.avatarUrl}
            size="sm"
          />
        </span>
      ) : null}
    </>
  );
}

export function KanbanBoard({
  columns,
  onColumnsChange,
  onCardClick,
  onAddCard,
  onAddColumn,
  renderCard,
}: KanbanBoardProps): ReactElement {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const suppressClickRef = useRef(false);
  const columnRefs = useRef(new Map<string, HTMLDivElement>());
  const columnHeaderRefs = useRef(new Map<string, HTMLDivElement>());
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingFocusCardRef = useRef<string | null>(null);
  const pendingFocusColumnRef = useRef<string | null>(null);

  // Re-focuses the card/column that just moved via keyboard or drag, once
  // the consumer's updated `columns` prop has round-tripped back to us —
  // same reasoning as TreeView's shouldFocusRef.
  useEffect(() => {
    if (pendingFocusCardRef.current) {
      cardRefs.current.get(pendingFocusCardRef.current)?.focus();
      pendingFocusCardRef.current = null;
    }
    if (pendingFocusColumnRef.current) {
      columnHeaderRefs.current.get(pendingFocusColumnRef.current)?.focus();
      pendingFocusColumnRef.current = null;
    }
  }, [columns]);

  function removeCard(columnId: string, cardId: string) {
    onColumnsChange?.(
      columns.map((col): KanbanColumn =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
          : col
      )
    );
  }

  function removeColumn(columnId: string) {
    onColumnsChange?.(columns.filter((col) => col.id !== columnId));
  }

  function handleCardActivate(card: KanbanCard, columnId: string) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onCardClick?.(card, columnId);
  }

  function handleCardPointerDown(card: KanbanCard, columnId: string, index: number) {
    return (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!onColumnsChange || drag) return;
      event.preventDefault();
      const target = event.currentTarget;
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture isn't implemented in every test/DOM environment; drag still
        // works without it as long as the pointer stays over the captured element.
      }
      target.focus();
      const rect = target.getBoundingClientRect();
      setDrag({
        kind: "card",
        card,
        pointerId: event.pointerId,
        sourceColumnId: columnId,
        sourceIndex: index,
        currentColumnId: columnId,
        currentIndex: index,
        clientX: event.clientX,
        clientY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        moved: false,
      });
    };
  }

  function handleColumnHeaderPointerDown(columnId: string, index: number) {
    return (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!onColumnsChange || drag) return;
      event.preventDefault();
      const target = event.currentTarget;
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // See handleCardPointerDown.
      }
      const rect = (columnRefs.current.get(columnId) ?? target).getBoundingClientRect();
      setDrag({
        kind: "column",
        columnId,
        pointerId: event.pointerId,
        sourceIndex: index,
        currentIndex: index,
        clientX: event.clientX,
        clientY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        moved: false,
      });
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.stopPropagation();

    if (drag.kind === "card") {
      const columnRects = columns.map((col) => {
        const rect = columnRefs.current.get(col.id)?.getBoundingClientRect();
        return { start: rect?.left ?? 0, end: rect?.right ?? 0 };
      });
      const hoveredIndex = findHoveredIndex(event.clientX, columnRects);
      const hoveredColumn = columns[hoveredIndex]!;
      const siblingCards = hoveredColumn.cards.filter((c) => c.id !== drag.card.id);
      const cardRects = siblingCards.map((c) => {
        const rect = cardRefs.current.get(c.id)?.getBoundingClientRect();
        return { start: rect?.top ?? 0, end: rect?.bottom ?? 0 };
      });
      const insertIndex = findInsertIndex(event.clientY, cardRects);
      const moved = !(
        hoveredColumn.id === drag.sourceColumnId && insertIndex === drag.sourceIndex
      );
      setDrag({
        ...drag,
        currentColumnId: hoveredColumn.id,
        currentIndex: insertIndex,
        clientX: event.clientX,
        clientY: event.clientY,
        moved,
      });
      return;
    }

    const otherColumns = columns.filter((c) => c.id !== drag.columnId);
    const columnRects = otherColumns.map((c) => {
      const rect = columnRefs.current.get(c.id)?.getBoundingClientRect();
      return { start: rect?.left ?? 0, end: rect?.right ?? 0 };
    });
    const insertIndex = findInsertIndex(event.clientX, columnRects);
    setDrag({
      ...drag,
      currentIndex: insertIndex,
      clientX: event.clientX,
      clientY: event.clientY,
      moved: insertIndex !== drag.sourceIndex,
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.stopPropagation();
    const finished = drag;
    setDrag(null);

    if (finished.kind === "card") {
      if (!finished.moved) {
        suppressClickRef.current = true;
        onCardClick?.(finished.card, finished.sourceColumnId);
        return;
      }
      const next = moveCard(
        columns,
        finished.sourceColumnId,
        finished.sourceIndex,
        finished.currentColumnId,
        finished.currentIndex
      );
      onColumnsChange?.(next);
      const targetColumn = columns.find((c) => c.id === finished.currentColumnId)!;
      const resultingCount =
        finished.currentColumnId === finished.sourceColumnId
          ? targetColumn.cards.length
          : targetColumn.cards.length + 1;
      setAnnouncement(
        `${finished.card.title} moved to ${targetColumn.title} column, position ${finished.currentIndex + 1} of ${resultingCount}.`
      );
      pendingFocusCardRef.current = finished.card.id;
      return;
    }

    if (!finished.moved) return;
    const movedColumn = columns[finished.sourceIndex]!;
    const next = reorderColumns(columns, finished.sourceIndex, finished.currentIndex);
    onColumnsChange?.(next);
    setAnnouncement(
      `${movedColumn.title} column moved to position ${finished.currentIndex + 1} of ${columns.length}.`
    );
    pendingFocusColumnRef.current = finished.columnId;
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.stopPropagation();
    setDrag(null);
  }

  function handleCardKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
    card: KanbanCard,
    columnId: string,
    index: number
  ) {
    if (!onColumnsChange) return;
    const columnIndex = columns.findIndex((c) => c.id === columnId);
    const col = columns[columnIndex]!;

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= col.cards.length) return;
      onColumnsChange(moveCard(columns, columnId, index, columnId, targetIndex));
      setAnnouncement(
        `${card.title} moved to position ${targetIndex + 1} of ${col.cards.length} in ${col.title}.`
      );
      pendingFocusCardRef.current = card.id;
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const targetColumnIndex = columnIndex + direction;
      if (targetColumnIndex < 0 || targetColumnIndex >= columns.length) return;
      const targetColumn = columns[targetColumnIndex]!;
      const targetIndex = Math.min(index, targetColumn.cards.length);
      onColumnsChange(moveCard(columns, columnId, index, targetColumn.id, targetIndex));
      setAnnouncement(
        `${card.title} moved to ${targetColumn.title} column, position ${targetIndex + 1} of ${targetColumn.cards.length + 1}.`
      );
      pendingFocusCardRef.current = card.id;
    }
  }

  function handleColumnHeaderKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
    columnId: string,
    index: number
  ) {
    if (!onColumnsChange || !event.shiftKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const col = columns[index]!;
    onColumnsChange(reorderColumns(columns, index, targetIndex));
    setAnnouncement(
      `${col.title} column moved to position ${targetIndex + 1} of ${columns.length}.`
    );
    pendingFocusColumnRef.current = columnId;
  }

  const boardItems = buildColumnRenderItems(
    columns,
    drag?.kind === "column" ? drag.columnId : null,
    drag?.kind === "column",
    drag?.kind === "column" ? drag.currentIndex : -1
  );

  return (
    <div className={board} role="list">
      <div aria-live="polite" className={visuallyHidden}>
        {announcement}
      </div>
      {boardItems.map((item, itemIndex) => {
        if (item.type === "indicator") {
          return (
            <div
              key={`column-indicator-${itemIndex}`}
              className={columnDropIndicator}
              aria-hidden="true"
            />
          );
        }

        const col = item.card;
        const columnIndex = columns.findIndex((c) => c.id === col.id);
        const isDraggingThisColumn = drag?.kind === "column" && drag.columnId === col.id;
        const projectedCount =
          drag?.kind === "card" &&
          drag.currentColumnId === col.id &&
          drag.sourceColumnId !== col.id
            ? col.cards.length + 1
            : col.cards.length;
        const wipExceeded =
          col.wipLimit !== undefined && projectedCount > col.wipLimit;
        const showCardIndicator = drag?.kind === "card" && drag.currentColumnId === col.id;
        const cardItems = buildColumnRenderItems(
          col.cards,
          drag?.kind === "card" ? drag.card.id : null,
          showCardIndicator,
          drag?.kind === "card" ? drag.currentIndex : -1
        );

        return (
          <div
            key={col.id}
            ref={(el) => {
              if (el) columnRefs.current.set(col.id, el);
              else columnRefs.current.delete(col.id);
            }}
            className={column}
            role="listitem"
            data-dragging={isDraggingThisColumn || undefined}
            data-wip-warning={wipExceeded || undefined}
          >
            <div
              ref={(el) => {
                if (el) columnHeaderRefs.current.set(col.id, el);
                else columnHeaderRefs.current.delete(col.id);
              }}
              className={columnHeader}
              role="group"
              tabIndex={onColumnsChange ? 0 : undefined}
              aria-label={`${col.title} column header. Press Shift+ArrowLeft or Shift+ArrowRight to reorder.`}
              onPointerDown={handleColumnHeaderPointerDown(col.id, columnIndex)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onKeyDown={(e) => handleColumnHeaderKeyDown(e, col.id, columnIndex)}
            >
              <span className={columnTitle}>{col.title}</span>
              <span className={countBadge}>{col.cards.length}</span>
              {col.wipLimit !== undefined ? (
                <Badge
                  variant={wipExceeded ? "warning" : "default"}
                  data-wip-exceeded={wipExceeded || undefined}
                >
                  {col.cards.length}/{col.wipLimit}
                </Badge>
              ) : null}
              {onColumnsChange ? (
                <button
                  type="button"
                  className={removeButton}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => removeColumn(col.id)}
                  aria-label={`Remove column ${col.title}`}
                >
                  ×
                </button>
              ) : null}
            </div>
            <div className={cardList}>
              {col.cards.length === 0 && !showCardIndicator ? (
                <div className={emptyColumn}>No cards</div>
              ) : (
                cardItems.map((cardItem_, i) => {
                  if (cardItem_.type === "indicator") {
                    return (
                      <div
                        key={`card-indicator-${i}`}
                        className={cardDropIndicator}
                        aria-hidden="true"
                      />
                    );
                  }
                  const c = cardItem_.card;
                  const cardIndex = col.cards.findIndex((x) => x.id === c.id);
                  const isDraggingThisCard = drag?.kind === "card" && drag.card.id === c.id;
                  return (
                    <Card
                      key={c.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(c.id, el);
                        else cardRefs.current.delete(c.id);
                      }}
                      elevation="raised"
                      className={cardItem}
                      role="button"
                      tabIndex={0}
                      data-dragging={isDraggingThisCard || undefined}
                      onClick={() => handleCardActivate(c, col.id)}
                      onKeyDown={(e) => handleCardKeyDown(e, c, col.id, cardIndex)}
                      onPointerDown={handleCardPointerDown(c, col.id, cardIndex)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerCancel}
                    >
                      <div className={cardHeader}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {renderCard ? renderCard(c) : <DefaultCard card={c} />}
                        </div>
                        {onColumnsChange ? (
                          <button
                            type="button"
                            className={removeButton}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCard(col.id, c.id);
                            }}
                            aria-label={`Remove card ${c.title}`}
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
            {onAddCard ? (
              <div className={addCardSlot}>
                <Button
                  type="button"
                  variant="ghost"
                  className={addCardButton}
                  onClick={() => onAddCard(col.id)}
                >
                  + Add card
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
      {onAddColumn ? (
        <div className={addColumn}>
          <Button type="button" variant="ghost" onClick={onAddColumn}>
            + Add column
          </Button>
        </div>
      ) : null}
      {drag ? (
        <div
          className={dragPreview}
          style={{
            left: drag.clientX - drag.offsetX,
            top: drag.clientY - drag.offsetY,
            width: drag.width,
          }}
        >
          {drag.kind === "card" ? (
            <>
              <span className={dragPreviewTitle}>{drag.card.title}</span>
              {drag.card.tags && drag.card.tags.length > 0 ? (
                <span className={dragPreviewMeta}>{drag.card.tags.join(", ")}</span>
              ) : null}
            </>
          ) : (
            <>
              <span className={dragPreviewTitle}>
                {columns.find((c) => c.id === drag.columnId)?.title}
              </span>
              <span className={dragPreviewMeta}>
                {columns.find((c) => c.id === drag.columnId)?.cards.length} cards
              </span>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
