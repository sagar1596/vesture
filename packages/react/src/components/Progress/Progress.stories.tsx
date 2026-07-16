import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./Progress";

const meta: Meta<typeof Progress> = {
  title: "Components/Progress",
  component: Progress,
  args: {
    value: 60,
    label: "Uploading",
    style: { width: "320px" }
  }
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Determinate: Story = {};

export const Indeterminate: Story = {
  args: { value: undefined, label: "Loading" }
};
