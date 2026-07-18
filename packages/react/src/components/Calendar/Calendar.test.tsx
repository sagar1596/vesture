import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "./Calendar";

function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getRovingButton(container: HTMLElement): HTMLButtonElement {
  return container.querySelector('button[tabindex="0"]') as HTMLButtonElement;
}

// January 2050 starts on a Saturday, comfortably outside any real test run date,
// which keeps "current month" assertions and this fixture from ever colliding.
const JAN_2050 = new Date(2050, 0, 1);

describe("Calendar", () => {
  it("renders the current month by default", () => {
    render(<Calendar />);
    expect(screen.getByText(formatMonth(new Date()))).toBeInTheDocument();
  });

  it("fires onChange with the clicked date", () => {
    const onChange = vi.fn();
    render(<Calendar month={JAN_2050} weekStartsOn={1} onChange={onChange} />);

    const target = new Date(2050, 0, 12);
    fireEvent.click(
      screen.getByRole("button", { name: target.toDateString() })
    );

    expect(onChange).toHaveBeenCalledTimes(1);
    const calledWith = onChange.mock.calls[0]![0] as Date;
    expect(calledWith.getFullYear()).toBe(2050);
    expect(calledWith.getMonth()).toBe(0);
    expect(calledWith.getDate()).toBe(12);
  });

  describe("keyboard navigation", () => {
    it("moves the roving day with ArrowRight/ArrowLeft/ArrowUp/ArrowDown", () => {
      const { container } = render(
        <Calendar month={JAN_2050} weekStartsOn={1} />
      );

      // No value/today in view, so the first enabled day of the month (Jan 1) is the roving default.
      const start = getRovingButton(container);
      expect(start).toHaveTextContent("1");
      start.focus();

      fireEvent.keyDown(start, { key: "ArrowRight" });
      const afterRight = getRovingButton(container);
      expect(afterRight).toHaveTextContent("2");
      expect(document.activeElement).toBe(afterRight);

      fireEvent.keyDown(afterRight, { key: "ArrowDown" });
      const afterDown = getRovingButton(container);
      expect(afterDown).toHaveTextContent("9");
      expect(document.activeElement).toBe(afterDown);

      fireEvent.keyDown(afterDown, { key: "ArrowUp" });
      const afterUp = getRovingButton(container);
      expect(afterUp).toHaveTextContent("2");

      fireEvent.keyDown(afterUp, { key: "ArrowLeft" });
      const afterLeft = getRovingButton(container);
      expect(afterLeft).toHaveTextContent("1");
      expect(document.activeElement).toBe(afterLeft);
    });

    it("crossing a month boundary calls onMonthChange", () => {
      const onMonthChange = vi.fn();
      const { container } = render(
        <Calendar
          month={JAN_2050}
          weekStartsOn={1}
          onMonthChange={onMonthChange}
        />
      );

      const start = getRovingButton(container); // Jan 1
      start.focus();
      fireEvent.keyDown(start, { key: "ArrowLeft" }); // steps back to Dec 31, 2049

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      const calledWith = onMonthChange.mock.calls[0]![0] as Date;
      expect(calledWith.getFullYear()).toBe(2049);
      expect(calledWith.getMonth()).toBe(11);
    });
  });

  describe("disabled dates", () => {
    it("are not clickable and are skipped by arrow-key navigation", () => {
      const onChange = vi.fn();
      const isDateDisabled = (date: Date) => date.getDate() === 2;
      const { container } = render(
        <Calendar
          month={JAN_2050}
          weekStartsOn={1}
          onChange={onChange}
          isDateDisabled={isDateDisabled}
        />
      );

      const jan2 = screen.getByRole("button", {
        name: new Date(2050, 0, 2).toDateString(),
      });
      expect(jan2).toBeDisabled();
      expect(jan2).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(jan2);
      expect(onChange).not.toHaveBeenCalled();

      const start = getRovingButton(container); // Jan 1 (Jan 2 is disabled, so not chosen as default)
      expect(start).toHaveTextContent("1");
      start.focus();

      fireEvent.keyDown(start, { key: "ArrowRight" });
      const afterRight = getRovingButton(container);
      expect(afterRight).toHaveTextContent("3");
    });
  });

  describe("controlled vs uncontrolled value", () => {
    it("uses defaultValue as the initial selection when uncontrolled", () => {
      const initial = new Date(2050, 0, 5);
      render(
        <Calendar month={JAN_2050} weekStartsOn={1} defaultValue={initial} />
      );

      expect(
        screen.getByRole("button", { name: initial.toDateString() })
      ).toHaveAttribute("aria-selected", "true");
    });

    it("updates its own selection when uncontrolled and a day is clicked", () => {
      render(<Calendar month={JAN_2050} weekStartsOn={1} />);
      const target = new Date(2050, 0, 15);

      fireEvent.click(
        screen.getByRole("button", { name: target.toDateString() })
      );

      expect(
        screen.getByRole("button", { name: target.toDateString() })
      ).toHaveAttribute("aria-selected", "true");
    });

    it("does not update its own selection when controlled — the caller owns `value`", () => {
      const onChange = vi.fn();
      render(
        <Calendar
          month={JAN_2050}
          weekStartsOn={1}
          value={null}
          onChange={onChange}
        />
      );
      const target = new Date(2050, 0, 15);

      fireEvent.click(
        screen.getByRole("button", { name: target.toDateString() })
      );

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole("button", { name: target.toDateString() })
      ).not.toHaveAttribute("aria-selected");
    });
  });

  describe("rangeEnd", () => {
    it("marks value and rangeEnd as selected and shades dates strictly between them", () => {
      const start = new Date(2050, 0, 5);
      const end = new Date(2050, 0, 10);
      render(
        <Calendar
          month={JAN_2050}
          weekStartsOn={1}
          value={start}
          rangeEnd={end}
        />
      );

      expect(
        screen.getByRole("button", { name: start.toDateString() })
      ).toHaveAttribute("aria-selected", "true");
      expect(
        screen.getByRole("button", { name: end.toDateString() })
      ).toHaveAttribute("aria-selected", "true");

      const between = screen.getByRole("button", {
        name: new Date(2050, 0, 7).toDateString(),
      });
      expect(between).toHaveAttribute("data-in-range", "true");
      expect(between).not.toHaveAttribute("aria-selected");

      const outside = screen.getByRole("button", {
        name: new Date(2050, 0, 12).toDateString(),
      });
      expect(outside).not.toHaveAttribute("data-in-range");
    });
  });
});
