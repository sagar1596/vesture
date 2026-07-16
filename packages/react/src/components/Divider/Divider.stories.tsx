import type { Meta, StoryObj } from "@storybook/react-vite";
import { Divider } from "./Divider";

const meta: Meta<typeof Divider> = {
  title: "Components/Divider",
  component: Divider,
  args: {
    orientation: "horizontal"
  },
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] }
  }
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  render: (args) => (
    <div style={{ width: "240px" }}>
      <p>Above</p>
      <Divider {...args} />
      <p>Below</p>
    </div>
  )
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", height: "60px", gap: "12px" }}>
      <span>Left</span>
      <Divider {...args} />
      <span>Right</span>
    </div>
  )
};
