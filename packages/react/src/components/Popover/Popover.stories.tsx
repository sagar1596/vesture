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

const ScrollDemo = (props: { onAnchorScroll: "follow" | "close" }) => (
  <div style={{ height: "200px", width: "320px", overflow: "auto", border: "1px solid #ccc" }}>
    <div style={{ height: "150px" }} />
    <Popover
      onAnchorScroll={props.onAnchorScroll}
      content={
        <Stack gap="sm">
          <strong>Popover title</strong>
          <span>Scroll the container to see how the popover reacts.</span>
        </Stack>
      }
    >
      <Button variant="secondary">Anchor</Button>
    </Popover>
    <div style={{ height: "400px" }} />
  </div>
);

export const FollowsAnchorOnScroll: Story = {
  render: () => <ScrollDemo onAnchorScroll="follow" />
};

export const ClosesOnAnchorScroll: Story = {
  render: () => <ScrollDemo onAnchorScroll="close" />
};
