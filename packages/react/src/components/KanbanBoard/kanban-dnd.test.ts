import { describe, expect, it } from "vitest";
import {
  buildColumnRenderItems,
  findHoveredIndex,
  findInsertIndex,
  moveCard,
  reorderColumns,
} from "./kanban-dnd";
import type { KanbanColumn } from "./types";

function rect(start: number, end: number) {
  return { start, end };
}

describe("findInsertIndex", () => {
  it("returns 0 for an empty list", () => {
    expect(findInsertIndex(50, [])).toBe(0);
  });

  it("returns the index before the first rect whose midpoint the pointer is above", () => {
    const rects = [rect(0, 10), rect(10, 20), rect(20, 30)];
    expect(findInsertIndex(4, rects)).toBe(0);
    expect(findInsertIndex(14, rects)).toBe(1);
    expect(findInsertIndex(24, rects)).toBe(2);
  });

  it("returns rects.length when the pointer is past every midpoint", () => {
    const rects = [rect(0, 10), rect(10, 20)];
    expect(findInsertIndex(19, rects)).toBe(2);
  });
});

describe("findHoveredIndex", () => {
  it("returns 0 for an empty list", () => {
    expect(findHoveredIndex(50, [])).toBe(0);
  });

  it("returns the first rect containing the pointer", () => {
    const rects = [rect(0, 100), rect(100, 200), rect(200, 300)];
    expect(findHoveredIndex(50, rects)).toBe(0);
    expect(findHoveredIndex(150, rects)).toBe(1);
    expect(findHoveredIndex(250, rects)).toBe(2);
  });

  it("clamps to the first column when the pointer is before every rect", () => {
    expect(findHoveredIndex(-50, [rect(0, 100), rect(100, 200)])).toBe(0);
  });

  it("clamps to the last column when the pointer is past every rect", () => {
    expect(findHoveredIndex(500, [rect(0, 100), rect(100, 200)])).toBe(1);
  });
});

describe("moveCard", () => {
  const columns: KanbanColumn[] = [
    { id: "a", title: "A", cards: [{ id: "1", title: "One" }, { id: "2", title: "Two" }] },
    { id: "b", title: "B", cards: [{ id: "3", title: "Three" }] },
  ];

  it("reorders within the same column", () => {
    const next = moveCard(columns, "a", 0, "a", 1);
    expect(next.find((c) => c.id === "a")!.cards.map((c) => c.id)).toEqual(["2", "1"]);
  });

  it("is a no-op when inserted back at its own position", () => {
    const next = moveCard(columns, "a", 0, "a", 0);
    expect(next.find((c) => c.id === "a")!.cards.map((c) => c.id)).toEqual(["1", "2"]);
  });

  it("moves a card into a different column at the given index", () => {
    const next = moveCard(columns, "a", 0, "b", 1);
    const colA = next.find((c) => c.id === "a")!;
    const colB = next.find((c) => c.id === "b")!;
    expect(colA.cards.map((c) => c.id)).toEqual(["2"]);
    expect(colB.cards.map((c) => c.id)).toEqual(["3", "1"]);
  });

  it("inserts at the front of the target column", () => {
    const next = moveCard(columns, "a", 1, "b", 0);
    const colB = next.find((c) => c.id === "b")!;
    expect(colB.cards.map((c) => c.id)).toEqual(["2", "3"]);
  });

  it("returns the original columns when the source card doesn't exist", () => {
    const next = moveCard(columns, "a", 99, "b", 0);
    expect(next).toBe(columns);
  });
});

describe("reorderColumns", () => {
  const columns: KanbanColumn[] = [
    { id: "a", title: "A", cards: [] },
    { id: "b", title: "B", cards: [] },
    { id: "c", title: "C", cards: [] },
  ];

  it("moves a column later", () => {
    const next = reorderColumns(columns, 0, 2);
    expect(next.map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("moves a column earlier", () => {
    const next = reorderColumns(columns, 2, 0);
    expect(next.map((c) => c.id)).toEqual(["c", "a", "b"]);
  });

  it("is a no-op when inserted back at its own position", () => {
    const next = reorderColumns(columns, 1, 1);
    expect(next.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });
});

describe("buildColumnRenderItems", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("returns plain card items with no indicator when not dragging", () => {
    const items = buildColumnRenderItems(cards, null, false, -1);
    expect(items).toEqual(cards.map((card) => ({ type: "card", card })));
  });

  it("places the indicator at dropIndex among non-dragged cards", () => {
    const items = buildColumnRenderItems(cards, null, true, 1);
    expect(items.map((i) => (i.type === "indicator" ? "indicator" : i.card.id))).toEqual([
      "a",
      "indicator",
      "b",
      "c",
    ]);
  });

  it("appends the indicator at the end when dropIndex equals the list length", () => {
    const items = buildColumnRenderItems(cards, null, true, 3);
    expect(items.map((i) => (i.type === "indicator" ? "indicator" : i.card.id))).toEqual([
      "a",
      "b",
      "c",
      "indicator",
    ]);
  });

  it("keeps the dragged card in place and counts the indicator position against the other cards", () => {
    // b is being dragged; dropIndex 1 means "after the first non-dragged card (a)".
    const items = buildColumnRenderItems(cards, "b", true, 1);
    expect(items.map((i) => (i.type === "indicator" ? "indicator" : i.card.id))).toEqual([
      "a",
      "b",
      "indicator",
      "c",
    ]);
  });
});
