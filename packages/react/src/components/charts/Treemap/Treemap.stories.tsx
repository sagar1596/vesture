import type { Meta, StoryObj } from "@storybook/react-vite";
import { Treemap } from "./Treemap";
import type { TreemapDatum } from "./types";

const data: TreemapDatum[] = [
  { key: "eng", label: "Engineering", value: 420 },
  { key: "sales", label: "Sales", value: 260 },
  { key: "mkt", label: "Marketing", value: 150 },
  { key: "ops", label: "Operations", value: 120 },
  { key: "hr", label: "People", value: 60 },
  { key: "fin", label: "Finance", value: 45 },
  { key: "legal", label: "Legal", value: 20 }
];

const meta: Meta<typeof Treemap> = {
  title: "Components/Charts/Treemap",
  component: Treemap
};

export default meta;
type Story = StoryObj<typeof Treemap>;

export const Default: Story = {
  render: () => <Treemap width={560} height={340} data={data} formatValue={(v) => `$${v}k`} />
};

export const CustomColorsAndLabels: Story = {
  render: () => (
    <Treemap
      width={560}
      height={340}
      data={data}
      gap={6}
      cellRadius={8}
      selectedKey="eng"
      getColor={(d) => (d.value > 200 ? "#2a78d6" : "#8aa4c8")}
      renderLabel={(r, { percent }) => (
        <text x={10} y={22} fill="#fff" fontSize={13}>
          {r.datum.label} · {percent.toFixed(0)}%
        </text>
      )}
    />
  )
};
