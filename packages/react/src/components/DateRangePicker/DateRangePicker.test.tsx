import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateRangePicker } from "./DateRangePicker";
import type { DateRange } from "./types";

function getStartInput(): HTMLInputElement {
  return screen.getByRole("textbox", {
    name: "Start date",
  }) as HTMLInputElement;
}

function getEndInput(): HTMLInputElement {
  return screen.getByRole("textbox", { name: "End date" }) as HTMLInputElement;
}

function getIconButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: /calendar/i }) as HTMLButtonElement;
}

async function openPopover(): Promise<void> {
  fireEvent.click(getIconButton());
  await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
}

describe("DateRangePicker", () => {
  it("typing valid start and end dates fires onChange with the correct range", () => {
    const onChange = vi.fn();
    render(<DateRangePicker onChange={onChange} />);

    fireEvent.change(getStartInput(), { target: { value: "6/1/2025" } });
    fireEvent.blur(getStartInput());
    fireEvent.change(getEndInput(), { target: { value: "6/15/2025" } });
    fireEvent.blur(getEndInput());

    expect(onChange).toHaveBeenCalledTimes(2);
    const finalRange = onChange.mock.calls[1]![0] as DateRange;
    expect(finalRange.start!.getDate()).toBe(1);
    expect(finalRange.end!.getDate()).toBe(15);
  });

  it("typing an invalid date reverts the field without firing onChange", () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        defaultValue={{ start: new Date(2025, 0, 10), end: null }}
        onChange={onChange}
      />
    );

    const startInput = getStartInput();
    const originalText = startInput.value;
    fireEvent.change(startInput, { target: { value: "garbage" } });
    fireEvent.blur(startInput);

    expect(onChange).not.toHaveBeenCalled();
    expect(startInput.value).toBe(originalText);
  });

  it("typing an end date before the start date reverts without firing onChange", () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        defaultValue={{ start: new Date(2025, 5, 15), end: null }}
        onChange={onChange}
      />
    );

    const endInput = getEndInput();
    fireEvent.change(endInput, { target: { value: "6/1/2025" } });
    fireEvent.blur(endInput);

    expect(onChange).not.toHaveBeenCalled();
    expect(endInput.value).toBe("");
  });

  it("clicking the calendar icon opens the popover", async () => {
    render(<DateRangePicker />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await openPopover();
  });

  it("selecting two dates in the popover sets start then end and closes on the second click", async () => {
    const onChange = vi.fn();
    render(<DateRangePicker onChange={onChange} />);
    await openPopover();

    const grid = within(screen.getByRole("dialog")).getByRole("grid");
    const today = new Date();
    fireEvent.click(
      within(grid).getByRole("button", { name: today.toDateString() })
    );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as DateRange).start!.getDate()).toBe(
      today.getDate()
    );
    expect((onChange.mock.calls[0]![0] as DateRange).end).toBeNull();
    // First click only sets the start — popover stays open for the second click.
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const later = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 5
    );
    fireEvent.click(
      within(grid).getByRole("button", { name: later.toDateString() })
    );

    expect(onChange).toHaveBeenCalledTimes(2);
    const range = onChange.mock.calls[1]![0] as DateRange;
    expect(range.start!.getDate()).toBe(today.getDate());
    expect(range.end!.getDate()).toBe(later.getDate());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("clicking a date before the current start swaps start and end", async () => {
    const onChange = vi.fn();
    const today = new Date();
    render(
      <DateRangePicker
        defaultValue={{ start: today, end: null }}
        onChange={onChange}
      />
    );
    await openPopover();

    const grid = within(screen.getByRole("dialog")).getByRole("grid");
    const earlier = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 3
    );
    fireEvent.click(
      within(grid).getByRole("button", { name: earlier.toDateString() })
    );

    const range = onChange.mock.calls[0]![0] as DateRange;
    expect(range.start!.getDate()).toBe(earlier.getDate());
    expect(range.end!.getDate()).toBe(today.getDate());
  });

  it("Escape closes the popover", async () => {
    render(<DateRangePicker />);
    await openPopover();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  describe("minDate/maxDate/isDateDisabled", () => {
    it("prevents selecting an out-of-range date via the calendar", async () => {
      const onChange = vi.fn();
      const minDate = new Date(2050, 0, 5);
      const maxDate = new Date(2050, 0, 25);
      render(
        <DateRangePicker
          defaultValue={{ start: new Date(2050, 0, 10), end: null }}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
        />
      );
      await openPopover();

      const outOfRange = screen.getByRole("button", {
        name: new Date(2050, 0, 3).toDateString(),
      });
      expect(outOfRange).toBeDisabled();
      fireEvent.click(outOfRange);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("rejects a typed out-of-range start date on blur", () => {
      const onChange = vi.fn();
      const minDate = new Date(2050, 0, 5);
      const maxDate = new Date(2050, 0, 25);
      render(
        <DateRangePicker
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
        />
      );

      const startInput = getStartInput();
      fireEvent.change(startInput, { target: { value: "1/3/2050" } });
      fireEvent.blur(startInput);

      expect(onChange).not.toHaveBeenCalled();
      expect(startInput.value).toBe("");
    });

    it("rejects a typed date disabled via isDateDisabled on blur", () => {
      const onChange = vi.fn();
      const isDateDisabled = (date: Date) =>
        date.getDay() === 0 || date.getDay() === 6;
      render(
        <DateRangePicker onChange={onChange} isDateDisabled={isDateDisabled} />
      );

      // 2025-06-14 is a Saturday.
      const startInput = getStartInput();
      fireEvent.change(startInput, { target: { value: "6/14/2025" } });
      fireEvent.blur(startInput);

      expect(onChange).not.toHaveBeenCalled();
      expect(startInput.value).toBe("");
    });
  });
});
