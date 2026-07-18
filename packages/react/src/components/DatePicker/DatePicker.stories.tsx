import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { DatePicker } from "./DatePicker";

const meta: Meta<typeof DatePicker> = {
  title: "Components/DatePicker",
  component: DatePicker,
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<Date | null>(null);
    return <DatePicker value={value} onChange={setValue} />;
  },
};

export const WithMinMax: Story = {
  render: () => {
    const [value, setValue] = useState<Date | null>(null);
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), 10);
    const maxDate = new Date(today.getFullYear(), today.getMonth(), 20);
    return (
      <Stack gap="sm">
        <p>Only the 10th–20th of the current month are selectable.</p>
        <DatePicker
          value={value}
          onChange={setValue}
          minDate={minDate}
          maxDate={maxDate}
        />
      </Stack>
    );
  },
};

export const Disabled: Story = {
  render: () => <DatePicker defaultValue={new Date()} disabled />,
};

export const ControlledValue: Story = {
  render: () => {
    const [value, setValue] = useState<Date | null>(new Date());
    return (
      <Stack gap="sm">
        <p>Selected: {value ? value.toDateString() : "none"}</p>
        <DatePicker value={value} onChange={setValue} />
      </Stack>
    );
  },
};

export const TypedInput: Story = {
  render: () => {
    const [value, setValue] = useState<Date | null>(null);
    return (
      <Stack gap="sm">
        <p>
          Type a date directly (e.g. 6/15/2025) and press Enter or blur the
          field.
        </p>
        <DatePicker value={value} onChange={setValue} />
      </Stack>
    );
  },
};
