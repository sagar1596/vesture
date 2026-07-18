import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { NumberInput } from "./NumberInput";

const meta: Meta<typeof NumberInput> = {
  title: "Components/NumberInput",
  component: NumberInput
};

export default meta;
type Story = StoryObj<typeof NumberInput>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(3);
    return <NumberInput aria-label="Quantity" value={value} onChange={setValue} />;
  }
};

export const WithMinMaxStep: Story = {
  render: () => {
    const [value, setValue] = useState<number | null>(0);
    return (
      <Stack gap="sm">
        <p>Step of 5, clamped between 0 and 100.</p>
        <NumberInput aria-label="Percent" value={value} onChange={setValue} min={0} max={100} step={5} />
      </Stack>
    );
  }
};

export const Disabled: Story = {
  render: () => <NumberInput aria-label="Quantity" defaultValue={2} disabled />
};

export const Invalid: Story = {
  render: () => <NumberInput aria-label="Quantity" defaultValue={-1} invalid />
};
