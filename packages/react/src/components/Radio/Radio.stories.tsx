import type { Meta, StoryObj } from "@storybook/react-vite";
import { Radio } from "./Radio";

const meta: Meta<typeof Radio> = {
  title: "Components/Radio",
  component: Radio,
  args: {
    label: "Option A",
    name: "story-radio",
    disabled: false
  }
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true }
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const Group: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Radio {...args} label="Option A" value="a" defaultChecked />
      <Radio {...args} label="Option B" value="b" />
      <Radio {...args} label="Option C" value="c" />
    </div>
  )
};
