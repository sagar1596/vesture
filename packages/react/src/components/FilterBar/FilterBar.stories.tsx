import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterBar } from "./FilterBar";
import type { FilterView } from "./FilterBar";
import { applyFilters } from "./filters";
import type { FilterCondition, FilterField } from "./filters";

const fields: FilterField[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "age", label: "Age", type: "number" },
  { key: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }] },
  { key: "joined", label: "Joined", type: "date" },
  { key: "vip", label: "VIP", type: "boolean" }
];
const rows = [
  { name: "Ada", age: 36, status: "active", joined: "2024-01-10", vip: true },
  { name: "Alan", age: 41, status: "paused", joined: "2023-06-01", vip: false },
  { name: "Grace", age: 85, status: "active", joined: "2022-03-15", vip: false }
];

const meta: Meta<typeof FilterBar> = { title: "Components/FilterBar", component: FilterBar };
export default meta;
type Story = StoryObj<typeof FilterBar>;

export const WithSavedViews: Story = {
  render: () => {
    const [value, setValue] = useState<FilterCondition[]>([]);
    const [views, setViews] = useState<FilterView[]>([]);
    const shown = applyFilters(rows, value, fields);
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <FilterBar
          fields={fields}
          value={value}
          onChange={setValue}
          views={views}
          onSaveView={(name, conditions) => setViews((v) => [...v, { id: `${v.length + 1}`, name, conditions }])}
          onDeleteView={(view) => setViews((v) => v.filter((x) => x.id !== view.id))}
          emptyHint="No filters applied"
        />
        <pre>{shown.map((r) => r.name).join(", ") || "No matches"}</pre>
      </div>
    );
  }
};
