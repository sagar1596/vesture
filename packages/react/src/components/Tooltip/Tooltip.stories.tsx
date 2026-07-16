import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  args: {
    content: "Helpful tooltip text",
    placement: "top"
  },
  argTypes: {
    placement: {
      control: "select",
      options: ["top", "bottom", "left", "right"]
    }
  },
  render: (args) => (
    <div style={{ padding: "80px" }}>
      <Tooltip {...args}>
        <Button variant="secondary">Hover or focus me</Button>
      </Tooltip>
    </div>
  )
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Top: Story = { args: { placement: "top" } };
export const Bottom: Story = { args: { placement: "bottom" } };
export const Left: Story = { args: { placement: "left" } };
export const Right: Story = { args: { placement: "right" } };
