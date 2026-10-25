import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarHeatmap } from "./CalendarHeatmap";

let seed = 3;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const data = Array.from({ length: 365 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
  value: rnd() > 0.35 ? Math.round(rnd() * 12) : 0
}));

const meta: Meta<typeof CalendarHeatmap> = { title: "Components/Charts/CalendarHeatmap", component: CalendarHeatmap };
export default meta;
type Story = StoryObj<typeof CalendarHeatmap>;

export const Default: Story = { render: () => <CalendarHeatmap year={2026} data={data} /> };
export const MondayStartCustom: Story = {
  render: () => (
    <CalendarHeatmap
      year={2026}
      data={data}
      weekStart={1}
      cellSize={14}
      cellRadius={7}
      colors={["#ececec", "#c6e48b", "#7bc96f", "#239a3b", "#196127"]}
    />
  )
};
