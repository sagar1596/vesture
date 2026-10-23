import type { Meta, StoryObj } from "@storybook/react-vite";
import { PivotGrid } from "./PivotGrid";

type Sale = { region: string; product: string; quarter: string; revenue: number; units: number };

const data: Sale[] = [
  { region: "North", product: "Widget", quarter: "Q1", revenue: 12400, units: 120 },
  { region: "North", product: "Widget", quarter: "Q2", revenue: 15800, units: 150 },
  { region: "North", product: "Gadget", quarter: "Q1", revenue: 8200, units: 40 },
  { region: "North", product: "Gadget", quarter: "Q3", revenue: 9100, units: 44 },
  { region: "South", product: "Widget", quarter: "Q1", revenue: 6400, units: 60 },
  { region: "South", product: "Widget", quarter: "Q2", revenue: 7900, units: 75 },
  { region: "South", product: "Gadget", quarter: "Q2", revenue: 11200, units: 52 },
  { region: "East", product: "Widget", quarter: "Q3", revenue: 18300, units: 170 },
  { region: "East", product: "Gadget", quarter: "Q1", revenue: 5600, units: 27 }
];

const meta: Meta<typeof PivotGrid<Sale>> = {
  title: "Components/PivotGrid",
  component: PivotGrid
};

export default meta;
type Story = StoryObj<typeof PivotGrid<Sale>>;

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const RevenueByRegionAndQuarter: Story = {
  args: { data, rows: ["region"], columns: "quarter", value: "revenue", formatValue: money }
};

export const NestedRows: Story = {
  args: { data, rows: ["region", "product"], columns: "quarter", value: "revenue", formatValue: money }
};

export const AverageUnits: Story = {
  args: { data, rows: ["product"], columns: "region", value: "units", aggregate: "avg" }
};

export const CountOnly: Story = {
  args: { data, rows: ["region"], aggregate: "count" }
};

export const MedianWithDrillDown: Story = {
  args: {
    data,
    rows: ["region"],
    columns: "quarter",
    value: "revenue",
    aggregate: (v: number[]) => {
      const s = [...v].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
    },
    formatValue: money,
    caption: "Median revenue",
    onCellClick: (info) => console.log("drill", info)
  }
};

export const HeatmapStyledCells: Story = {
  args: {
    data,
    rows: ["product"],
    columns: "region",
    value: "revenue",
    formatValue: money,
    columnOrder: ["North", "East", "South"],
    getCellStyle: (info) =>
      info.kind === "cell" && info.value !== null
        ? { background: `color-mix(in srgb, #2a78d6 ${Math.round((info.value / 30000) * 100)}%, transparent)` }
        : undefined
  }
};
