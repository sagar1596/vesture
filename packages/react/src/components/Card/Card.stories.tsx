import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  args: {
    elevation: "flat",
    children: "Card content"
  },
  argTypes: {
    elevation: {
      control: "select",
      options: ["flat", "raised", "overlay"]
    }
  }
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Flat: Story = {
  args: { elevation: "flat" }
};

export const Raised: Story = {
  args: { elevation: "raised" }
};

export const Overlay: Story = {
  args: { elevation: "overlay" }
};
