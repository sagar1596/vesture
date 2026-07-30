import { useState } from "react";
import { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { ImageCropper } from "./ImageCropper";
import type { ImageCropperHandle, ImageCropperProps } from "./types";

const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80";

const meta: Meta<typeof ImageCropper> = {
  title: "Components/ImageCropper",
  component: ImageCropper,
  args: {
    src: SAMPLE_IMAGE
  }
};

export default meta;
type Story = StoryObj<typeof ImageCropper>;

// Renders the result of onCropComplete beneath the cropper so clicking the
// built-in "Crop" button (showConfirmButton) has a visible effect — the
// component itself never displays its own output, since it's a controlled
// primitive (see ImageCropperHandle.getCroppedImage docs).
function ConfirmButtonDemo(args: ImageCropperProps) {
  const [croppedSrc, setCroppedSrc] = useState<string | null>(null);
  return (
    <Stack gap="sm">
      <ImageCropper {...args} onCropComplete={setCroppedSrc} />
      {croppedSrc ? (
        <Stack gap="sm">
          <span>Cropped result:</span>
          <img src={croppedSrc} alt="Cropped result" style={{ maxWidth: 240 }} />
        </Stack>
      ) : null}
    </Stack>
  );
}

export const Freeform: Story = {
  args: {
    showConfirmButton: true
  },
  render: (args) => <ConfirmButtonDemo {...args} />
};

export const LockedSquareAspectRatio: Story = {
  args: {
    aspectRatio: 1,
    showConfirmButton: true
  },
  render: (args) => <ConfirmButtonDemo {...args} />
};

export const Locked16by9: Story = {
  args: {
    aspectRatio: 16 / 9,
    showConfirmButton: true
  },
  render: (args) => <ConfirmButtonDemo {...args} />
};

export const WithRefUsageExample: Story = {
  render: (args) => {
    function RefDemo() {
      const cropperRef = useRef<ImageCropperHandle>(null);
      return (
        <Stack gap="sm">
          <ImageCropper {...args} ref={cropperRef} />
          <Stack direction="row" gap="sm">
            <Button
              variant="secondary"
              onClick={() => {
                const dataUrl = cropperRef.current?.getCroppedImage();
                if (dataUrl) window.open(dataUrl, "_blank");
              }}
            >
              getCroppedImage() (via ref)
            </Button>
          </Stack>
        </Stack>
      );
    }
    return <RefDemo />;
  }
};
