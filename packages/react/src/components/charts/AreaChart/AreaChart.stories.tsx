import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaChart } from "./AreaChart";
import { InteractiveAreaChart } from "./AreaChart.interactive";
import type { AreaChartDataPoint } from "./types";

const data: AreaChartDataPoint[] = [
  { x: "Jan", revenue: 120, cost: 90 },
  { x: "Feb", revenue: 180, cost: 110 },
  { x: "Mar", revenue: 150, cost: 130 },
  { x: "Apr", revenue: 220, cost: 140 },
  { x: "May", revenue: 260, cost: 150 },
  { x: "Jun", revenue: 240, cost: 160 }
];

const series = [
  { key: "revenue", label: "Revenue" },
  { key: "cost", label: "Cost" }
];

const meta: Meta<typeof AreaChart> = {
  title: "Components/Charts/AreaChart",
  component: AreaChart
};

export default meta;
type Story = StoryObj<typeof AreaChart>;

export const StaticOverlapping: Story = {
  render: () => <AreaChart width={640} height={320} data={data} series={series} stacked={false} />
};

export const StaticStacked: Story = {
  render: () => <AreaChart width={640} height={320} data={data} series={series} stacked />
};

export const InteractiveWithTooltip: Story = {
  render: () => (
    <div style={{ width: 640, height: 320 }}>
      <InteractiveAreaChart height={320} data={data} series={series} stacked={false} />
    </div>
  )
};

export const EmptyState: Story = {
  render: () => <AreaChart width={640} height={320} data={[]} series={series} />
};
