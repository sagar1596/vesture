import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  args: {
    disabled: false,
    invalid: false
  },
  render: (args) => (
    <Select {...args}>
      <option value="">Choose an option</option>
      <option value="a">Option A</option>
      <option value="b">Option B</option>
      <option value="c">Option C</option>
    </Select>
  )
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { invalid: true }
};

export const Disabled: Story = {
  args: { disabled: true }
};
