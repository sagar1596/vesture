import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sparkline } from "./Sparkline";
import { computeSparklinePoints, pointsToPath } from "./Sparkline.render";

describe("computeSparklinePoints", () => {
  it("puts the max at the top and the min at the bottom of the padded box", () => {
    const pts = computeSparklinePoints([0, 10], 100, 20, 2);
    expect(pts[0]!.y).toBe(18);
    expect(pts[1]!.y).toBe(2);
    expect(pts[0]!.x).toBe(2);
    expect(pts[1]!.x).toBe(98);
  });

  it("centers a flat series vertically instead of dividing by zero", () => {
    const pts = computeSparklinePoints([5, 5, 5], 100, 20, 2);
    expect(pts.every((p) => p.y === 10)).toBe(true);
  });

  it("returns no points for empty input", () => {
    expect(computeSparklinePoints([], 100, 20)).toEqual([]);
  });
});

describe("Sparkline", () => {
  it("renders one bar per value for type=bar", () => {
    render(<Sparkline values={[1, 2, 3, 4]} type="bar" />);
    expect(screen.getAllByTestId("sparkline-bar")).toHaveLength(4);
  });

  it("renders an accessible label and a last-point dot for lines", () => {
    const { container } = render(<Sparkline values={[1, 3, 2]} />);
    expect(screen.getByRole("img", { name: "Sparkline of 3 values" })).toBeInTheDocument();
    expect(container.querySelectorAll("circle")).toHaveLength(1);
  });

  it("omits the dot when showLastPoint is false", () => {
    const { container } = render(<Sparkline values={[1, 3, 2]} showLastPoint={false} />);
    expect(container.querySelectorAll("circle")).toHaveLength(0);
  });
});

describe("Sparkline customization", () => {
  it("pins the y-scale with a domain", () => {
    const pts = computeSparklinePoints([5, 10], 100, 20, 2, { min: 0, max: 10 });
    expect(pts[0]!.y).toBe(10); // 5 is mid-scale
    expect(pts[1]!.y).toBe(2);
  });

  it("builds step and smooth paths", () => {
    const pts = computeSparklinePoints([1, 3, 2], 100, 20);
    expect(pointsToPath(pts, "step")).toContain("H");
    expect(pointsToPath(pts, "smooth")).toContain("C");
    expect(pointsToPath(pts, "linear")).not.toContain("C");
  });

  it("highlights min and max points", () => {
    render(<Sparkline values={[3, 1, 9, 4]} highlight="minmax" />);
    expect(screen.getAllByTestId("sparkline-dot")).toHaveLength(2);
  });

  it("draws a baseline and colors bars below it", () => {
    const { container } = render(<Sparkline values={[-2, 3, -1, 4]} type="bar" baseline={0} color="green" negativeColor="red" />);
    expect(screen.getByTestId("sparkline-baseline")).toBeInTheDocument();
    const fills = Array.from(container.querySelectorAll("rect")).map((r) => r.getAttribute("fill"));
    expect(fills).toEqual(["red", "green", "red", "green"]);
  });

  it("accepts a custom accessible label", () => {
    render(<Sparkline values={[1, 2]} label="Weekly signups" />);
    expect(screen.getByRole("img", { name: "Weekly signups" })).toBeInTheDocument();
  });
});
