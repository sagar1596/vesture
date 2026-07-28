import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KanbanBoard } from "./KanbanBoard";
import type { KanbanColumn } from "./types";

const columns: KanbanColumn[] = [
  {
    id: "todo",
    title: "To do",
    cards: [
      { id: "1", title: "First task" },
      { id: "2", title: "Second task" },
    ],
  },
  {
    id: "in-progress",
    title: "In progress",
    wipLimit: 1,
    cards: [
      { id: "3", title: "Over limit A" },
      { id: "4", title: "Over limit B" },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [],
  },
];

describe("KanbanBoard", () => {
  it("renders columns and cards from props", () => {
    render(<KanbanBoard columns={columns} />);

    expect(screen.getByText("To do")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("First task")).toBeInTheDocument();
    expect(screen.getByText("Second task")).toBeInTheDocument();
    expect(screen.getByText("Over limit A")).toBeInTheDocument();
  });

  it("fires onAddCard with the column id", () => {
    const onAddCard = vi.fn();
    render(<KanbanBoard columns={columns} onAddCard={onAddCard} />);

    const addButtons = screen.getAllByText("+ Add card");
    fireEvent.click(addButtons[0]!);

    expect(onAddCard).toHaveBeenCalledWith("todo");
  });

  it("fires onAddColumn", () => {
    const onAddColumn = vi.fn();
    render(<KanbanBoard columns={columns} onAddColumn={onAddColumn} />);

    fireEvent.click(screen.getByText("+ Add column"));

    expect(onAddColumn).toHaveBeenCalledTimes(1);
  });

  it("fires onCardClick with the correct card and columnId", () => {
    const onCardClick = vi.fn();
    render(<KanbanBoard columns={columns} onCardClick={onCardClick} />);

    fireEvent.click(screen.getByText("First task"));

    expect(onCardClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", title: "First task" }),
      "todo"
    );
  });

  it("renders a warning treatment when wipLimit is exceeded", () => {
    render(<KanbanBoard columns={columns} />);

    const badge = screen.getByText("2/1");
    expect(badge).toHaveAttribute("data-wip-exceeded", "true");
  });

  it("does not flag a column under its wipLimit", () => {
    const underLimit: KanbanColumn[] = [
      { id: "todo", title: "To do", wipLimit: 5, cards: [{ id: "1", title: "Task" }] },
    ];
    render(<KanbanBoard columns={underLimit} />);

    const badge = screen.getByText("1/5");
    expect(badge).not.toHaveAttribute("data-wip-exceeded");
  });

  it("uses renderCard override when provided", () => {
    render(
      <KanbanBoard
        columns={columns}
        renderCard={(card) => <div>Custom: {card.title}</div>}
      />
    );

    expect(screen.getByText("Custom: First task")).toBeInTheDocument();
    expect(screen.queryByText("First task")).not.toBeInTheDocument();
  });

  it("uses default rendering when renderCard is not provided", () => {
    render(<KanbanBoard columns={columns} />);

    expect(screen.getByText("First task")).toBeInTheDocument();
  });

  it("removes a card via onColumnsChange when onColumnsChange is provided", () => {
    const onColumnsChange = vi.fn();
    render(<KanbanBoard columns={columns} onColumnsChange={onColumnsChange} />);

    fireEvent.click(screen.getByLabelText("Remove card First task"));

    const next = onColumnsChange.mock.calls[0]![0] as KanbanColumn[];
    const todoColumn = next.find((c) => c.id === "todo")!;
    expect(todoColumn.cards.map((c) => c.id)).toEqual(["2"]);
  });

  it("removes a column via onColumnsChange when onColumnsChange is provided", () => {
    const onColumnsChange = vi.fn();
    render(<KanbanBoard columns={columns} onColumnsChange={onColumnsChange} />);

    fireEvent.click(screen.getByLabelText("Remove column To do"));

    const next = onColumnsChange.mock.calls[0]![0] as KanbanColumn[];
    expect(next.map((c) => c.id)).toEqual(["in-progress", "done"]);
  });
});

interface FakeRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function mockRect(el: Element, rect: FakeRect) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    x: rect.left,
    y: rect.top,
    toJSON() {
      return {};
    },
  } as DOMRect);
}

function getCardEl(title: string): HTMLElement {
  return screen.getByText(title).closest('[role="button"]') as HTMLElement;
}

function getColumnEl(title: string): HTMLElement {
  return screen.getByText(title).closest('[role="listitem"]') as HTMLElement;
}

