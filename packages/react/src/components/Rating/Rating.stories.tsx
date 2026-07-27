import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Rating } from "./Rating";

const meta: Meta<typeof Rating> = {
  title: "Components/Rating",
  component: Rating,
  args: {
    "aria-label": "Rate this product"
  }
};

export default meta;
type Story = StoryObj<typeof Rating>;

export const Default: Story = {};

export const WithHalfStars: Story = {
  args: { allowHalf: true, defaultValue: 3.5 }
};

export const ReadOnlyDisplay: Story = {
  args: { readOnly: true, value: 4.2 }
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 3 }
};

export const CustomMax: Story = {
  args: { max: 10, defaultValue: 6 }
};

export const ControlledValue: Story = {
  render: (args) => {
    function ControlledDemo() {
      const [value, setValue] = useState(2);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Rating {...args} value={value} onChange={setValue} />
          <span>Current value: {value}</span>
        </div>
      );
    }
    return <ControlledDemo />;
  }
};
