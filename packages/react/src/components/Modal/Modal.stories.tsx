import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { Modal } from "./Modal";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal open={open} onOpenChange={setOpen} title="Delete item">
          <Stack gap="lg">
            <p style={{ margin: 0 }}>
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <Stack direction="row" gap="sm" justify="end">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </Stack>
          </Stack>
        </Modal>
      </>
    );
  }
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {};
