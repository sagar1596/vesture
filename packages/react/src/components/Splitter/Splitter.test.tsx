import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Splitter } from "./Splitter";

function mockContainerRect(width: number, height: number): void {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => "",
  });
}

describe("Splitter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders each child in its own panel with even default sizes", () => {
    render(
      <Splitter>
        <div>Panel A</div>
        <div>Panel B</div>
      </Splitter>
    );

    expect(screen.getByText("Panel A")).toBeInTheDocument();
    expect(screen.getByText("Panel B")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "50");
  });

  it("uses defaultSizes when provided", () => {
    render(
      <Splitter defaultSizes={[30, 70]}>
        <div>Panel A</div>
        <div>Panel B</div>
      </Splitter>
    );

    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "30");
  });

  it("drag on the divider resizes adjacent panels and respects minSize", () => {
    mockContainerRect(1000, 1000);
    const onSizesChange = vi.fn();
    render(
      <Splitter defaultSizes={[50, 50]} minSize={10} onSizesChange={onSizesChange}>
        <div>Panel A</div>
        <div>Panel B</div>
      </Splitter>
    );

    const dividerEl = screen.getByRole("separator");
    fireEvent.pointerDown(dividerEl, { pointerId: 1, clientX: 500, clientY: 0 });
    fireEvent.pointerMove(dividerEl, { pointerId: 1, clientX: 600, clientY: 0 });
    fireEvent.pointerUp(dividerEl, { pointerId: 1, clientX: 600, clientY: 0 });

    expect(onSizesChange).toHaveBeenCalledTimes(1);
    const [sizes] = onSizesChange.mock.calls[0]!;
    expect(sizes[0]).toBeCloseTo(60);
    expect(sizes[1]).toBeCloseTo(40);
  });

  it("clamps a drag past the boundary to minSize", () => {
    mockContainerRect(1000, 1000);
    const onSizesChange = vi.fn();
    render(
      <Splitter defaultSizes={[50, 50]} minSize={10} onSizesChange={onSizesChange}>
        <div>Panel A</div>
        <div>Panel B</div>
      </Splitter>
    );

    const dividerEl = screen.getByRole("separator");
    fireEvent.pointerDown(dividerEl, { pointerId: 1, clientX: 500, clientY: 0 });
    fireEvent.pointerMove(dividerEl, { pointerId: 1, clientX: 999, clientY: 0 });
    fireEvent.pointerUp(dividerEl, { pointerId: 1, clientX: 999, clientY: 0 });

    const [sizes] = onSizesChange.mock.calls[0]!;
    expect(sizes[0]).toBeCloseTo(90);
    expect(sizes[1]).toBeCloseTo(10);
  });

  it("keyboard arrow nudges adjacent panel sizes", () => {
    const onSizesChange = vi.fn();
    render(
      <Splitter defaultSizes={[50, 50]} onSizesChange={onSizesChange}>
        <div>Panel A</div>
        <div>Panel B</div>
      </Splitter>
    );

    const dividerEl = screen.getByRole("separator");
    fireEvent.keyDown(dividerEl, { key: "ArrowRight" });

    expect(onSizesChange).toHaveBeenCalledTimes(1);
    const [sizes] = onSizesChange.mock.calls[0]!;
    expect(sizes[0]).toBeCloseTo(52);
    expect(sizes[1]).toBeCloseTo(48);
  });

  it("keyboard arrow nudges in the opposite direction for vertical splitters", () => {
    const onSizesChange = vi.fn();
    render(
      <Splitter direction="vertical" defaultSizes={[50, 50]} onSizesChange={onSizesChange}>
        <div>Panel A</div>
        <div>Panel B</div>
      </Splitter>
    );

    const dividerEl = screen.getByRole("separator");
    expect(dividerEl).toHaveAttribute("aria-orientation", "horizontal");
    fireEvent.keyDown(dividerEl, { key: "ArrowUp" });

    const [sizes] = onSizesChange.mock.calls[0]!;
    expect(sizes[0]).toBeCloseTo(48);
    expect(sizes[1]).toBeCloseTo(52);
  });

  it("renders one divider per adjacent pair for more than two panels", () => {
    render(
      <Splitter>
        <div>A</div>
        <div>B</div>
        <div>C</div>
      </Splitter>
    );

    expect(screen.getAllByRole("separator")).toHaveLength(2);
  });
});
