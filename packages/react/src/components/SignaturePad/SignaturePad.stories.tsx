import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { SignaturePad } from "./SignaturePad";
import type { SignaturePadHandle } from "./types";

const meta: Meta<typeof SignaturePad> = {
  title: "Components/SignaturePad",
  component: SignaturePad
};

export default meta;
type Story = StoryObj<typeof SignaturePad>;

export const Default: Story = {};

export const CustomColors: Story = {
  args: {
    penColor: "#1d4ed8",
    penWidth: 4,
    backgroundColor: "#f8fafc"
  }
};

export const Disabled: Story = {
  args: { disabled: true }
};

export const WithRefUsageExample: Story = {
  render: (args) => {
    function RefDemo() {
      const padRef = useRef<SignaturePadHandle>(null);
      return (
        <Stack gap="sm">
          <SignaturePad {...args} ref={padRef} showClearButton={false} />
          <Stack direction="row" gap="sm">
            <Button variant="secondary" onClick={() => padRef.current?.clear()}>
              Clear (via ref)
            </Button>
            <Button
              variant="secondary"
              onClick={() => alert(`isEmpty: ${padRef.current?.isEmpty()}`)}
            >
              Check isEmpty
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const dataUrl = padRef.current?.toDataURL();
                if (dataUrl) window.open(dataUrl, "_blank");
              }}
            >
              Open toDataURL()
            </Button>
          </Stack>
        </Stack>
      );
    }
    return <RefDemo />;
  }
};
