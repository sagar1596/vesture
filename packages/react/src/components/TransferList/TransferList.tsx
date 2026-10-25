import { useId, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  actionButton,
  actions,
  count,
  empty,
  groupLabel,
  header,
  headerTitle,
  list,
  panel,
  root,
  row,
  search
} from "./TransferList.css";

export interface TransferItem {
  key: string;
  label: string;
  disabled?: boolean;
  /** Items sharing a group are listed under a heading. */
  group?: string;
}

export interface TransferListProps {
  items: TransferItem[];
  /** Keys currently in the target list. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (targetKeys: string[]) => void;
  titles?: [string, string];
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Custom matching for the search box. Defaults to case-insensitive label contains. */
  filterItem?: (item: TransferItem, query: string) => boolean;
  renderItem?: (item: TransferItem) => ReactNode;
  /** Height of each list (px). */
  listHeight?: number;
  /** Allow a double-click to move one item across. Default true. */
  doubleClickMoves?: boolean;
  /** Maximum number of items allowed in the target list. */
  maxTarget?: number;
  emptyText?: [ReactNode, ReactNode];
  className?: string;
}

/** Dual listbox: move items between a source and a target list with search and bulk actions. */
export function TransferList({
  items,
  value: controlledValue,
  defaultValue = [],
  onChange,
  titles = ["Available", "Selected"],
  searchable = true,
  searchPlaceholder = "Search",
  filterItem = (item, q) => item.label.toLowerCase().includes(q.toLowerCase()),
  renderItem,
  listHeight = 240,
  doubleClickMoves = true,
  maxTarget,
  emptyText = ["Nothing available", "Nothing selected"],
  className
}: TransferListProps): ReactElement {
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue);
  const target = controlledValue !== undefined ? controlledValue : uncontrolled;
  const [checked, setChecked] = useState<Record<"source" | "target", string[]>>({ source: [], target: [] });
  const [queries, setQueries] = useState({ source: "", target: "" });
  const uid = useId();

  const targetSet = new Set(target);
  const byKey = new Map(items.map((i) => [i.key, i]));
  const lists = {
    source: items.filter((i) => !targetSet.has(i.key)),
    // keep the order the caller's `value` has so reordering by the parent is respected
    target: target.map((k) => byKey.get(k)).filter((i): i is TransferItem => !!i)
  };

  const commit = (next: string[]) => {
    const capped = maxTarget !== undefined ? next.slice(0, maxTarget) : next;
    if (controlledValue === undefined) setUncontrolled(capped);
    onChange?.(capped);
  };

  const visible = (side: "source" | "target") =>
    lists[side].filter((i) => queries[side].trim() === "" || filterItem(i, queries[side].trim()));
  const enabled = (side: "source" | "target") => visible(side).filter((i) => !i.disabled);

  const moveKeys = (side: "source" | "target", keys: string[]) => {
    if (keys.length === 0) return;
    if (side === "source") commit([...target, ...keys]);
    else commit(target.filter((k) => !keys.includes(k)));
    setChecked((c) => ({ ...c, [side]: [] }));
  };

  const toggle = (side: "source" | "target", key: string) =>
    setChecked((c) => ({ ...c, [side]: c[side].includes(key) ? c[side].filter((k) => k !== key) : [...c[side], key] }));

  const room = maxTarget === undefined ? Infinity : maxTarget - target.length;
  const canMoveRight = checked.source.length > 0 && room > 0;
  const canMoveLeft = checked.target.length > 0;

  const renderPanel = (side: "source" | "target", title: string, emptyContent: ReactNode) => {
    const shown = visible(side);
    const selectable = enabled(side);
    const checkedHere = checked[side].filter((k) => lists[side].some((i) => i.key === k));
    const allChecked = selectable.length > 0 && selectable.every((i) => checkedHere.includes(i.key));
    let lastGroup: string | undefined;
    return (
      <section className={panel} aria-label={title} data-testid={`transfer-${side}`}>
        <div className={header}>
          <input
            type="checkbox"
            aria-label={`Select all in ${title}`}
            checked={allChecked}
            disabled={selectable.length === 0}
            onChange={() =>
              setChecked((c) => ({
                ...c,
                [side]: allChecked
                  ? c[side].filter((k) => !selectable.some((i) => i.key === k))
                  : Array.from(new Set([...c[side], ...selectable.map((i) => i.key)]))
              }))
            }
          />
          <span className={headerTitle}>{title}</span>
          <span className={count}>
            {checkedHere.length ? `${checkedHere.length}/` : ""}
            {lists[side].length}
          </span>
        </div>
        {searchable ? (
          <input
            className={search}
            type="search"
            aria-label={`Search ${title}`}
            placeholder={searchPlaceholder}
            value={queries[side]}
            onChange={(e) => setQueries((q) => ({ ...q, [side]: e.target.value }))}
          />
        ) : null}
        <ul className={list} style={{ height: listHeight }} aria-label={`${title} items`}>
          {shown.length === 0 ? <li className={empty}>{emptyContent}</li> : null}
          {shown.map((item) => {
            const showGroup = item.group !== undefined && item.group !== lastGroup;
            lastGroup = item.group;
            const isChecked = checked[side].includes(item.key);
            const id = `${uid}-${side}-${item.key}`;
            return (
              <li key={item.key} style={{ listStyle: "none" }}>
                {showGroup ? <div className={groupLabel}>{item.group}</div> : null}
                <label
                  htmlFor={id}
                  className={row}
                  data-disabled={!!item.disabled}
                  data-checked={isChecked}
                  onDoubleClick={doubleClickMoves && !item.disabled ? () => moveKeys(side, [item.key]) : undefined}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={isChecked}
                    disabled={item.disabled}
                    onChange={() => toggle(side, item.key)}
                  />
                  {renderItem ? renderItem(item) : item.label}
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      {renderPanel("source", titles[0], emptyText[0])}
      <div className={actions}>
        <button type="button" className={actionButton} aria-label="Move all to selected" disabled={enabled("source").length === 0 || room <= 0} onClick={() => moveKeys("source", enabled("source").map((i) => i.key).slice(0, room))}>
          »
        </button>
        <button type="button" className={actionButton} aria-label="Move checked to selected" disabled={!canMoveRight} onClick={() => moveKeys("source", checked.source.filter((k) => lists.source.some((i) => i.key === k)).slice(0, room))}>
          ›
        </button>
        <button type="button" className={actionButton} aria-label="Move checked to available" disabled={!canMoveLeft} onClick={() => moveKeys("target", checked.target)}>
          ‹
        </button>
        <button type="button" className={actionButton} aria-label="Move all to available" disabled={enabled("target").length === 0} onClick={() => moveKeys("target", enabled("target").map((i) => i.key))}>
          «
        </button>
      </div>
      {renderPanel("target", titles[1], emptyText[1])}
    </div>
  );
}
