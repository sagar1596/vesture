import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DatePicker } from "./DatePicker";

function getInput(): HTMLInputElement {
  return screen.getByRole("textbox", { name: "Date" }) as HTMLInputElement;
}

function getIconButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: /calendar/i }) as HTMLButtonElement;
}

describe("DatePicker", () => {
  it("typing a valid date and blurring fires onChange with the correct Date", () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} />);

    const input = getInput();
    fireEvent.change(input, { target: { value: "6/15/2025" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledTimes(1);
    const calledWith = onChange.mock.calls[0]![0] as Date;
    expect(calledWith.getFullYear()).toBe(2025);
    expect(calledWith.getMonth()).toBe(5);
    expect(calledWith.getDate()).toBe(15);
    expect(input.value).toBe(
      new Intl.DateTimeFormat("en-US").format(new Date(2025, 5, 15))
    );
  });

  it("typing an invalid date and blurring does not fire onChange and reverts the displayed text", () => {
    const onChange = vi.fn();
    render(
      <DatePicker defaultValue={new Date(2025, 0, 10)} onChange={onChange} />
    );

    const input = getInput();
    const originalText = input.value;
    fireEvent.change(input, { target: { value: "not a date" } });
    fireEvent.blur(input);

    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe(originalText);
  });

  it("clicking the calendar icon opens the popover", async () => {
    render(<DatePicker />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(getIconButton());

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  });

  it("selecting a date in the popover fires onChange and closes the popover", async () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} />);

    fireEvent.click(getIconButton());
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    const grid = within(screen.getByRole("dialog")).getByRole("grid");
    const today = new Date();
    const todayCell = within(grid).getByRole("button", {
      name: today.toDateString(),
    });
    fireEvent.click(todayCell);

    expect(onChange).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("Escape closes the popover", async () => {
    render(<DatePicker />);

    fireEvent.click(getIconButton());
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

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
        <DatePicker
          defaultValue={new Date(2050, 0, 10)}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
        />
      );

      fireEvent.click(getIconButton());
      await waitFor(() =>
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      );

      const outOfRange = screen.getByRole("button", {
        name: new Date(2050, 0, 3).toDateString(),
      });
      expect(outOfRange).toBeDisabled();
      fireEvent.click(outOfRange);

      expect(onChange).not.toHaveBeenCalled();
    });

    it("rejects a typed out-of-range date on blur", () => {
      const onChange = vi.fn();
      const minDate = new Date(2050, 0, 5);
      const maxDate = new Date(2050, 0, 25);
      render(
        <DatePicker onChange={onChange} minDate={minDate} maxDate={maxDate} />
      );

      const input = getInput();
      fireEvent.change(input, { target: { value: "1/3/2050" } });
      fireEvent.blur(input);

      expect(onChange).not.toHaveBeenCalled();
      expect(input.value).toBe("");
    });

    it("rejects a typed date disabled via isDateDisabled on blur", () => {
      const onChange = vi.fn();
      const isDateDisabled = (date: Date) =>
        date.getDay() === 0 || date.getDay() === 6;
      render(
        <DatePicker onChange={onChange} isDateDisabled={isDateDisabled} />
      );

      // 2025-06-14 is a Saturday.
      const input = getInput();
      fireEvent.change(input, { target: { value: "6/14/2025" } });
      fireEvent.blur(input);

      expect(onChange).not.toHaveBeenCalled();
      expect(input.value).toBe("");
    });
  });
});
