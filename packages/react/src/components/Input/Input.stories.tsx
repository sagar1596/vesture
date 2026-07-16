import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  args: {
    placeholder: "you@example.com",
    disabled: false,
    invalid: false
  }
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "not-an-email" }
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "disabled@example.com" }
};
