import { useState } from "react";
import type { FormEvent, ReactElement, ReactNode } from "react";
import { defaultOperator, describeValue, operatorsFor } from "./filters";
import type { FilterCondition, FilterField } from "./filters";
import {
  button,
  chip as chipClass,
  chipField,
  chipLabel,
  chipRemove,
  chipValue,
  control,
  editor,
  muted,
  primaryButton,
  root,
  row
} from "./FilterBar.css";

export interface FilterView {
  id: string;
  name: string;
  conditions: FilterCondition[];
}

export interface FilterBarProps {
  fields: FilterField[];
  value?: FilterCondition[];
  defaultValue?: FilterCondition[];
  onChange?: (conditions: FilterCondition[]) => void;
  /** Saved views offered in a dropdown; picking one replaces the current conditions. */
  views?: FilterView[];
  /** When provided, a "Save view" action appears. */
  onSaveView?: (name: string, conditions: FilterCondition[]) => void;
  onDeleteView?: (view: FilterView) => void;
  addLabel?: string;
  clearLabel?: string;
  /** Replaces a chip's text. */
  renderChip?: (condition: FilterCondition, field: FilterField, defaultLabel: ReactNode) => ReactNode;
  /** Shown when there are no conditions and the editor is closed. */
  emptyHint?: ReactNode;
  className?: string;
}

let counter = 0;
const newId = () => `f${++counter}-${Date.now().toString(36)}`;

/** Composable filter chips: add, edit and remove conditions, with optional saved views. */
export function FilterBar({
  fields,
  value: controlledValue,
  defaultValue = [],
  onChange,
  views,
  onSaveView,
  onDeleteView,
  addLabel = "Add filter",
  clearLabel = "Clear all",
  renderChip,
  emptyHint,
  className
}: FilterBarProps): ReactElement {
  const [uncontrolled, setUncontrolled] = useState<FilterCondition[]>(defaultValue);
  const conditions = controlledValue !== undefined ? controlledValue : uncontrolled;
  const [editing, setEditing] = useState<{ id: string | null; field: string; operator: string; value: string } | null>(null);
  const [savingView, setSavingView] = useState<string | null>(null);

  const byKey = new Map(fields.map((f) => [f.key, f]));
  const commit = (next: FilterCondition[]) => {
    if (controlledValue === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const open = (c?: FilterCondition) => {
    const first = fields[0];
    if (c) setEditing({ id: c.id, field: c.field, operator: c.operator, value: c.value });
    else if (first) setEditing({ id: null, field: first.key, operator: defaultOperator(first), value: initialValue(first) });
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const field = byKey.get(editing.field);
    if (!field) return;
    if (field.type !== "boolean" && editing.value.trim() === "") return;
    const next: FilterCondition = { id: editing.id ?? newId(), field: editing.field, operator: editing.operator, value: editing.value };
    commit(editing.id ? conditions.map((c) => (c.id === editing.id ? next : c)) : [...conditions, next]);
    setEditing(null);
  };

  const editingField = editing ? byKey.get(editing.field) : undefined;

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      <div className={row}>
        {conditions.map((c) => {
          const field = byKey.get(c.field);
          if (!field) return null;
          const op = operatorsFor(field).find((o) => o.key === c.operator)?.label ?? c.operator;
          const label = (
            <>
              <span className={chipField}>{field.label}</span> {op} <span className={chipValue}>{describeValue(field, c.value)}</span>
            </>
          );
          return (
            <span key={c.id} className={chipClass} data-testid="filter-chip" data-editing={editing?.id === c.id}>
              <button
                type="button"
                className={chipLabel}
                aria-label={`Edit filter: ${field.label} ${op} ${describeValue(field, c.value)}`}
                onClick={() => open(c)}
              >
                {renderChip ? renderChip(c, field, label) : label}
              </button>
              <button
                type="button"
                className={chipRemove}
                aria-label={`Remove filter: ${field.label}`}
                onClick={() => {
                  commit(conditions.filter((x) => x.id !== c.id));
                  if (editing?.id === c.id) setEditing(null);
                }}
              >
                ×
              </button>
            </span>
          );
        })}
        {!editing ? (
          <button type="button" className={button} onClick={() => open()} disabled={fields.length === 0}>
            + {addLabel}
          </button>
        ) : null}
        {conditions.length > 0 ? (
          <button type="button" className={button} onClick={() => commit([])}>
            {clearLabel}
          </button>
        ) : null}
        {views && views.length > 0 ? (
          <select
            className={control}
            aria-label="Saved views"
            value=""
            onChange={(e) => {
              const v = views.find((x) => x.id === e.target.value);
              if (v) commit(v.conditions.map((c) => ({ ...c })));
            }}
          >
            <option value="">Saved views…</option>
            {views.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        ) : null}
        {onSaveView && conditions.length > 0 && savingView === null ? (
          <button type="button" className={button} onClick={() => setSavingView("")}>
            Save view
          </button>
        ) : null}
        {onDeleteView && views && views.length > 0 ? (
          <select
            className={control}
            aria-label="Delete a saved view"
            value=""
            onChange={(e) => {
              const v = views.find((x) => x.id === e.target.value);
              if (v) onDeleteView(v);
            }}
          >
            <option value="">Delete view…</option>
            {views.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {savingView !== null ? (
        <form
          className={editor}
          onSubmit={(e) => {
            e.preventDefault();
            const name = savingView.trim();
            if (!name) return;
            onSaveView?.(name, conditions);
            setSavingView(null);
          }}
        >
          <input
            className={control}
            aria-label="View name"
            placeholder="View name"
            autoFocus
            value={savingView}
            onChange={(e) => setSavingView(e.target.value)}
          />
          <button type="submit" className={`${button} ${primaryButton}`}>
            Save
          </button>
          <button type="button" className={button} onClick={() => setSavingView(null)}>
            Cancel
          </button>
        </form>
      ) : null}

      {editing && editingField ? (
        <form className={editor} onSubmit={submit} aria-label={editing.id ? "Edit filter" : "New filter"}>
          <select
            className={control}
            aria-label="Field"
            value={editing.field}
            onChange={(e) => {
              const f = byKey.get(e.target.value)!;
              setEditing({ ...editing, field: f.key, operator: defaultOperator(f), value: initialValue(f) });
            }}
          >
            {fields.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className={control}
            aria-label="Operator"
            value={editing.operator}
            onChange={(e) => setEditing({ ...editing, operator: e.target.value })}
          >
            {operatorsFor(editingField).map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          {editingField.type === "select" ? (
            <select className={control} aria-label="Value" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })}>
              {editingField.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : editingField.type === "boolean" ? (
            <select className={control} aria-label="Value" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : (
            <input
              className={control}
              aria-label="Value"
              type={editingField.type === "number" ? "number" : editingField.type === "date" ? "date" : "text"}
              value={editing.value}
              autoFocus
              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
            />
          )}
          <button type="submit" className={`${button} ${primaryButton}`}>
            {editing.id ? "Update" : "Apply"}
          </button>
          <button type="button" className={button} onClick={() => setEditing(null)}>
            Cancel
          </button>
        </form>
      ) : null}

      {conditions.length === 0 && !editing && emptyHint ? <span className={muted}>{emptyHint}</span> : null}
    </div>
  );
}

function initialValue(field: FilterField): string {
  if (field.type === "select") return field.options?.[0]?.value ?? "";
  if (field.type === "boolean") return "true";
  return "";
}
