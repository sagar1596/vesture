import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart } from "./BarChart";
import { InteractiveBarChart } from "./BarChart.interactive";
import type { BarChartDataPoint } from "./types";

const data: BarChartDataPoint[] = [
  { category: "Jan", revenue: 120, cost: 90 },
  { category: "Feb", revenue: 180, cost: 110 },
  { category: "Mar", revenue: 150, cost: 130 },
  { category: "Apr", revenue: 220, cost: 140 },
  { category: "May", revenue: 260, cost: 150 },
  { category: "Jun", revenue: 240, cost: 160 }
];

const series = [
  { key: "revenue", label: "Revenue" },
  { key: "cost", label: "Cost" }
];

const meta: Meta<typeof BarChart> = {
  title: "Components/Charts/BarChart",
  component: BarChart
};

export default meta;
type Story = StoryObj<typeof BarChart>;

export const StaticGrouped: Story = {
  render: () => <BarChart width={640} height={320} data={data} series={series} layout="grouped" />
};

export const StaticStacked: Story = {
  render: () => <BarChart width={640} height={320} data={data} series={series} layout="stacked" />
};

export const InteractiveWithTooltip: Story = {
  render: () => (
    <div style={{ width: 640, height: 320 }}>
      <InteractiveBarChart height={320} data={data} series={series} layout="grouped" />
    </div>
  )
};

export const EmptyState: Story = {
  render: () => <BarChart width={640} height={320} data={[]} series={series} />
};
