import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { DateRangePicker } from "./DateRangePicker";
import type { DateRange } from "./types";

const meta: Meta<typeof DateRangePicker> = {
  title: "Components/DateRangePicker",
  component: DateRangePicker,
};

export default meta;
type Story = StoryObj<typeof DateRangePicker>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<DateRange>({ start: null, end: null });
    return <DateRangePicker value={value} onChange={setValue} />;
  },
};

export const WithMinMax: Story = {
  render: () => {
    const [value, setValue] = useState<DateRange>({ start: null, end: null });
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), 5);
    const maxDate = new Date(today.getFullYear(), today.getMonth(), 25);
    return (
      <Stack gap="sm">
        <p>Only the 5th–25th of the current month are selectable.</p>
        <DateRangePicker
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
  render: () => {
    const today = new Date();
    return (
      <DateRangePicker
        defaultValue={{
          start: today,
          end: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 4
          ),
        }}
        disabled
      />
    );
  },
};

export const ControlledValue: Story = {
  render: () => {
    const [value, setValue] = useState<DateRange>({
      start: new Date(),
      end: null,
    });
    return (
      <Stack gap="sm">
        <p>
          Start: {value.start ? value.start.toDateString() : "none"} · End:{" "}
          {value.end ? value.end.toDateString() : "none"}
        </p>
        <DateRangePicker value={value} onChange={setValue} />
      </Stack>
    );
  },
};

export const TypedInputs: Story = {
  render: () => {
    const [value, setValue] = useState<DateRange>({ start: null, end: null });
    return (
      <Stack gap="sm">
        <p>
          Type start and end dates directly (e.g. 6/1/2025 and 6/15/2025), then
          blur or press Enter.
        </p>
        <DateRangePicker value={value} onChange={setValue} />
      </Stack>
    );
  },
};
