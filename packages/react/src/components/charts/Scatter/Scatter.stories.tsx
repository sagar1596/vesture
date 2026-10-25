import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScatterChart } from "./Scatter";

const rand = (seed: number) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const r = rand(7);
const pts = (n: number, slope: number) =>
  Array.from({ length: n }, (_, i) => ({ x: i * 3 + r() * 6, y: i * slope + r() * 20, size: r() * 100 }));

const meta: Meta<typeof ScatterChart> = { title: "Components/Charts/ScatterChart", component: ScatterChart };
export default meta;
type Story = StoryObj<typeof ScatterChart>;

export const Default: Story = {
  render: () => (
    <ScatterChart
      width={560}
      height={340}
      xLabel="Spend"
      yLabel="Revenue"
      series={[
        { key: "a", label: "Paid", points: pts(20, 2) },
        { key: "b", label: "Organic", points: pts(20, 1) }
      ]}
    />
  )
};

export const BubbleWithTrend: Story = {
  render: () => <ScatterChart width={560} height={340} trendline series={[{ key: "a", label: "Accounts", points: pts(25, 1.5) }]} />
};
