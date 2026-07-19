import type { Meta, StoryObj } from "@storybook/react-vite";
import { LineChart } from "./LineChart";
import { InteractiveLineChart } from "./LineChart.interactive";
import type { LineChartDataPoint } from "./types";

const singleSeriesData: LineChartDataPoint[] = [
  { x: "Jan", revenue: 120 },
  { x: "Feb", revenue: 180 },
  { x: "Mar", revenue: 150 },
  { x: "Apr", revenue: 220 },
  { x: "May", revenue: 260 },
  { x: "Jun", revenue: 240 }
];

const multiSeriesData: LineChartDataPoint[] = [
  { x: "Jan", revenue: 120, cost: 90, profit: 30 },
  { x: "Feb", revenue: 180, cost: 110, profit: 70 },
  { x: "Mar", revenue: 150, cost: 130, profit: 20 },
  { x: "Apr", revenue: 220, cost: 140, profit: 80 },
  { x: "May", revenue: 260, cost: 150, profit: 110 },
  { x: "Jun", revenue: 240, cost: 160, profit: 80 }
];

const meta: Meta<typeof LineChart> = {
  title: "Components/Charts/LineChart",
  component: LineChart
};

export default meta;
type Story = StoryObj<typeof LineChart>;

export const StaticSingleSeries: Story = {
  render: () => (
    <LineChart
      width={640}
      height={320}
      data={singleSeriesData}
      series={[{ key: "revenue", label: "Revenue" }]}
    />
  )
};

export const StaticMultiSeries: Story = {
  render: () => (
    <LineChart
      width={640}
      height={320}
      data={multiSeriesData}
      series={[
        { key: "revenue", label: "Revenue" },
        { key: "cost", label: "Cost" },
        { key: "profit", label: "Profit" }
      ]}
    />
  )
};

export const InteractiveWithTooltip: Story = {
  render: () => (
    <div style={{ width: 640, height: 320 }}>
      <InteractiveLineChart
        height={320}
        data={multiSeriesData}
        series={[
          { key: "revenue", label: "Revenue" },
          { key: "cost", label: "Cost" },
          { key: "profit", label: "Profit" }
        ]}
      />
    </div>
  )
};

export const EmptyState: Story = {
  render: () => <LineChart width={640} height={320} data={[]} series={[{ key: "revenue", label: "Revenue" }]} />
};
