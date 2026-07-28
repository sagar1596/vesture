import type { ReactNode } from "react";

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  assignee?: { name: string; avatarUrl?: string };
  data?: unknown;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  /** Optional work-in-progress cap, shown as a count badge. Exceeding it is visually flagged but not blocking. */
  wipLimit?: number;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnsChange?: (columns: KanbanColumn[]) => void;
  onCardClick?: (card: KanbanCard, columnId: string) => void;
  /**
   * Fires when the "+ Add card" affordance is used. KanbanBoard does not
   * include a card-creation form itself — wire up a Modal/Drawer externally
   * and call onColumnsChange once the consumer has the new card's data.
   */
  onAddCard?: (columnId: string) => void;
  onAddColumn?: () => void;
  /** Override for fully custom card rendering. Falls back to a default card layout when omitted. */
  renderCard?: (card: KanbanCard) => ReactNode;
}
