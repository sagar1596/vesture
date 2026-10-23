import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heatmap } from "./Heatmap";

const hours = ["9a", "11a", "1p", "3p", "5p", "7p"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const values = days.map((_, d) => hours.map((_, h) => Math.round(20 + 60 * Math.abs(Math.sin((d + 1) * (h + 2))))));

const meta: Meta<typeof Heatmap> = {
  title: "Components/Charts/Heatmap",
  component: Heatmap
};

export default meta;
type Story = StoryObj<typeof Heatmap>;

export const Default: Story = {
  render: () => <Heatmap rows={days} columns={hours} values={values} width={520} height={280} />
};

export const WithGaps: Story = {
  render: () => (
    <Heatmap rows={days} columns={hours} values={values.map((r, i) => r.map((v, j) => ((i + j) % 4 === 0 ? null : v)))} width={520} height={280} />
  )
};

export const DivergingScale: Story = {
  render: () => (
    <Heatmap
      rows={days}
      columns={hours}
      values={values.map((r) => r.map((v) => v - 50))}
      width={520}
      height={280}
      gap={4}
      cellRadius={6}
      domain={[-50, 50]}
      colorScale={(t) => (t < 0.5 ? `hsl(210 70% ${35 + t * 60}%)` : `hsl(10 75% ${95 - t * 55}%)`)}
      formatValue={(v) => (v > 0 ? `+${v}` : String(v))}
    />
  )
};
