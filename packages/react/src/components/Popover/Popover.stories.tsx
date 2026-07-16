import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { Popover } from "./Popover";

const meta: Meta<typeof Popover> = {
  title: "Components/Popover",
  component: Popover,
  args: {
    placement: "bottom-start"
  },
  render: (args) => (
    <div style={{ padding: "80px" }}>
      <Popover
        {...args}
        content={
          <Stack gap="sm">
            <strong>Popover title</strong>
            <span>Some supporting content lives here.</span>
          </Stack>
        }
      >
        <Button variant="secondary">Click me</Button>
      </Popover>
    </div>
  )
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {};