describe("KanbanBoard drag and drop", () => {
  it("a drag that doesn't move anything fires onCardClick instead of reordering", () => {
    const onCardClick = vi.fn();
    const onColumnsChange = vi.fn();
    render(
      <KanbanBoard
        columns={columns}
        onCardClick={onCardClick}
        onColumnsChange={onColumnsChange}
      />
    );

    const card = getCardEl("First task");
    fireEvent.pointerDown(card, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(card, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(onCardClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" }),
      "todo"
    );
    expect(onColumnsChange).not.toHaveBeenCalled();
  });

  it("reorders a card within the same column via pointer drag", () => {
    const onColumnsChange = vi.fn();
    const reorderColumns: KanbanColumn[] = [
      {
        id: "todo",
        title: "To do",
        cards: [
          { id: "1", title: "Card One" },
          { id: "2", title: "Card Two" },
          { id: "3", title: "Card Three" },
        ],
      },
    ];
    render(
      <KanbanBoard columns={reorderColumns} onColumnsChange={onColumnsChange} />
    );

    mockRect(getColumnEl("To do"), { left: 0, right: 280, top: 0, bottom: 400 });
    const card1 = getCardEl("Card One");
    mockRect(card1, { left: 0, right: 280, top: 0, bottom: 40 });
    mockRect(getCardEl("Card Two"), { left: 0, right: 280, top: 40, bottom: 80 });
    mockRect(getCardEl("Card Three"), { left: 0, right: 280, top: 80, bottom: 120 });

    fireEvent.pointerDown(card1, { pointerId: 1, clientX: 10, clientY: 10 });
    // Past card three's midpoint (100) — drops card one at the end.
    fireEvent.pointerMove(card1, { pointerId: 1, clientX: 10, clientY: 110 });
    fireEvent.pointerUp(card1, { pointerId: 1, clientX: 10, clientY: 110 });

    const next = onColumnsChange.mock.calls[0]![0] as KanbanColumn[];
    expect(next[0]!.cards.map((c) => c.id)).toEqual(["2", "3", "1"]);
  });

  it("moves a card across columns via pointer drag", () => {
    const onColumnsChange = vi.fn();
    const crossColumns: KanbanColumn[] = [
      {
        id: "todo",
        title: "To do",
        cards: [
          { id: "1", title: "Card One" },
          { id: "2", title: "Card Two" },
        ],
      },
      {
        id: "doing",
        title: "Doing",
        cards: [{ id: "3", title: "Card Three" }],
      },
    ];
    render(
      <KanbanBoard columns={crossColumns} onColumnsChange={onColumnsChange} />
    );

    mockRect(getColumnEl("To do"), { left: 0, right: 280, top: 0, bottom: 400 });
    mockRect(getColumnEl("Doing"), { left: 280, right: 560, top: 0, bottom: 400 });
    const card1 = getCardEl("Card One");
    mockRect(card1, { left: 0, right: 280, top: 0, bottom: 40 });
    mockRect(getCardEl("Card Three"), { left: 280, right: 560, top: 0, bottom: 40 });

    fireEvent.pointerDown(card1, { pointerId: 1, clientX: 10, clientY: 10 });
    // X lands inside the "Doing" column; Y is past card three's midpoint (20).
    fireEvent.pointerMove(card1, { pointerId: 1, clientX: 300, clientY: 50 });
    fireEvent.pointerUp(card1, { pointerId: 1, clientX: 300, clientY: 50 });

    const next = onColumnsChange.mock.calls[0]![0] as KanbanColumn[];
    expect(next.find((c) => c.id === "todo")!.cards.map((c) => c.id)).toEqual(["2"]);
    expect(next.find((c) => c.id === "doing")!.cards.map((c) => c.id)).toEqual([
      "3",
      "1",
    ]);
  });

  it("reorders columns via pointer drag on the column header", () => {
    const onColumnsChange = vi.fn();
    const threeColumns: KanbanColumn[] = [
      { id: "a", title: "Alpha", cards: [] },
      { id: "b", title: "Beta", cards: [] },
      { id: "c", title: "Gamma", cards: [] },
    ];
    render(
      <KanbanBoard columns={threeColumns} onColumnsChange={onColumnsChange} />
    );

    mockRect(getColumnEl("Alpha"), { left: 0, right: 280, top: 0, bottom: 400 });
    mockRect(getColumnEl("Beta"), { left: 280, right: 560, top: 0, bottom: 400 });
    mockRect(getColumnEl("Gamma"), { left: 560, right: 840, top: 0, bottom: 400 });

    const header = screen.getByRole("group", { name: /Alpha column header/ });
    fireEvent.pointerDown(header, { pointerId: 1, clientX: 10, clientY: 10 });
    // Past Gamma's midpoint (700, among the columns other than Alpha) — moves Alpha to the end.
    fireEvent.pointerMove(header, { pointerId: 1, clientX: 900, clientY: 10 });
    fireEvent.pointerUp(header, { pointerId: 1, clientX: 900, clientY: 10 });

    const next = onColumnsChange.mock.calls[0]![0] as KanbanColumn[];
    expect(next.map((c) => c.id)).toEqual(["b", "c", "a"]);
  });

  it("shows the wipLimit warning treatment on the hovered column during drag-over without blocking the drop", () => {
    const onColumnsChange = vi.fn();
    const wipColumns: KanbanColumn[] = [
      { id: "a", title: "Alpha", cards: [{ id: "1", title: "Card One" }] },
      {
        id: "b",
        title: "Beta",
        wipLimit: 1,
        cards: [{ id: "2", title: "Card Two" }],
      },
    ];
    render(<KanbanBoard columns={wipColumns} onColumnsChange={onColumnsChange} />);

    const columnB = getColumnEl("Beta");
    mockRect(getColumnEl("Alpha"), { left: 0, right: 280, top: 0, bottom: 400 });
    mockRect(columnB, { left: 280, right: 560, top: 0, bottom: 400 });
    const card1 = getCardEl("Card One");
    mockRect(card1, { left: 0, right: 280, top: 0, bottom: 40 });
    mockRect(getCardEl("Card Two"), { left: 280, right: 560, top: 0, bottom: 40 });

    fireEvent.pointerDown(card1, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(card1, { pointerId: 1, clientX: 300, clientY: 50 });

    expect(columnB).toHaveAttribute("data-wip-warning", "true");

    fireEvent.pointerUp(card1, { pointerId: 1, clientX: 300, clientY: 50 });

    expect(onColumnsChange).toHaveBeenCalledTimes(1);
    const next = onColumnsChange.mock.calls[0]![0] as KanbanColumn[];
    expect(next.find((c) => c.id === "b")!.cards.map((c) => c.id)).toEqual([
      "2",
      "1",
    ]);
  });

  describe("keyboard reordering", () => {
    it("ArrowDown moves a focused card down within its column", () => {
      const onColumnsChange = vi.fn();
      const cols: KanbanColumn[] = [
        {
          id: "todo",
          title: "To do",
          cards: [
            { id: "1", title: "Card One" },
            { id: "2", title: "Card Two" },
            { id: "3", title: "Card Three" },
          ],
        },
      ];
      render(<KanbanBoard columns={cols} onColumnsChange={onColumnsChange} />);

      fireEvent.keyDown(getCardEl("Card One"), { key: "ArrowDown" });

      const next = onColumnsChange.mock.calls[0]![0] as KanbanColumn[];
      expect(next[0]!.cards.map((c) => c.id)).toEqual(["2", "1", "3"]);
    });

    it("ArrowRight moves a focused card to the same position in the next column", () => {
      const onColumnsChange = vi.fn();
      const cols: KanbanColumn[] = [
        {
          id: "a",
          title: "Alpha",
          cards: [
            { id: "1", title: "Card One" },
            { id: "2", title: "Card Two" },
          ],
        },
        { id: "b", title: "Beta", cards: [{ id: "3", title: "Card Three" }] },
      ];
      render(<KanbanBoard columns={cols} onColumnsChange={onColumnsChange} />);

      fireEvent.keyDown(getCardEl("Card Two"), { key: "ArrowRight" });

      const next = onColumnsChange.mock.calls[0]![0] as KanbanColumn[];
      expect(next.find((c) => c.id === "a")!.cards.map((c) => c.id)).toEqual(["1"]);
      expect(next.find((c) => c.id === "b")!.cards.map((c) => c.id)).toEqual([
        "3",
        "2",
      ]);
    });

    it("Shift+ArrowRight on a focused column header reorders the column", () => {
      const onColumnsChange = vi.fn();
      const cols: KanbanColumn[] = [
        { id: "a", title: "Alpha", cards: [] },
        { id: "b", title: "Beta", cards: [] },
        { id: "c", title: "Gamma", cards: [] },
      ];
      render(<KanbanBoard columns={cols} onColumnsChange={onColumnsChange} />);

      fireEvent.keyDown(screen.getByRole("group", { name: /Alpha column header/ }), {
        key: "ArrowRight",
        shiftKey: true,
      });

      const next = onColumnsChange.mock.calls[0]![0] as KanbanColumn[];
      expect(next.map((c) => c.id)).toEqual(["b", "a", "c"]);
    });

    it("plain ArrowRight (no shift) on a column header does not reorder", () => {
      const onColumnsChange = vi.fn();
      const cols: KanbanColumn[] = [
        { id: "a", title: "Alpha", cards: [] },
        { id: "b", title: "Beta", cards: [] },
      ];
      render(<KanbanBoard columns={cols} onColumnsChange={onColumnsChange} />);

      fireEvent.keyDown(screen.getByRole("group", { name: /Alpha column header/ }), {
        key: "ArrowRight",
      });

      expect(onColumnsChange).not.toHaveBeenCalled();
    });
  });
});
