import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkline } from "./Sparkline";

const meta: Meta<typeof Sparkline> = {
  title: "Components/Sparkline",
  component: Sparkline,
  args: { values: [4, 6, 5, 9, 7, 12, 10, 15, 13, 18] }
};

export default meta;
type Story = StoryObj<typeof Sparkline>;

export const Line: Story = {};
export const Area: Story = { args: { type: "area" } };
export const Bar: Story = { args: { type: "bar" } };
export const Flat: Story = { args: { values: [3, 3, 3, 3] } };

export const Smooth: Story = { args: { type: "area", curve: "smooth", highlight: "minmax" } };
export const Step: Story = { args: { curve: "step", strokeWidth: 2 } };
export const BarsAroundBaseline: Story = {
  args: {
    type: "bar",
    values: [3, -2, 5, -4, 6, 2, -1, 4],
    baseline: 0,
    color: "#1baf7a",
    negativeColor: "#e34948",
    width: 160,
    height: 40
  }
};
