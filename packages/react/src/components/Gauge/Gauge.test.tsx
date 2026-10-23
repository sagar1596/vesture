import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinearGauge, RadialGauge } from "./Gauge";
import { colorForValue, describeArc, valueToFraction } from "./Gauge.render";

describe("Gauge.render", () => {
  it("clamps value fractions into 0..1", () => {
    expect(valueToFraction(150, 0, 100)).toBe(1);
    expect(valueToFraction(-5, 0, 100)).toBe(0);
    expect(valueToFraction(25, 0, 100)).toBe(0.25);
    expect(valueToFraction(5, 10, 10)).toBe(0);
  });

  it("flags arcs wider than 180° as large-arc", () => {
    expect(describeArc(50, 50, 40, 135, 405)).toContain(" 0 1 1 ");
    expect(describeArc(50, 50, 40, 135, 225)).toContain(" 0 0 1 ");
  });

  it("picks the first matching range color", () => {
    const ranges = [
      { from: 0, to: 50, color: "green" },
      { from: 50, to: 100, color: "red" }
    ];
    expect(colorForValue(30, ranges)).toBe("green");
    expect(colorForValue(80, ranges)).toBe("red");
    expect(colorForValue(30, undefined)).toBeUndefined();
  });
});

describe("RadialGauge", () => {
  it("exposes meter semantics and shows the formatted value", () => {
    render(<RadialGauge value={42} label="CPU" formatValue={(v) => `${v}%`} />);
    const meter = screen.getByRole("meter", { name: "CPU" });
    expect(meter).toHaveAttribute("aria-valuenow", "42");
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("omits the fill arc at the minimum", () => {
    render(<RadialGauge value={0} />);
    expect(screen.queryByTestId("gauge-fill")).toBeNull();
  });
});

describe("LinearGauge", () => {
  it("sizes the fill by value fraction", () => {
    render(<LinearGauge value={25} label="Disk" />);
    expect(screen.getByTestId("gauge-fill")).toHaveStyle({ width: "25%" });
  });
});

describe("Gauge customization", () => {
  it("renders ticks, tick labels and a target on the dial", () => {
    render(<RadialGauge value={50} ticks={5} showTickLabels target={80} />);
    expect(screen.getAllByTestId("gauge-tick")).toHaveLength(5);
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByTestId("gauge-target")).toBeInTheDocument();
  });

  it("supports a half dial via startAngle/sweep and a full ring without degenerate arcs", () => {
    const { rerender } = render(<RadialGauge value={100} startAngle={180} sweep={180} />);
    expect(screen.getByTestId("gauge-fill").getAttribute("d")).toContain(" 0 0 1 ");
    rerender(<RadialGauge value={100} sweep={360} />);
    expect(screen.getByTestId("gauge-fill").getAttribute("d")).toContain(" 0 1 1 ");
  });

  it("replaces the center with renderCenter and exposes aria-valuetext", () => {
    render(<RadialGauge value={30} formatValue={(v) => `${v} pts`} renderCenter={({ formatted }) => <em>custom {formatted}</em>} />);
    expect(screen.getByText("custom 30 pts")).toBeInTheDocument();
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "30 pts");
  });

  it("uses color when no range matches, and ranges win otherwise", () => {
    const { rerender } = render(<RadialGauge value={10} color="purple" />);
    expect(screen.getByTestId("gauge-fill")).toHaveAttribute("stroke", "purple");
    rerender(<RadialGauge value={10} color="purple" ranges={[{ from: 0, to: 20, color: "teal" }]} />);
    expect(screen.getByTestId("gauge-fill")).toHaveAttribute("stroke", "teal");
  });

  it("linear gauge: target marker, hidden scale, custom value", () => {
    render(<LinearGauge value={40} label="Quota" target={75} showScale={false} renderValue={({ formatted }) => <b>{formatted} of 100</b>} />);
    expect(screen.getByTestId("gauge-target")).toHaveStyle({ left: "75%" });
    expect(screen.queryByText("100")).toBeNull();
    expect(screen.getByText("40 of 100")).toBeInTheDocument();
  });
});
