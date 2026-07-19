import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { vars } from "@vesture/tokens";
import { BarChart } from "./BarChart";
import { InteractiveBarChart } from "./BarChart.interactive";
import { SERIES_COLOR_CYCLE } from "./BarChart.render";
import type { BarChartDataPoint, BarChartSeries } from "./types";

const data: BarChartDataPoint[] = [
  { category: "Jan", a: 10, b: 20 },
  { category: "Feb", a: 15, b: 5 }
];

const series: BarChartSeries[] = [
  { key: "a", label: "A" },
  { key: "b", label: "B" }
];

describe("BarChart (static)", () => {
  it("renders one rect per (category, series) pair", () => {
    const { container } = render(<BarChart width={400} height={200} data={data} series={series} layout="grouped" />);
    expect(container.querySelectorAll("rect")).toHaveLength(4);
  });

  it("positions grouped bars within a category side-by-side (non-overlapping x)", () => {
    const { container } = render(<BarChart width={400} height={200} data={data} series={series} layout="grouped" />);
    const rects = Array.from(container.querySelectorAll("rect"));
    // First two rects belong to the "Jan" group (rendered group-by-group).
    const [janA, janB] = rects;
    const janAX = Number(janA!.getAttribute("x"));
    const janBX = Number(janB!.getAttribute("x"));
    const janAWidth = Number(janA!.getAttribute("width"));
    expect(janAX).not.toBe(janBX);
    // Bars within the same group must not overlap.
    expect(janAX + janAWidth).toBeLessThanOrEqual(janBX);
  });

  it("stacks bars within a category with cumulative heights (same x column)", () => {
    const { container } = render(<BarChart width={400} height={200} data={data} series={series} layout="stacked" />);
    const rects = Array.from(container.querySelectorAll("rect"));
    // BarStack renders stack-major (all of series "a"'s bars, then all of series "b"'s), so
    // "Jan" is the first bar of each series: index 0 (a) and index 2 (b, after Jan/Feb of a).
    const janA = rects[0];
    const janB = rects[2];
    // Both series for "Jan" stack into the same column.
    expect(janA!.getAttribute("x")).toBe(janB!.getAttribute("x"));
    const aY = Number(janA!.getAttribute("y"));
    const bY = Number(janB!.getAttribute("y"));
    const bHeight = Number(janB!.getAttribute("height"));
    // Series "a" (the first key) stacks at the baseline; series "b" stacks directly on top of
    // it, so "b"'s bottom edge (bY + bHeight) meets "a"'s top edge (aY).
    expect(bY + bHeight).toBeCloseTo(aY, 5);
  });

  it("cycles series colors through the chart token palette, wrapping past 8 series", () => {
    const manySeries: BarChartSeries[] = Array.from({ length: 10 }, (_, i) => ({
      key: `s${i}`,
      label: `Series ${i}`
    }));
    const manyData: BarChartDataPoint[] = [
      { category: "X", ...Object.fromEntries(manySeries.map((s) => [s.key, 1])) }
    ];
    const { container } = render(
      <BarChart width={400} height={200} data={manyData} series={manySeries} layout="grouped" />
    );
    const rects = Array.from(container.querySelectorAll("rect"));
    expect(rects).toHaveLength(10);
    rects.forEach((rect, index) => {
      expect(rect.getAttribute("fill")).toBe(SERIES_COLOR_CYCLE[index % 8]);
    });
    expect(rects[8]!.getAttribute("fill")).toBe(vars.chart.series1);
  });

  it("renders the empty state instead of an svg when data is empty", () => {
    const { container } = render(<BarChart width={400} height={200} data={[]} series={series} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("InteractiveBarChart", () => {
  it("shows a tooltip with the hovered bar's category and value", async () => {
    const { container } = render(<InteractiveBarChart data={data} series={series} height={200} layout="grouped" />);

    const rects = Array.from(container.querySelectorAll("rect"));
    fireEvent.mouseEnter(rects[0]!);

    await waitFor(() => {
      expect(screen.getByText("A: 10")).toBeInTheDocument();
    });
  });

  it("hides a series' bars from the DOM when its legend item is clicked", () => {
    const { container } = render(<InteractiveBarChart data={data} series={series} height={200} layout="grouped" />);

    expect(container.querySelectorAll("rect")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "A" }));

    expect(container.querySelectorAll("rect")).toHaveLength(2);
  });
});
