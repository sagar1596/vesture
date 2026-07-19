import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { vars } from "@vesture/tokens";
import { LineChart } from "./LineChart";
import { InteractiveLineChart } from "./LineChart.interactive";
import { SERIES_COLOR_CYCLE } from "./LineChart.render";
import type { LineChartDataPoint, LineChartSeries } from "./types";

const data: LineChartDataPoint[] = [
  { x: "Jan", a: 10, b: 20 },
  { x: "Feb", a: 15, b: 18 },
  { x: "Mar", a: 12, b: 22 }
];

describe("LineChart (static)", () => {
  it("renders one path element per series", () => {
    const series: LineChartSeries[] = [
      { key: "a", label: "A" },
      { key: "b", label: "B" }
    ];
    const { container } = render(<LineChart width={400} height={200} data={data} series={series} />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });

  it("cycles series colors through the chart token palette, wrapping past 8 series", () => {
    const manySeries: LineChartSeries[] = Array.from({ length: 10 }, (_, i) => ({
      key: `s${i}`,
      label: `Series ${i}`
    }));
    const manyData: LineChartDataPoint[] = [
      { x: 0, ...Object.fromEntries(manySeries.map((s) => [s.key, 1])) },
      { x: 1, ...Object.fromEntries(manySeries.map((s) => [s.key, 2])) }
    ];
    const { container } = render(<LineChart width={400} height={200} data={manyData} series={manySeries} />);
    const paths = Array.from(container.querySelectorAll("path"));
    expect(paths).toHaveLength(10);
    paths.forEach((path, index) => {
      expect(path.getAttribute("stroke")).toBe(SERIES_COLOR_CYCLE[index % 8]);
    });
    // 9th series (index 8) wraps back around to series1's color.
    expect(paths[8]!.getAttribute("stroke")).toBe(vars.chart.series1);
  });

  it("renders the empty state instead of an svg when data is empty", () => {
    const { container } = render(
      <LineChart width={400} height={200} data={[]} series={[{ key: "a", label: "A" }]} />
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("InteractiveLineChart", () => {
  const series: LineChartSeries[] = [
    { key: "a", label: "A" },
    { key: "b", label: "B" }
  ];

  it("shows a tooltip with the nearest point's values on hover", async () => {
    render(<InteractiveLineChart data={data} series={series} height={200} />);

    const overlay = screen.getByTestId("line-chart-overlay");
    fireEvent.mouseMove(overlay, { clientX: 0, clientY: 0 });

    await waitFor(() => {
      expect(screen.getByText("A: 10")).toBeInTheDocument();
    });
    expect(screen.getByText("B: 20")).toBeInTheDocument();
  });

  it("hides a series' path from the DOM when its legend item is clicked", () => {
    const { container } = render(<InteractiveLineChart data={data} series={series} height={200} />);

    expect(container.querySelectorAll("path")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "A" }));

    expect(container.querySelectorAll("path")).toHaveLength(1);
  });
});
