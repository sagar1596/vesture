import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";

function Demo() {
  const { toast } = useToast();

  return (
    <Stack direction="row" gap="sm" wrap>
      <Button
        variant="secondary"
        onClick={() => toast({ title: "Saved", description: "Your changes have been saved." })}
      >
        Default
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: "Success", variant: "success", description: "Item created." })}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: "Warning", variant: "warning", description: "Check your input." })}
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: "Error", variant: "danger", description: "Something went wrong." })}
      >
        Danger
      </Button>
    </Stack>
  );
}

const meta: Meta<typeof ToastProvider> = {
  title: "Components/Toast",
  component: ToastProvider,
  render: () => (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  )
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

export const Default: Story = {};
