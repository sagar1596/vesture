import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScatterChart, linearRegression, niceDomain } from "./Scatter";

const series = [
  { key: "a", label: "A", points: [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }] },
  { key: "b", label: "B", points: [{ x: 1, y: 1, size: 5 }, { x: 2, y: 3, size: 50 }] }
];

describe("helpers", () => {
  it("fits a line", () => {
    const r = linearRegression([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }])!;
    expect(r.slope).toBeCloseTo(2);
    expect(r.intercept).toBeCloseTo(0);
  });
  it("returns null for degenerate input", () => {
    expect(linearRegression([{ x: 1, y: 1 }])).toBeNull();
    expect(linearRegression([{ x: 1, y: 1 }, { x: 1, y: 2 }])).toBeNull();
  });
  it("widens a flat domain", () => {
    expect(niceDomain(5, 5)).toEqual([4, 6]);
  });
});

describe("ScatterChart", () => {
  it("renders one element per point", () => {
    render(<ScatterChart series={series} width={400} height={300} />);
    expect(screen.getAllByTestId("scatter-point")).toHaveLength(5);
  });
  it("shows a trendline per series when enabled", () => {
    render(<ScatterChart series={series} width={400} height={300} trendline />);
    expect(screen.getAllByTestId("scatter-trendline")).toHaveLength(2);
  });
  it("legend toggles series", () => {
    render(<ScatterChart series={series} width={400} height={300} />);
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(screen.getAllByTestId("scatter-point")).toHaveLength(3);
  });
  it("calls onPointClick and supports renderPoint", () => {
    const onPointClick = vi.fn();
    render(
      <ScatterChart
        series={[series[0]!]}
        width={400}
        height={300}
        onPointClick={onPointClick}
        renderPoint={({ cx, cy }) => <rect data-testid="custom" x={cx} y={cy} width={4} height={4} />}
      />
    );
    expect(screen.getAllByTestId("custom")).toHaveLength(3);
    fireEvent.click(screen.getAllByTestId("scatter-point")[1]!);
    expect(onPointClick).toHaveBeenCalledWith(series[0]!.points[1], series[0]);
  });
  it("shows empty state", () => {
    render(<ScatterChart series={[]} width={200} height={100} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
