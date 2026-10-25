import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WaterfallChart, buildWaterfall } from "./Waterfall";

const data = [
  { key: "s", label: "Start", value: 100, type: "total" as const },
  { key: "a", label: "Sales", value: 40 },
  { key: "b", label: "Costs", value: -30 },
  { key: "e", label: "End", value: 0, type: "total" as const }
];

describe("buildWaterfall", () => {
  it("floats deltas off the running total", () => {
    const bars = buildWaterfall(data);
    expect(bars[1]).toMatchObject({ start: 100, end: 140 });
    expect(bars[2]).toMatchObject({ start: 140, end: 110 });
  });
  it("uses the running total for a zero-valued total bar", () => {
    expect(buildWaterfall(data)[3]).toMatchObject({ start: 0, end: 110 });
  });
});

describe("WaterfallChart", () => {
  it("classifies bars", () => {
    render(<WaterfallChart data={data} width={400} height={240} />);
    const kinds = screen.getAllByTestId("waterfall-bar").map((b) => b.getAttribute("data-kind"));
    expect(kinds).toEqual(["total", "up", "down", "total"]);
  });
  it("honors custom colors and click handler", () => {
    const onBarClick = vi.fn();
    const { container } = render(
      <WaterfallChart data={data} width={400} height={240} positiveColor="#00ff00" onBarClick={onBarClick} />
    );
    expect(container.querySelector('rect[fill="#00ff00"]')).not.toBeNull();
    fireEvent.click(screen.getAllByTestId("waterfall-bar")[1]!);
    expect(onBarClick).toHaveBeenCalledWith(data[1]);
  });
  it("can hide connectors and labels", () => {
    const { container } = render(<WaterfallChart data={data} width={400} height={240} showConnectors={false} showLabels={false} />);
    expect(container.querySelectorAll("line").length).toBe(5 + 1);
  });
});
