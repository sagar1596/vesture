import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Stack } from "../Stack";
import { Calendar } from "./Calendar";

const meta: Meta<typeof Calendar> = {
  title: "Components/Calendar",
  component: Calendar,
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<Date | null>(null);
    return <Calendar value={value} onChange={setValue} />;
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
        <Calendar
          value={value}
          onChange={setValue}
          minDate={minDate}
          maxDate={maxDate}
        />
      </Stack>
    );
  },
};

export const WithDisabledWeekends: Story = {
  render: () => {
    const [value, setValue] = useState<Date | null>(null);
    return (
      <Calendar
        value={value}
        onChange={setValue}
        isDateDisabled={(date) => date.getDay() === 0 || date.getDay() === 6}
      />
    );
  },
};

export const ControlledMonth: Story = {
  render: () => {
    const [month, setMonth] = useState(new Date());
    const [value, setValue] = useState<Date | null>(null);
    return (
      <Stack gap="sm">
        <Stack direction="row" gap="sm">
          <Button
            variant="secondary"
            onClick={() =>
              setMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
              )
            }
          >
            ‹ Prev
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              setMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
              )
            }
          >
            Next ›
          </Button>
        </Stack>
        <Calendar
          value={value}
          onChange={setValue}
          month={month}
          onMonthChange={setMonth}
        />
      </Stack>
    );
  },
};
