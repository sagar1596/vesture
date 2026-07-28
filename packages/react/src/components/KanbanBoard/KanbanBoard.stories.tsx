import { useState } from "react";
import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "../Avatar";
import { Badge } from "../Badge";
import { KanbanBoard } from "./KanbanBoard";
import type { KanbanCard, KanbanColumn } from "./types";

const meta: Meta<typeof KanbanBoard> = {
  title: "Components/KanbanBoard",
  component: KanbanBoard,
};

export default meta;
type Story = StoryObj<typeof KanbanBoard>;

function makeCard(id: string, title: string, extra?: Partial<KanbanCard>): KanbanCard {
  return { id, title, ...extra };
}

const baseColumns: KanbanColumn[] = [
  {
    id: "todo",
    title: "To do",
    cards: [
      makeCard("1", "Set up project scaffolding", {
        tags: ["setup"],
        assignee: { name: "Ada Lovelace" },
      }),
      makeCard("2", "Write design doc", {
        description: "Outline the API surface before implementation.",
        tags: ["docs"],
      }),
    ],
  },
  {
    id: "in-progress",
    title: "In progress",
    cards: [
      makeCard("3", "Build KanbanBoard component", {
        description: "Phase 2: pointer drag-and-drop plus keyboard reordering.",
        tags: ["feature", "react"],
        assignee: { name: "Grace Hopper" },
      }),
    ],
    wipLimit: 3,
  },
  {
    id: "done",
    title: "Done",
    cards: [
      makeCard("4", "Add NumberInput component", { tags: ["feature"] }),
      makeCard("5", "Add Slider component", { tags: ["feature"] }),
    ],
  },
];

export const Default: Story = {
  render: () => <KanbanBoard columns={baseColumns} />,
};

export const WithWipLimits: Story = {
  render: () => {
    const columns: KanbanColumn[] = [
      {
        id: "in-progress",
        title: "In progress",
        wipLimit: 2,
        cards: [
          makeCard("1", "Task under limit"),
          makeCard("2", "Task at limit"),
        ],
      },
      {
        id: "review",
        title: "Review",
        wipLimit: 2,
        cards: [
          makeCard("3", "Task exceeding limit A"),
          makeCard("4", "Task exceeding limit B"),
          makeCard("5", "Task exceeding limit C"),
        ],
      },
    ];
    return <KanbanBoard columns={columns} />;
  },
};

export const CustomCardRender: Story = {
  render: () => (
    <KanbanBoard
      columns={baseColumns}
      renderCard={(card) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <strong>{card.title}</strong>
          {card.assignee ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={card.assignee.name} size="sm" />
              <span style={{ fontSize: 12 }}>{card.assignee.name}</span>
            </div>
          ) : null}
          {card.tags?.map((tag) => (
            <Badge key={tag} variant="primary">
              {tag.toUpperCase()}
            </Badge>
          ))}
        </div>
      )}
    />
  ),
};

export const EmptyColumn: Story = {
  render: () => (
    <KanbanBoard
      columns={[
        { id: "todo", title: "To do", cards: [] },
        { id: "in-progress", title: "In progress", cards: [] },
        { id: "done", title: "Done", cards: [] },
      ]}
    />
  ),
};

// 60 cards in a single column, rendered with no virtualization. Phase 1
// found plain rendering held up fine at this count; phase 2 (drag-and-drop)
// re-checked that finding before adding drag mechanics and reached the same
// conclusion — see the "Recent context" note in CLAUDE.md for the full
// reasoning. TreeView/DataGrid's flatten-and-window approach stays on the
// shelf until a real column count is an order of magnitude larger.
export const ManyCards: Story = {
  render: () => (
    <KanbanBoard
      columns={[
        {
          id: "backlog",
          title: "Backlog",
          cards: Array.from({ length: 60 }, (_, i) =>
            makeCard(`card-${i}`, `Backlog item ${i + 1}`, {
              tags: i % 3 === 0 ? ["needs-triage"] : undefined,
            })
          ),
        },
      ]}
    />
  ),
};

export const Interactive: Story = {
  render: () => {
    const [columns, setColumns] = useState<KanbanColumn[]>(baseColumns);
    const [log, setLog] = useState<string[]>([]);
    const append = (entry: string) =>
      setLog((prev) => [entry, ...prev].slice(0, 5));

    return (
      <div>
        <KanbanBoard
          columns={columns}
          onColumnsChange={setColumns}
          onCardClick={(card, columnId) =>
            append(`Clicked "${card.title}" in ${columnId}`)
          }
          onAddCard={(columnId) => {
            const id = `new-${Date.now()}`;
            setColumns((prev) =>
              prev.map((col) =>
                col.id === columnId
                  ? { ...col, cards: [...col.cards, makeCard(id, "New card")] }
                  : col
              )
            );
            append(`Added card to ${columnId}`);
          }}
          onAddColumn={() => {
            const id = `new-col-${Date.now()}`;
            setColumns((prev) => [
              ...prev,
              { id, title: "New column", cards: [] },
            ]);
            append("Added column");
          }}
        />
        <ul style={{ marginTop: 16, fontSize: 12 }}>
          {log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      </div>
    );
  },
};

function Instructions({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, maxWidth: 640 }}>
      {children}
    </p>
  );
}

