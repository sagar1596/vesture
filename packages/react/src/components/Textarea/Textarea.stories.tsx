import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  args: {
    placeholder: "Write a message...",
    disabled: false,
    invalid: false
  }
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: "Too short" }
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Can't edit this" }
};
