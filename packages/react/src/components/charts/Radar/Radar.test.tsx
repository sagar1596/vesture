import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RadarChart, radarAngle } from "./Radar";

const axes = ["Speed", "Power", "Range", "Armor"].map((l) => ({ key: l, label: l }));
const series = [
  { key: "a", label: "A", values: [4, 3, 2, 1] },
  { key: "b", label: "B", values: [1, 2, 3, 4] }
];

describe("RadarChart", () => {
  it("starts the first axis at 12 o'clock", () => {
    expect(radarAngle(0, 4)).toBeCloseTo(-Math.PI / 2);
    expect(radarAngle(1, 4)).toBeCloseTo(0);
  });
  it("draws a polygon per series and a dot per value", () => {
    render(<RadarChart axes={axes} series={series} />);
    expect(screen.getAllByTestId("radar-series")).toHaveLength(2);
    expect(screen.getAllByTestId("radar-dot")).toHaveLength(8);
  });
  it("hides dots when asked and toggles series from the legend", () => {
    render(<RadarChart axes={axes} series={series} showDots={false} />);
    expect(screen.queryAllByTestId("radar-dot")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(screen.getAllByTestId("radar-series")).toHaveLength(1);
  });
  it("renders circle rings", () => {
    const { container } = render(<RadarChart axes={axes} series={series} shape="circle" rings={3} />);
    expect(container.querySelectorAll("circle").length).toBeGreaterThanOrEqual(3);
  });
  it("explains when there are too few axes", () => {
    render(<RadarChart axes={axes.slice(0, 2)} series={series} />);
    expect(screen.getByText(/at least 3 axes/)).toBeInTheDocument();
  });
});
