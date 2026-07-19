import type { ReactNode } from "react";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  /** Extra searchable terms not shown in the label. */
  keywords?: string[];
  /** Display-only, e.g. "⌘K". */
  shortcut?: string;
  /** Groups render under a section header, in the order groups first appear in `commands`. */
  group?: string;
  onSelect: () => void;
  disabled?: boolean;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  /** Overrides the default case-insensitive substring match against label + keywords + group. */
  filterCommands?: (commands: CommandItem[], query: string) => CommandItem[];
  /** Number of rows (commands + group headers) at/above which the list switches to virtualized rendering. */
  virtualizationThreshold?: number;
  /** Row height (px) used for virtualized rows; defaults to the `.option` class's rendered height. */
  rowHeight?: number;
  "aria-label"?: string;
}
