import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  args: {
    variant: "info",
    title: "Heads up",
    children: "This is an informational message.",
    style: { width: "420px" }
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "success", "warning", "danger"]
    }
  }
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = { args: { variant: "info" } };

export const Success: Story = {
  args: { variant: "success", title: "Success", children: "Your changes have been saved." }
};

export const Warning: Story = {
  args: { variant: "warning", title: "Warning", children: "This action may have side effects." }
};

export const Danger: Story = {
  args: { variant: "danger", title: "Error", children: "Something went wrong. Please try again." }
};

export const Dismissible: Story = {
  args: { onDismiss: () => {} }
};
