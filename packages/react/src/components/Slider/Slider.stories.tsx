import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { Slider } from "./Slider";
import type { SliderValue } from "./types";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<SliderValue>(40);
    return <Slider aria-label="Volume" value={value} onChange={setValue} />;
  }
};

export const WithStep: Story = {
  render: () => {
    const [value, setValue] = useState<SliderValue>(20);
    return (
      <Stack gap="sm">
        <p>Step of 10, clamped between 0 and 100.</p>
        <Slider aria-label="Brightness" value={value} onChange={setValue} min={0} max={100} step={10} />
      </Stack>
    );
  }
};

export const Range: Story = {
  render: () => {
    const [value, setValue] = useState<SliderValue>([20, 80]);
    return (
      <Stack gap="sm">
        <p>
          Range: {Array.isArray(value) ? `${value[0]} – ${value[1]}` : value}
        </p>
        <Slider aria-label={["Minimum price", "Maximum price"]} value={value} onChange={setValue} min={0} max={200} />
      </Stack>
    );
  }
};

export const Disabled: Story = {
  render: () => <Slider aria-label="Volume" defaultValue={50} disabled />
};

export const CustomFormatting: Story = {
  render: () => {
    const [value, setValue] = useState<SliderValue>(75);
    return (
      <Slider
        aria-label="Price"
        value={value}
        onChange={setValue}
        min={0}
        max={500}
        step={5}
        formatValue={(v) => `$${v}`}
      />
    );
  }
};
