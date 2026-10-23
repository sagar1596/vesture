import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FunnelChart } from "./Funnel";
import { buildFunnelSegments, type FunnelStage } from "./Funnel.render";

const stages: FunnelStage[] = [
  { key: "visit", label: "Visits", value: 1000 },
  { key: "signup", label: "Sign-ups", value: 400 },
  { key: "paid", label: "Paid", value: 100 }
];

describe("buildFunnelSegments", () => {
  it("computes percent of total and of previous stage", () => {
    const segs = buildFunnelSegments(stages);
    expect(segs[0]!.percentOfPrevious).toBeNull();
    expect(segs[1]!.percentOfTotal).toBe(40);
    expect(segs[2]!.percentOfPrevious).toBe(25);
  });

  it("tapers each bottom edge to the next stage and keeps the last straight", () => {
    const segs = buildFunnelSegments(stages);
    expect(segs[0]!.topHalf).toBe(0.5);
    expect(segs[0]!.bottomHalf).toBe(segs[1]!.topHalf);
    expect(segs[2]!.bottomHalf).toBe(segs[2]!.topHalf);
  });

  it("returns nothing when the first stage is empty", () => {
    expect(buildFunnelSegments([{ key: "a", label: "A", value: 0 }])).toEqual([]);
  });
});

describe("FunnelChart", () => {
  it("renders a labeled segment per stage", () => {
    render(<FunnelChart stages={stages} width={400} height={300} />);
    expect(screen.getAllByTestId("funnel-segment")).toHaveLength(3);
    expect(screen.getByText("Sign-ups")).toBeInTheDocument();
    expect(screen.getByText("100 · 25% of previous")).toBeInTheDocument();
  });

  it("shows an empty state without stages", () => {
    render(<FunnelChart stages={[]} width={200} height={100} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});

describe("FunnelChart customization", () => {
  it("stepped shape keeps both edges the same width", () => {
    const { container } = render(<FunnelChart stages={stages} width={400} height={300} shape="stepped" />);
    for (const poly of Array.from(container.querySelectorAll("polygon"))) {
      const pts = poly.getAttribute("points")!.split(" ").map((p) => p.split(",").map(Number));
      expect(pts[0]![0]).toBeCloseTo(pts[3]![0]!, 1);
    }
  });

  it("switches the secondary metric", () => {
    const { rerender } = render(<FunnelChart stages={stages} width={400} height={300} metric="total" />);
    expect(screen.getByText("100 · 10% of total")).toBeInTheDocument();
    rerender(<FunnelChart stages={stages} width={400} height={300} metric="none" />);
    expect(screen.queryByText(/of previous|of total/)).toBeNull();
  });

  it("applies colors, custom labels and click handlers", () => {
    const onStageClick = vi.fn();
    const { container } = render(
      <FunnelChart stages={stages} width={400} height={300} colors={["red"]} onStageClick={onStageClick} renderLabel={(s) => <text>{s.stage.key}!</text>} />
    );
    expect(Array.from(container.querySelectorAll("polygon")).every((p) => p.getAttribute("fill") === "red")).toBe(true);
    fireEvent.click(screen.getByText("signup!"));
    expect(onStageClick).toHaveBeenCalledWith(stages[1], 1);
  });
});
