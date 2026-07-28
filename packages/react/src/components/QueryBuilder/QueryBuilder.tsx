import type { ChangeEvent, ReactElement } from "react";
import { Button } from "../Button";
import { Combobox } from "../Combobox";
import type { ComboboxOption } from "../Combobox";
import { DatePicker } from "../DatePicker";
import { DateRangePicker } from "../DateRangePicker";
import type { DateRange } from "../DateRangePicker";
import { NumberInput } from "../NumberInput";
import { Input } from "../Input";
import { Select } from "../Select";
import { defaultOperatorForType, defaultValueForOperator, isOperatorValidForType, OPERATORS_BY_TYPE } from "./operators";
import {
  actionsRow,
  combinatorButton,
  combinatorGroup,
  fieldSelect,
  groupContainer,
  groupHeader,
  nestedGroupWrapper,
  operatorSelect,
  removeButton,
  root,
  ruleRow,
  rulesList,
  surfaceByDepth,
  valueInput,
  valuePairInput
} from "./QueryBuilder.css";
import type { QueryBuilderProps, QueryField, QueryGroup, QueryOperator, QueryRule } from "./types";
import { isQueryGroup } from "./types";

function generateId(): string {
  return crypto.randomUUID();
}

function makeRule(field: QueryField): QueryRule {
  const operator = defaultOperatorForType(field.type);
  return { id: generateId(), field: field.key, operator, value: defaultValueForOperator(field.type, operator) };
}

function makeGroup(): QueryGroup {
  return { id: generateId(), combinator: "and", rules: [] };
}

interface ValueInputProps {
  field: QueryField;
  operator: QueryOperator;
  value: unknown;
  onChange: (value: unknown) => void;
}

