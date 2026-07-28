import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactElement } from "react";
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from "@floating-ui/react";
import { defaultFilterItems, useFilterableList } from "../../utils/useFilterableList";
import {
  emptyState,
  groupHeader,
  inputEl,
  list,
  option as optionClass,
  optionDescription,
  optionIcon,
  optionLabel,
  overlay,
  palette,
  shortcut as shortcutClass,
  virtualSpacer
} from "./CommandPalette.css";
import type { CommandItem, CommandPaletteProps } from "./types";

const DEFAULT_ROW_HEIGHT = 40;
const OVERSCAN = 5;

// CommandItem already has the { id, label, group?, keywords?, disabled? }
// shape useFilterableList's default filter expects — no adapting needed.
const defaultFilterCommands = defaultFilterItems<CommandItem>;

interface HeaderRow {
  type: "header";
  key: string;
  group: string;
}

interface ItemRow {
  type: "item";
  key: string;
  command: CommandItem;
  itemIndex: number;
}

type Row = HeaderRow | ItemRow;

// Interleaves group header rows above each group's items (skipped by keyboard
// nav, like a listbox with disabled separators) — mirrors DataGrid's group rows.
function buildRows(commands: CommandItem[]): { rows: Row[]; itemRowIndices: number[] } {
  const rows: Row[] = [];
  const itemRowIndices: number[] = [];
  const seenGroups = new Set<string>();

  commands.forEach((command, itemIndex) => {
    if (command.group && !seenGroups.has(command.group)) {
      seenGroups.add(command.group);
      rows.push({ type: "header", key: `__group-${command.group}`, group: command.group });
    }
    itemRowIndices[itemIndex] = rows.length;
    rows.push({ type: "item", key: command.id, command, itemIndex });
  });

  return { rows, itemRowIndices };
}

export function CommandPalette({
  open,
  onOpenChange,
  commands,
  placeholder = "Type a command or search...",
  emptyMessage = "No matching commands",
  filterCommands = defaultFilterCommands,
  virtualizationThreshold = 50,
  rowHeight = DEFAULT_ROW_HEIGHT,
  "aria-label": ariaLabel
}: CommandPaletteProps): ReactElement | null {
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(320);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  const { refs, context } = useFloating({ open, onOpenChange });
  const { getFloatingProps } = useInteractions([useDismiss(context), useRole(context, { role: "dialog" })]);

  // scrollRowIntoView (defined below, after itemRowIndices exists) needs to
  // react to activeIndex changes the hook drives internally — routed through
  // a ref so the callback passed into the hook can stay referentially stable
  // while still always calling the current render's version.
  const scrollCallbackRef = useRef<(index: number) => void>(() => {});
  const { filteredItems: filteredCommands, activeIndex, setActiveIndex, moveActiveIndex } = useFilterableList(
    commands,
    query,
    filterCommands,
    (index) => scrollCallbackRef.current(index)
  );
  const { rows, itemRowIndices } = useMemo(() => buildRows(filteredCommands), [filteredCommands]);

  const isVirtualized = rows.length >= virtualizationThreshold;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(null);
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [open]);

  useEffect(() => {
    // A new query invalidates the previous selection/scroll position.
    setActiveIndex(null);
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (!node) return;
    if (node.clientHeight > 0) setViewportHeight(node.clientHeight);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setViewportHeight(entry.contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [open]);

  if (!open) {
    return null;
  }

  const totalHeight = rows.length * rowHeight;
  const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
  const effectiveScrollTop = Math.min(scrollTop, maxScrollTop);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + OVERSCAN * 2;
  const startIndex = isVirtualized ? Math.max(0, Math.floor(effectiveScrollTop / rowHeight) - OVERSCAN) : 0;
  const endIndex = isVirtualized ? Math.min(rows.length, startIndex + visibleCount) : rows.length;
  const visibleRows = rows.slice(startIndex, endIndex);

  const scrollRowIntoView = (rowIndex: number) => {
    if (!isVirtualized) return;
    const rowTop = rowIndex * rowHeight;
    const rowBottom = rowTop + rowHeight;
    let next = scrollTop;
    if (rowTop < scrollTop) {
      next = rowTop;
    } else if (rowBottom > scrollTop + viewportHeight) {
      next = rowBottom - viewportHeight;
    } else {
      return;
    }
    setScrollTop(next);
    if (listRef.current) listRef.current.scrollTop = next;
  };

  scrollCallbackRef.current = (index: number) => {
    const rowIndex = itemRowIndices[index];
    if (rowIndex !== undefined) scrollRowIntoView(rowIndex);
  };

  const selectCommand = (command: CommandItem) => {
    if (command.disabled) return;
    command.onSelect();
    onOpenChange(false);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActiveIndex(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        moveActiveIndex(-1);
        return;
      case "Enter": {
        event.preventDefault();
        const active = activeIndex !== null ? filteredCommands[activeIndex] : undefined;
        if (active) selectCommand(active);
        return;
      }
      case "Escape":
        event.preventDefault();
        onOpenChange(false);
        return;
      default:
    }
  };

  const activeCommand = activeIndex !== null ? filteredCommands[activeIndex] : undefined;
  const activeOptionId = activeCommand ? `${listId}-option-${activeCommand.id}` : undefined;

  const renderRow = (row: Row, rowIndex: number, rowStyle?: CSSProperties) => {
    if (row.type === "header") {
      return (
        <div key={row.key} role="presentation" className={groupHeader} style={rowStyle}>
          {row.group}
        </div>
      );
    }

    const { command, itemIndex } = row;
    const isActive = itemIndex === activeIndex;

    return (
      <div
        key={row.key}
        id={`${listId}-option-${command.id}`}
        role="option"
        aria-selected={isActive}
        aria-disabled={command.disabled || undefined}
        data-active={isActive || undefined}
        className={optionClass}
        style={rowStyle}
        onMouseDown={(event) => {
          event.preventDefault();
          selectCommand(command);
        }}
        onMouseEnter={() => {
          if (!command.disabled) setActiveIndex(itemIndex);
        }}
      >
        {command.icon ? <span className={optionIcon}>{command.icon}</span> : null}
        <span className={optionLabel}>
          {command.label}
          {command.description ? <span className={optionDescription}>{command.description}</span> : null}
        </span>
        {command.shortcut ? <span className={shortcutClass}>{command.shortcut}</span> : null}
      </div>
    );
  };

  return (
    <FloatingPortal>
      <FloatingOverlay className={overlay} lockScroll>
        <FloatingFocusManager context={context} initialFocus={inputRef}>
          <div
            ref={refs.setFloating}
            className={palette}
            aria-label={ariaLabel ?? "Command palette"}
            {...getFloatingProps()}
          >
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              className={inputEl}
              value={query}
              placeholder={placeholder}
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={true}
              aria-controls={listId}
              aria-activedescendant={activeOptionId}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              className={list}
              onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            >
              {filteredCommands.length === 0 ? (
                <div className={emptyState}>{emptyMessage}</div>
              ) : isVirtualized ? (
                <div className={virtualSpacer} style={{ height: totalHeight }}>
                  {visibleRows.map((row, i) => {
                    const rowIndex = startIndex + i;
                    return renderRow(row, rowIndex, {
                      position: "absolute",
                      top: rowIndex * rowHeight,
                      left: 0,
                      right: 0,
                      height: rowHeight
                    });
                  })}
                </div>
              ) : (
                rows.map((row, rowIndex) => renderRow(row, rowIndex))
              )}
            </div>
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
