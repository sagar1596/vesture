import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { QueryBuilder } from "./QueryBuilder";
import { queryToString } from "./queryToString";
import type { QueryField, QueryGroup } from "./types";

const meta: Meta<typeof QueryBuilder> = {
  title: "Components/QueryBuilder",
  component: QueryBuilder
};

export default meta;
type Story = StoryObj<typeof QueryBuilder>;

const SIMPLE_FIELDS: QueryField[] = [
  { key: "status", label: "Status", type: "text" },
  { key: "age", label: "Age", type: "number" }
];

const ALL_FIELDS: QueryField[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "age", label: "Age", type: "number" },
  { key: "signupDate", label: "Signup date", type: "date" },
  {
    key: "department",
    label: "Department",
    type: "select",
    options: [
      { value: "engineering", label: "Engineering" },
      { value: "design", label: "Design" },
      { value: "sales", label: "Sales" }
    ]
  }
];

function QueryBuilderDemo({ fields, initial }: { fields: QueryField[]; initial: QueryGroup }) {
  const [value, setValue] = useState<QueryGroup>(initial);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "720px" }}>
      <QueryBuilder fields={fields} value={value} onChange={setValue} />
      <pre style={{ fontSize: "12px", whiteSpace: "pre-wrap" }}>{queryToString(value)}</pre>
    </div>
  );
}

export const SimpleFlatRules: Story = {
  render: () => (
    <QueryBuilderDemo
      fields={SIMPLE_FIELDS}
      initial={{
        id: "root",
        combinator: "and",
        rules: [
          { id: "r1", field: "status", operator: "equals", value: "Active" },
          { id: "r2", field: "age", operator: "gt", value: 25 }
        ]
      }}
    />
  )
};

export const NestedGroups: Story = {
  render: () => (
    <QueryBuilderDemo
      fields={SIMPLE_FIELDS}
      initial={{
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
          { id: "r3", field: "status", operator: "equals", value: "Pending" }
        ]
      }}
    />
  )
};

export const AllFieldTypes: Story = {
  render: () => (
    <QueryBuilderDemo
      fields={ALL_FIELDS}
      initial={{
        id: "root",
        combinator: "and",
        rules: [
          { id: "r1", field: "name", operator: "contains", value: "Ada" },
          { id: "r2", field: "age", operator: "between", value: [25, 40] },
          { id: "r3", field: "signupDate", operator: "after", value: null },
          { id: "r4", field: "department", operator: "in", value: ["engineering"] }
        ]
      }}
    />
  )
};

export const MaxDepthReached: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<QueryGroup>({
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
                rules: [{ id: "r1", field: "status", operator: "equals", value: "Active" }]
              }
            ]
          }
        ]
      });
      return <QueryBuilder fields={SIMPLE_FIELDS} value={value} onChange={setValue} maxDepth={3} />;
    }
    return <Demo />;
  }
};
