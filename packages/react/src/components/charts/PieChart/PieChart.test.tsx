import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PieChart } from "./PieChart";
import { InteractivePieChart } from "./PieChart.interactive";
import { computeArcAngles, preparePieSlices } from "./PieChart.render";
import type { PieChartDataPoint } from "./types";

const data: PieChartDataPoint[] = [
  { key: "a", label: "A", value: 30 },
  { key: "b", label: "B", value: 20 },
  { key: "c", label: "C", value: 50 }
];

describe("PieChart.render", () => {
  it("computes arc angles that sum to a full 360 degrees (2π radians) across all slices", () => {
    const slices = preparePieSlices(data);
    const arcs = computeArcAngles(slices);
    const totalAngle = arcs.reduce((sum, arc) => sum + (arc.endAngle - arc.startAngle), 0);
    expect(totalAngle).toBeCloseTo(2 * Math.PI, 5);
  });

  it("excludes zero and negative values from the prepared slices", () => {
    const withInvalid: PieChartDataPoint[] = [
      { key: "a", label: "A", value: 30 },
      { key: "zero", label: "Zero", value: 0 },
      { key: "negative", label: "Negative", value: -5 },
      { key: "b", label: "B", value: 70 }
    ];
    const slices = preparePieSlices(withInvalid);
    expect(slices.map((s) => s.key)).toEqual(["a", "b"]);
  });
});

describe("PieChart (static)", () => {
  it("renders one path per positive-value slice, skipping zero/negative ones", () => {
    const withInvalid: PieChartDataPoint[] = [
      { key: "a", label: "A", value: 30 },
      { key: "zero", label: "Zero", value: 0 },
      { key: "negative", label: "Negative", value: -5 },
      { key: "b", label: "B", value: 70 }
    ];
    const { container } = render(<PieChart width={400} height={400} data={withInvalid} />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });

  it("shows labels on wide slices and suppresses them on narrow ones", () => {
    const lopsided: PieChartDataPoint[] = [
      { key: "dominant", label: "Dominant", value: 90 },
      { key: "sliver1", label: "Sliver 1", value: 2 },
      { key: "sliver2", label: "Sliver 2", value: 2 },
      { key: "sliver3", label: "Sliver 3", value: 2 },
      { key: "sliver4", label: "Sliver 4", value: 2 },
      { key: "sliver5", label: "Sliver 5", value: 2 }
    ];
    render(<PieChart width={400} height={400} data={lopsided} />);
    // The dominant slice (90/100 of the circle) is easily wide enough for a "90%" label.
    expect(screen.getByText("90%")).toBeInTheDocument();
    // Each sliver is 2/100 of the circle (~7.2°) — far too narrow, so none render a "2%" label.
    expect(screen.queryByText("2%")).not.toBeInTheDocument();
  });

  it("renders a visible center hole in donut mode (innerRadius > 0)", () => {
    const { container: pieContainer } = render(<PieChart width={400} height={400} data={data} innerRadius={0} />);
    const { container: donutContainer } = render(
      <PieChart width={400} height={400} data={data} innerRadius={0.6} />
    );
    const piePath = pieContainer.querySelector("path")!.getAttribute("d")!;
    const donutPath = donutContainer.querySelector("path")!.getAttribute("d")!;
    // A full pie wedge's path lines straight to the center (0,0); a donut's path instead arcs
    // back around the inner radius, so it never passes through the center point.
    expect(piePath).toContain("0,0");
    expect(donutPath).not.toContain("L0,0");
    // The donut path has two arc ("A") commands (outer + inner); the pie wedge has one.
    expect((donutPath.match(/A/g) ?? []).length).toBeGreaterThan((piePath.match(/A/g) ?? []).length);
  });

  it("renders the empty state instead of an svg when data is empty", () => {
    const { container } = render(<PieChart width={400} height={400} data={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});

describe("InteractivePieChart", () => {
  it("shows a tooltip with the hovered slice's label, value, and percentage", async () => {
    const { container } = render(<InteractivePieChart data={data} height={400} />);

    fireEvent.mouseEnter(container.querySelector('[data-testid="pie-slice-a"]')!);

    await waitFor(() => {
      expect(screen.getByText("A: 30 (30%)")).toBeInTheDocument();
    });
  });

  it("recomputes remaining slices' percentages when a legend item hides one (not just visual hiding)", () => {
    render(<InteractivePieChart data={data} height={400} />);

    // Before hiding: a=30%, b=20%, c=50% of a total of 100.
    expect(screen.getByRole("button", { name: /A 30%/ })).toBeInTheDocument();

    // Hide "A" (30 of 100) — remaining total is 70 (b=20, c=50), so b and c redistribute to
    // 20/70 ≈ 29% and 50/70 ≈ 71%, not their original 20%/50%.
    fireEvent.click(screen.getByRole("button", { name: /A 30%/ }));

    expect(screen.getByRole("button", { name: /B 29%/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /C 71%/ })).toBeInTheDocument();
  });
});
