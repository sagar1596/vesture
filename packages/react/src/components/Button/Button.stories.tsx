import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Button",
    variant: "primary",
    disabled: false
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost"]
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary" }
};

export const Secondary: Story = {
  args: { variant: "secondary" }
};

export const Ghost: Story = {
  args: { variant: "ghost" }
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true }
};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "12px" }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
    </div>
  )
};
