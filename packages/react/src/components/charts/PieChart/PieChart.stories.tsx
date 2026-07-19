import type { Meta, StoryObj } from "@storybook/react-vite";
import { PieChart } from "./PieChart";
import { InteractivePieChart } from "./PieChart.interactive";
import type { PieChartDataPoint } from "./types";

const data: PieChartDataPoint[] = [
  { key: "chrome", label: "Chrome", value: 62 },
  { key: "safari", label: "Safari", value: 20 },
  { key: "firefox", label: "Firefox", value: 10 },
  { key: "edge", label: "Edge", value: 8 }
];

const lopsidedData: PieChartDataPoint[] = [
  { key: "a", label: "Dominant", value: 90 },
  { key: "b", label: "Sliver 1", value: 2 },
  { key: "c", label: "Sliver 2", value: 2 },
  { key: "d", label: "Sliver 3", value: 2 },
  { key: "e", label: "Sliver 4", value: 2 },
  { key: "f", label: "Sliver 5", value: 2 }
];

const meta: Meta<typeof PieChart> = {
  title: "Components/Charts/PieChart",
  component: PieChart
};

export default meta;
type Story = StoryObj<typeof PieChart>;

export const StaticPie: Story = {
  render: () => <PieChart width={400} height={400} data={data} />
};

export const StaticDonut: Story = {
  render: () => <PieChart width={400} height={400} data={data} innerRadius={0.6} />
};

export const InteractiveWithLabelsAndTooltip: Story = {
  render: () => (
    <div style={{ width: 400, height: 400 }}>
      <InteractivePieChart height={400} data={data} />
    </div>
  )
};

export const ManySlicesNarrowLabels: Story = {
  render: () => <PieChart width={400} height={400} data={lopsidedData} />
};

export const EmptyState: Story = {
  render: () => <PieChart width={400} height={400} data={[]} />
};
