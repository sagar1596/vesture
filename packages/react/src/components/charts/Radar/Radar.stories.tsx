import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadarChart } from "./Radar";

const axes = ["Quality", "Speed", "Cost", "Support", "Security", "Docs"].map((l) => ({ key: l, label: l }));
const meta: Meta<typeof RadarChart> = { title: "Components/Charts/RadarChart", component: RadarChart };
export default meta;
type Story = StoryObj<typeof RadarChart>;

export const Default: Story = {
  render: () => (
    <RadarChart
      axes={axes}
      max={10}
      showRingLabels
      series={[
        { key: "a", label: "Vesture", values: [9, 8, 7, 6, 9, 8] },
        { key: "b", label: "Rival", values: [6, 7, 9, 8, 5, 4] }
      ]}
    />
  )
};
export const CircleRings: Story = {
  render: () => <RadarChart axes={axes} shape="circle" fillOpacity={0.4} series={[{ key: "a", label: "A", values: [5, 7, 3, 8, 6, 4] }]} />
};
