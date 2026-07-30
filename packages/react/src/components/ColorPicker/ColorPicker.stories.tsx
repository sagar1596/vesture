import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { ColorPicker } from "./ColorPicker";

const meta: Meta<typeof ColorPicker> = {
  title: "Components/ColorPicker",
  component: ColorPicker
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("#2a78d6");
    return (
      <Stack gap="sm">
        <p>Selected: {value}</p>
        <ColorPicker value={value} onChange={setValue} />
      </Stack>
    );
  }
};

export const WithPresets: Story = {
  render: () => {
    const [value, setValue] = useState("#1baf7a");
    return (
      <Stack gap="sm">
        <p>Custom brand palette instead of the default chart series colors.</p>
        <ColorPicker
          value={value}
          onChange={setValue}
          presets={["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]}
        />
      </Stack>
    );
  }
};

export const RGBFormat: Story = {
  render: () => {
    const [value, setValue] = useState("#eda100");
    return (
      <Stack gap="sm">
        <p>Text input displays/accepts rgb(); onChange always emits hex.</p>
        <ColorPicker value={value} onChange={setValue} format="rgb" />
      </Stack>
    );
  }
};

export const ControlledValue: Story = {
  render: () => {
    const [value, setValue] = useState("#4a3aa7");
    return (
      <Stack gap="sm">
        <p>Selected: {value}</p>
        <ColorPicker value={value} onChange={setValue} />
        <button type="button" onClick={() => setValue("#e34948")}>
          Set to #e34948 externally
        </button>
      </Stack>
    );
  }
};
