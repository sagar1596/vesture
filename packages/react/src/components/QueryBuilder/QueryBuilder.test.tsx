import { useState } from "react";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryBuilder } from "./QueryBuilder";
import { queryToString } from "./queryToString";
import type { QueryField, QueryGroup, QueryRule } from "./types";

const SIMPLE_FIELDS: QueryField[] = [
  { key: "status", label: "Status", type: "text" },
  { key: "age", label: "Age", type: "number" }
];

function emptyRoot(): QueryGroup {
  return { id: "root", combinator: "and", rules: [] };
}

function renderControlled(fields: QueryField[], initial: QueryGroup, maxDepth?: number) {
  const onChange = vi.fn();
  function Wrapper() {
    const [value, setValue] = useState(initial);
    return (
      <QueryBuilder
        fields={fields}
        value={value}
        maxDepth={maxDepth}
        onChange={(next) => {
          onChange(next);
          setValue(next);
        }}
      />
    );
  }
  const utils = render(<Wrapper />);
  return { onChange, ...utils };
}

describe("QueryBuilder", () => {
  it("adding a rule appends a new rule with the first field and its default operator/value", () => {
    const { onChange, getByRole } = renderControlled(SIMPLE_FIELDS, emptyRoot());
    fireEvent.click(getByRole("button", { name: "+ Add rule" }));

    const next = onChange.mock.calls[0]![0] as QueryGroup;
    expect(next.rules).toHaveLength(1);
    const rule = next.rules[0] as QueryRule;
    expect(rule.field).toBe("status");
    expect(rule.operator).toBe("contains"); // first operator defined for "text"
  });

  it("adding a group appends an empty AND group", () => {
    const { onChange, getByRole } = renderControlled(SIMPLE_FIELDS, emptyRoot());
    fireEvent.click(getByRole("button", { name: "+ Add group" }));

    const next = onChange.mock.calls[0]![0] as QueryGroup;
    expect(next.rules).toHaveLength(1);
    const group = next.rules[0] as QueryGroup;
    expect(group.combinator).toBe("and");
    expect(group.rules).toEqual([]);
  });

  it("changing a rule's field resets the operator to a valid one for the new field type", () => {
    const initial: QueryGroup = {
      id: "root",
      combinator: "and",
      rules: [{ id: "r1", field: "status", operator: "startsWith", value: "Ac" }]
    };
    const { onChange, getByRole } = renderControlled(SIMPLE_FIELDS, initial);

    fireEvent.change(getByRole("combobox", { name: "Field" }), { target: { value: "age" } });

    const next = onChange.mock.calls[0]![0] as QueryGroup;
    const rule = next.rules[0] as QueryRule;
    expect(rule.field).toBe("age");
    // "startsWith" isn't valid for a number field, so it must reset —
    // "equals" is the first operator defined for "number".
    expect(rule.operator).toBe("equals");
  });

  it("keeps the operator when it's still valid for the new field type", () => {
    const initial: QueryGroup = {
      id: "root",
      combinator: "and",
      rules: [{ id: "r1", field: "status", operator: "equals", value: "Active" }]
    };
    const { onChange, getByRole } = renderControlled(SIMPLE_FIELDS, initial);

    fireEvent.change(getByRole("combobox", { name: "Field" }), { target: { value: "age" } });

    const next = onChange.mock.calls[0]![0] as QueryGroup;
    const rule = next.rules[0] as QueryRule;
    // "equals" exists for both text and number, so it should be kept, not reset.
    expect(rule.operator).toBe("equals");
  });

  it("removing a top-level rule updates the group correctly", () => {
    const initial: QueryGroup = {
      id: "root",
      combinator: "and",
      rules: [
        { id: "r1", field: "status", operator: "equals", value: "Active" },
        { id: "r2", field: "age", operator: "gt", value: 25 }
      ]
    };
    const { onChange, getAllByRole } = renderControlled(SIMPLE_FIELDS, initial);

    fireEvent.click(getAllByRole("button", { name: "Remove rule" })[0]!);

    const next = onChange.mock.calls[0]![0] as QueryGroup;
    expect(next.rules).toHaveLength(1);
    expect((next.rules[0] as QueryRule).id).toBe("r2");
  });

  it("removing a nested group updates the tree correctly at that depth", () => {
    const initial: QueryGroup = {
      id: "root",
      combinator: "and",
      rules: [
        { id: "r1", field: "status", operator: "equals", value: "Active" },
        {
          id: "g1",
          combinator: "or",
          rules: [{ id: "r2", field: "age", operator: "gt", value: 25 }]
        }
      ]
    };
    const { onChange, getByRole } = renderControlled(SIMPLE_FIELDS, initial);

    fireEvent.click(getByRole("button", { name: "Remove group" }));

    const next = onChange.mock.calls[0]![0] as QueryGroup;
    expect(next.rules).toHaveLength(1);
    expect((next.rules[0] as QueryRule).id).toBe("r1");
  });

  it("removing a rule nested two levels deep only affects that nested group", () => {
    const initial: QueryGroup = {
      id: "root",
      combinator: "and",
      rules: [
        {
          id: "g1",
          combinator: "and",
          rules: [
            {
              id: "g2",
              combinator: "and",
              rules: [
                { id: "r1", field: "status", operator: "equals", value: "Active" },
                { id: "r2", field: "age", operator: "gt", value: 25 }
              ]
            }
          ]
        }
      ]
    };
    const { onChange, getAllByRole } = renderControlled(SIMPLE_FIELDS, initial);

    fireEvent.click(getAllByRole("button", { name: "Remove rule" })[0]!);

    const next = onChange.mock.calls[0]![0] as QueryGroup;
    const g1 = next.rules[0] as QueryGroup;
    const g2 = g1.rules[0] as QueryGroup;
    expect(g2.rules).toHaveLength(1);
    expect((g2.rules[0] as QueryRule).id).toBe("r2");
    expect(g1.rules).toHaveLength(1); // g2 itself untouched at the outer level
  });

  it("disables + Add group once maxDepth is reached, without disabling + Add rule", () => {
    const { getByRole } = renderControlled(SIMPLE_FIELDS, emptyRoot(), 1);
    expect(getByRole("button", { name: "+ Add group" })).toBeDisabled();
    expect(getByRole("button", { name: "+ Add rule" })).not.toBeDisabled();
  });

  it("queryToString serializes a nested group into the documented format", () => {
    const group: QueryGroup = {
      id: "root",
      combinator: "or",
      rules: [
        {
          id: "g1",
          combinator: "and",
          rules: [
            { id: "r1", field: "status", operator: "equals", value: "Active" },
            { id: "r2", field: "age", operator: "gt", value: 25 }
          ]
        },
        { id: "r3", field: "department", operator: "equals", value: "Engineering" }
      ]
    };
    expect(queryToString(group)).toBe(
      "(status equals 'Active' AND age gt 25) OR department equals 'Engineering'"
    );
  });

  it("queryToString returns an empty string for a group with no rules", () => {
    expect(queryToString(emptyRoot())).toBe("");
  });
});
