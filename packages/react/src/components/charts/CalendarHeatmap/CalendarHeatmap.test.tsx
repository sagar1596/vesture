import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CalendarHeatmap } from "./CalendarHeatmap";
import { buildCalendar, levelFor } from "./calendar-heatmap";

describe("buildCalendar", () => {
  it("places Jan 1 2026 (Thursday) on row 4 with Sunday week start", () => {
    const { cells } = buildCalendar("2026-01-01", "2026-01-10", new Map(), 0);
    expect(cells[0]).toMatchObject({ week: 0, row: 4 });
    expect(cells[3]).toMatchObject({ date: "2026-01-04", week: 1, row: 0 });
  });
  it("shifts rows when weeks start on Monday", () => {
    const { cells } = buildCalendar("2026-01-01", "2026-01-05", new Map(), 1);
    expect(cells[0]).toMatchObject({ week: 0, row: 3 });
    expect(cells[4]).toMatchObject({ date: "2026-01-05", week: 1, row: 0 });
  });
});

describe("levelFor", () => {
  it("reserves level 0 for empty and scales the rest", () => {
    expect(levelFor(undefined, 1, 10, 5)).toBe(0);
    expect(levelFor(0, 1, 10, 5)).toBe(0);
    expect(levelFor(1, 1, 10, 5)).toBe(1);
    expect(levelFor(10, 1, 10, 5)).toBe(4);
  });
  it("uses the top level when every value is equal", () => {
    expect(levelFor(3, 3, 3, 5)).toBe(4);
  });
});

describe("CalendarHeatmap", () => {
  it("renders a full year", () => {
    render(<CalendarHeatmap year={2026} data={[]} />);
    expect(screen.getAllByTestId("calendar-day")).toHaveLength(365);
  });
  it("colors days by level and sums duplicate dates", () => {
    render(
      <CalendarHeatmap
        start="2026-02-01"
        end="2026-02-07"
        data={[
          { date: "2026-02-02", value: 1 },
          { date: "2026-02-02", value: 1 },
          { date: "2026-02-03", value: 10 }
        ]}
      />
    );
    const day = (d: string) => document.querySelector(`[data-date="${d}"]`)!;
    expect(day("2026-02-03").getAttribute("data-level")).toBe("4");
    expect(day("2026-02-02").getAttribute("data-level")).toBe("1");
    expect(day("2026-02-04").getAttribute("data-level")).toBe("0");
  });
  it("supports custom colors, tooltips and click handlers", () => {
    const onDayClick = vi.fn();
    render(
      <CalendarHeatmap
        start="2026-03-01"
        end="2026-03-03"
        data={[{ date: "2026-03-02", value: 5 }]}
        colors={["#111", "#222", "#333"]}
        formatTooltip={(d, v) => `${d} → ${v ?? "none"}`}
        onDayClick={onDayClick}
        showLegend={false}
      />
    );
    fireEvent.click(screen.getByLabelText("2026-03-02 → 5"));
    expect(onDayClick).toHaveBeenCalledWith("2026-03-02", 5);
    expect(document.querySelector('[data-date="2026-03-02"]')!.getAttribute("fill")).toBe("#333");
  });
});