// Manual test: press the mouse down on a card and drag it up/down within its
// column — an insertion line shows where it will land, the original dims in
// place, and a small floating preview follows the pointer.
export const DragCardWithinColumn: Story = {
  render: () => {
    const [columns, setColumns] = useState<KanbanColumn[]>([
      {
        id: "todo",
        title: "To do",
        cards: [
          makeCard("1", "First"),
          makeCard("2", "Second"),
          makeCard("3", "Third"),
          makeCard("4", "Fourth"),
        ],
      },
    ]);
    return (
      <div>
        <Instructions>
          Drag any card up or down within the column to reorder it. Releasing
          at the same spot it started fires onCardClick instead of a reorder.
        </Instructions>
        <KanbanBoard columns={columns} onColumnsChange={setColumns} />
      </div>
    );
  },
};

// Manual test: drag a card sideways across the column boundary — the
// insertion line follows into whichever column the pointer is currently
// over, computed from both X (which column) and Y (which position).
export const DragCardAcrossColumns: Story = {
  render: () => {
    const [columns, setColumns] = useState<KanbanColumn[]>([
      {
        id: "todo",
        title: "To do",
        cards: [makeCard("1", "Move me right"), makeCard("2", "Stays put")],
      },
      {
        id: "in-progress",
        title: "In progress",
        cards: [makeCard("3", "Existing card")],
      },
      { id: "done", title: "Done", cards: [] },
    ]);
    return (
      <div>
        <Instructions>
          Drag "Move me right" into another column. The drop index within the
          target column is computed from the pointer's Y position relative to
          that column's existing cards.
        </Instructions>
        <KanbanBoard columns={columns} onColumnsChange={setColumns} />
      </div>
    );
  },
};

// Manual test: press down on a column HEADER (not its card list) and drag
// horizontally to reorder the columns themselves.
export const DragColumnReorder: Story = {
  render: () => {
    const [columns, setColumns] = useState<KanbanColumn[]>([
      { id: "a", title: "Backlog", cards: [makeCard("1", "Card")] },
      { id: "b", title: "To do", cards: [makeCard("2", "Card")] },
      { id: "c", title: "Done", cards: [makeCard("3", "Card")] },
    ]);
    return (
      <div>
        <Instructions>
          Drag a column by its header (not the card list) to reorder the
          columns. A vertical insertion line shows where the column will
          land.
        </Instructions>
        <KanbanBoard columns={columns} onColumnsChange={setColumns} />
      </div>
    );
  },
};

// Manual accessibility test: tab to a card and use ArrowUp/ArrowDown to
// reorder within its column, ArrowLeft/ArrowRight to move it to the same
// position in the adjacent column, and Shift+ArrowLeft/Right on a focused
// column header to reorder columns. Each keypress commits immediately (no
// separate confirm step) and is announced via an aria-live region for
// screen readers.
export const KeyboardOnlyCardMove: Story = {
  render: () => {
    const [columns, setColumns] = useState<KanbanColumn[]>([
      {
        id: "todo",
        title: "To do",
        cards: [makeCard("1", "First"), makeCard("2", "Second")],
      },
      {
        id: "in-progress",
        title: "In progress",
        cards: [makeCard("3", "Third")],
      },
      { id: "done", title: "Done", cards: [] },
    ]);
    return (
      <div>
        <Instructions>
          Tab to a card, then use ArrowUp/ArrowDown to reorder within its
          column or ArrowLeft/ArrowRight to move it to the same position in
          the adjacent column. Tab to a column header and use
          Shift+ArrowLeft/Shift+ArrowRight to reorder columns. No mouse
          needed for any of this.
        </Instructions>
        <KanbanBoard columns={columns} onColumnsChange={setColumns} />
      </div>
    );
  },
};

// Manual test: drag "Card A" from Backlog into Review, which is already at
// its wipLimit — the warning treatment (same as phase 1's static badge)
// appears on Review while hovering over it, but the drop is not blocked.
export const WipLimitWarningOnDrop: Story = {
  render: () => {
    const [columns, setColumns] = useState<KanbanColumn[]>([
      { id: "backlog", title: "Backlog", cards: [makeCard("a", "Card A")] },
      {
        id: "review",
        title: "Review",
        wipLimit: 1,
        cards: [makeCard("b", "Already at limit")],
      },
    ]);
    return (
      <div>
        <Instructions>
          Drag "Card A" into Review. Review is already at its wipLimit of 1,
          so it shows the warning treatment while you hover over it — but
          dropping still succeeds, since wipLimit stays informational, not
          enforced.
        </Instructions>
        <KanbanBoard columns={columns} onColumnsChange={setColumns} />
      </div>
    );
  },
};
