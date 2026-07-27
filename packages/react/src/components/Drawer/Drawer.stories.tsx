import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { Drawer } from "./Drawer";
import type { DrawerSide } from "./types";

const meta: Meta<typeof Drawer> = {
  title: "Components/Drawer",
  component: Drawer
};

export default meta;
type Story = StoryObj<typeof Drawer>;

function DrawerDemo({ side, size }: { side?: DrawerSide; size?: string | number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer open={open} onOpenChange={setOpen} title="Drawer title" side={side} size={size}>
        <Stack gap="lg">
          <p style={{ margin: 0 }}>Drawer content goes here.</p>
          <Stack direction="row" gap="sm" justify="end">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </Stack>
        </Stack>
      </Drawer>
    </>
  );
}

export const RightSide: Story = {
  render: () => <DrawerDemo side="right" />
};

export const LeftSide: Story = {
  render: () => <DrawerDemo side="left" />
};

export const TopSide: Story = {
  render: () => <DrawerDemo side="top" />
};

export const BottomSide: Story = {
  render: () => <DrawerDemo side="bottom" />
};

export const CustomSize: Story = {
  render: () => <DrawerDemo side="right" size="560px" />
};

export const WithLongContent: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open drawer</Button>
        <Drawer open={open} onOpenChange={setOpen} title="Terms and conditions">
          <Stack gap="md">
            {Array.from({ length: 30 }, (_, index) => (
              <p key={index} style={{ margin: 0 }}>
                Paragraph {index + 1}: this drawer has more content than fits in the viewport, so
                it should scroll internally rather than growing off-screen.
              </p>
            ))}
          </Stack>
        </Drawer>
      </>
    );
  }
};
