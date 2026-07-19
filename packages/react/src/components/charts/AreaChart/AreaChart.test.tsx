import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { vars } from "@vesture/tokens";
import { AreaChart } from "./AreaChart";
import { InteractiveAreaChart } from "./AreaChart.interactive";
import { OVERLAP_FILL_OPACITY, SERIES_COLOR_CYCLE, buildAreaChartLayout } from "./AreaChart.render";
import type { AreaChartDataPoint, AreaChartSeries } from "./types";

const data: AreaChartDataPoint[] = [
  { x: "Jan", a: 10, b: 20 },
  { x: "Feb", a: 15, b: 5 },
  { x: "Mar", a: 12, b: 18 }
];

const series: AreaChartSeries[] = [
  { key: "a", label: "A" },
  { key: "b", label: "B" }
];

describe("AreaChart (static)", () => {
  it("renders one filled path per series in overlapping mode, at the shared overlap opacity", () => {
    const { container } = render(
      <AreaChart width={400} height={200} data={data} series={series} stacked={false} />
    );
    const paths = Array.from(container.querySelectorAll("path"));
    expect(paths).toHaveLength(2);
    paths.forEach((path) => {
      expect(path.getAttribute("fill-opacity")).toBe(String(OVERLAP_FILL_OPACITY));
    });
  });

  it("renders one path per series in stacked mode, fully opaque", () => {
    const { container } = render(<AreaChart width={400} height={200} data={data} series={series} stacked />);
    const paths = Array.from(container.querySelectorAll("path"));
    expect(paths).toHaveLength(2);
    paths.forEach((path) => {
      expect(path.getAttribute("fill-opacity")).toBe("1");
    });
  });

  it("stacks cumulatively: a later series' baseline meets the prior series' top, per data point", () => {
    const { seriesLayouts } = buildAreaChartLayout(data, series, 400, 200, undefined, undefined, true);
    const [aLayout, bLayout] = seriesLayouts;
    expect(aLayout!.points).toHaveLength(3);
    expect(bLayout!.points).toHaveLength(3);
    aLayout!.points.forEach((aPoint, i) => {
      const bPoint = bLayout!.points[i]!;
      // "a" is the first key, so it sits at the baseline (y0 = 0-value pixel); "b" stacks on
      // top of it, so "b"'s bottom edge (y0) is exactly "a"'s top edge (y1).
      expect(bPoint.y0).toBeCloseTo(aPoint.y1, 5);
    });
  });

  it("cycles series colors through the chart token palette, wrapping past 8 series", () => {
    const manySeries: AreaChartSeries[] = Array.from({ length: 10 }, (_, i) => ({
      key: `s${i}`,
      label: `Series ${i}`
    }));
    const manyData: AreaChartDataPoint[] = [
      { x: 0, ...Object.fromEntries(manySeries.map((s) => [s.key, 1])) },
      { x: 1, ...Object.fromEntries(manySeries.map((s) => [s.key, 2])) }
    ];
    const { container } = render(
      <AreaChart width={400} height={200} data={manyData} series={manySeries} stacked={false} />
    );
    const paths = Array.from(container.querySelectorAll("path"));
    expect(paths).toHaveLength(10);
    paths.forEach((path, index) => {
      expect(path.getAttribute("fill")).toBe(SERIES_COLOR_CYCLE[index % 8]);
    });
    expect(paths[8]!.getAttribute("fill")).toBe(vars.chart.series1);
  });

  it("renders the empty state instead of an svg when data is empty", () => {
    const { container } = render(<AreaChart width={400} height={200} data={[]} series={series} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("InteractiveAreaChart", () => {
  it("shows a tooltip with the nearest point's values on hover", async () => {
    render(<InteractiveAreaChart data={data} series={series} height={200} />);

    const overlay = screen.getByTestId("area-chart-overlay");
    fireEvent.mouseMove(overlay, { clientX: 0, clientY: 0 });

    await waitFor(() => {
      expect(screen.getByText("A: 10")).toBeInTheDocument();
    });
    expect(screen.getByText("B: 20")).toBeInTheDocument();
  });

  it("hides a series' filled path from the DOM when its legend item is clicked", () => {
    const { container } = render(<InteractiveAreaChart data={data} series={series} height={200} />);

    expect(container.querySelectorAll("path")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "A" }));

    expect(container.querySelectorAll("path")).toHaveLength(1);
  });
});
