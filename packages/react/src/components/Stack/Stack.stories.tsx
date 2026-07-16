import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./Stack";

const swatch = (label: string) => (
  <div
    key={label}
    style={{
      padding: "12px 16px",
      background: "#e4e4e7",
      borderRadius: "8px"
    }}
  >
    {label}
  </div>
);

const meta: Meta<typeof Stack> = {
  title: "Components/Stack",
  component: Stack,
  args: {
    direction: "row",
    gap: "md",
    align: "stretch",
    justify: "start"
  },
  argTypes: {
    direction: { control: "select", options: ["row", "column"] },
    align: { control: "select", options: ["start", "center", "end", "stretch"] },
    justify: { control: "select", options: ["start", "center", "end", "between"] },
    gap: { control: "select", options: ["xs", "sm", "md", "lg", "xl", "2xl"] }
  },
  render: (args) => <Stack {...args}>{["One", "Two", "Three"].map(swatch)}</Stack>
};

export default meta;
type Story = StoryObj<typeof Stack>;

export const Row: Story = {
  args: { direction: "row" }
};

export const Column: Story = {
  args: { direction: "column" }
};