// Value input matches the field's type — text/number use Input/NumberInput,
// date uses DatePicker (or DateRangePicker for "between", since that's
// exactly the {start,end} shape it already produces), select uses Select
// (or Combobox in multi-select mode for "in", since a plain <select>
// doesn't give a friendly multi-value UI).
function ValueInput({ field, operator, value, onChange }: ValueInputProps): ReactElement {
  if (field.type === "text") {
    return (
      <Input
        className={valueInput}
        value={typeof value === "string" ? value : ""}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        aria-label={`Value for ${field.label}`}
      />
    );
  }

  if (field.type === "number") {
    if (operator === "between") {
      const [from, to] = (Array.isArray(value) ? value : [null, null]) as [number | null, number | null];
      return (
        <>
          <NumberInput
            className={valuePairInput}
            value={from}
            onChange={(next) => onChange([next, to])}
            aria-label={`Minimum value for ${field.label}`}
          />
          <NumberInput
            className={valuePairInput}
            value={to}
            onChange={(next) => onChange([from, next])}
            aria-label={`Maximum value for ${field.label}`}
          />
        </>
      );
    }
    return (
      <NumberInput
        className={valueInput}
        value={typeof value === "number" ? value : null}
        onChange={onChange}
        aria-label={`Value for ${field.label}`}
      />
    );
  }

  if (field.type === "date") {
    if (operator === "between") {
      const range = (value as DateRange | null) ?? { start: null, end: null };
      return <DateRangePicker value={range} onChange={onChange} />;
    }
    return (
      <DatePicker
        value={(value as Date | null) ?? null}
        onChange={onChange}
        aria-label={`Value for ${field.label}`}
      />
    );
  }

  // field.type === "select"
  const options: ComboboxOption[] = field.options ?? [];
  if (operator === "in") {
    return (
      <Combobox
        multiple
        options={options}
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={onChange}
        aria-label={`Value for ${field.label}`}
        placeholder="Select…"
      />
    );
  }
  return (
    <Select
      className={valueInput}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      aria-label={`Value for ${field.label}`}
    >
      <option value="" disabled>
        Select…
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

interface QueryRuleEditorProps {
  rule: QueryRule;
  fields: QueryField[];
  onChange: (rule: QueryRule) => void;
  onRemove: () => void;
}

function QueryRuleEditor({ rule, fields, onChange, onRemove }: QueryRuleEditorProps): ReactElement {
  const field = fields.find((f) => f.key === rule.field) ?? fields[0]!;
  const operators = OPERATORS_BY_TYPE[field.type];

  function handleFieldChange(key: string) {
    const nextField = fields.find((f) => f.key === key)!;
    const keepOperator = isOperatorValidForType(nextField.type, rule.operator);
    const nextOperator = keepOperator ? rule.operator : defaultOperatorForType(nextField.type);
    onChange({
      ...rule,
      field: key,
      operator: nextOperator,
      value: keepOperator ? rule.value : defaultValueForOperator(nextField.type, nextOperator)
    });
  }

  function handleOperatorChange(operator: QueryOperator) {
    onChange({ ...rule, operator, value: defaultValueForOperator(field.type, operator) });
  }

  return (
    <div className={ruleRow}>
      <Select
        className={fieldSelect}
        value={rule.field}
        onChange={(event) => handleFieldChange(event.target.value)}
        aria-label="Field"
      >
        {fields.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </Select>
      <Select
        className={operatorSelect}
        value={rule.operator}
        onChange={(event) => handleOperatorChange(event.target.value as QueryOperator)}
        aria-label="Operator"
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </Select>
      <ValueInput
        field={field}
        operator={rule.operator}
        value={rule.value}
        onChange={(value) => onChange({ ...rule, value })}
      />
      <button type="button" className={removeButton} aria-label="Remove rule" onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}

interface QueryGroupEditorProps {
  group: QueryGroup;
  fields: QueryField[];
  maxDepth: number;
  depth: number;
  onChange: (group: QueryGroup) => void;
  onRemove?: () => void;
}

function QueryGroupEditor({ group, fields, maxDepth, depth, onChange, onRemove }: QueryGroupEditorProps): ReactElement {
  function updateItem(id: string, next: QueryRule | QueryGroup) {
    onChange({ ...group, rules: group.rules.map((item) => (item.id === id ? next : item)) });
  }

  function removeItem(id: string) {
    onChange({ ...group, rules: group.rules.filter((item) => item.id !== id) });
  }

  function addRule() {
    if (fields.length === 0) return;
    onChange({ ...group, rules: [...group.rules, makeRule(fields[0]!)] });
  }

  function addGroup() {
    onChange({ ...group, rules: [...group.rules, makeGroup()] });
  }

  const canAddGroup = depth < maxDepth;

  return (
    <div className={[groupContainer, surfaceByDepth[depth % 2 === 0 ? "even" : "odd"]].join(" ")}>
      <div className={groupHeader}>
        <div className={combinatorGroup} role="group" aria-label="Combinator">
          <button
            type="button"
            className={combinatorButton}
            aria-pressed={group.combinator === "and"}
            onClick={() => onChange({ ...group, combinator: "and" })}
          >
            AND
          </button>
          <button
            type="button"
            className={combinatorButton}
            aria-pressed={group.combinator === "or"}
            onClick={() => onChange({ ...group, combinator: "or" })}
          >
            OR
          </button>
        </div>
        {onRemove ? (
          <button type="button" className={removeButton} aria-label="Remove group" onClick={onRemove}>
            ✕
          </button>
        ) : null}
      </div>

      <div className={rulesList}>
        {group.rules.map((item) =>
          isQueryGroup(item) ? (
            <div key={item.id} className={nestedGroupWrapper}>
              <QueryGroupEditor
                group={item}
                fields={fields}
                maxDepth={maxDepth}
                depth={depth + 1}
                onChange={(next) => updateItem(item.id, next)}
                onRemove={() => removeItem(item.id)}
              />
            </div>
          ) : (
            <QueryRuleEditor
              key={item.id}
              rule={item}
              fields={fields}
              onChange={(next) => updateItem(item.id, next)}
              onRemove={() => removeItem(item.id)}
            />
          )
        )}
      </div>

      <div className={actionsRow}>
        <Button type="button" variant="ghost" onClick={addRule}>
          + Add rule
        </Button>
        <Button type="button" variant="ghost" onClick={addGroup} disabled={!canAddGroup}>
          + Add group
        </Button>
      </div>
    </div>
  );
}

export function QueryBuilder({ fields, value, onChange, maxDepth = 3, className }: QueryBuilderProps): ReactElement {
  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      <QueryGroupEditor group={value} fields={fields} maxDepth={maxDepth} depth={1} onChange={onChange} />
    </div>
  );
}
