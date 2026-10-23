import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Heatmap } from "./Heatmap";
import { intensity, matrixExtent } from "./Heatmap.render";

describe("Heatmap.render", () => {
  it("finds min/max, ignoring nulls and non-finite values", () => {
    expect(matrixExtent([[1, null], [NaN, 9]])).toEqual([1, 9]);
    expect(matrixExtent([[null]])).toBeNull();
  });

  it("scales intensity to 0..1 and handles a constant matrix", () => {
    expect(intensity(5, [0, 10])).toBe(0.5);
    expect(intensity(3, [3, 3])).toBe(1);
  });
});

describe("Heatmap", () => {
  const props = {
    rows: ["Mon", "Tue"],
    columns: ["AM", "PM", "Eve"],
    values: [[1, 2, 3], [4, null, 6]],
    width: 400,
    height: 200
  };

  it("renders a cell per non-null value", () => {
    render(<Heatmap {...props} />);
    expect(screen.getAllByTestId("heatmap-cell")).toHaveLength(5);
  });

  it("labels both axes", () => {
    render(<Heatmap {...props} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Eve")).toBeInTheDocument();
  });

  it("shows an empty state when all values are null", () => {
    render(<Heatmap {...props} values={[[null], [null]]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});

describe("Heatmap customization", () => {
  const props = { rows: ["Mon", "Tue"], columns: ["AM", "PM"], values: [[0, 50], [100, null]] as (number | null)[][], width: 300, height: 160 };

  it("uses a colorScale at full opacity", () => {
    const { container } = render(<Heatmap {...props} colorScale={(t) => (t < 0.5 ? "blue" : "red")} />);
    const rects = Array.from(container.querySelectorAll('[data-testid="heatmap-cell"] rect'));
    expect(rects.map((r) => r.getAttribute("fill"))).toEqual(["blue", "red", "red"]);
    expect(rects.every((r) => r.getAttribute("fill-opacity") === "1")).toBe(true);
  });

  it("pins the domain", () => {
    const { container } = render(<Heatmap {...props} domain={[0, 1000]} />);
    const first = container.querySelector('[data-testid="heatmap-cell"] rect')!;
    expect(Number(first.getAttribute("fill-opacity"))).toBeCloseTo(0.08, 2);
  });

  it("paints empty cells when emptyColor is set", () => {
    render(<Heatmap {...props} emptyColor="#eee" />);
    expect(screen.getAllByTestId("heatmap-empty")).toHaveLength(1);
  });

  it("calls onCellClick with the cell coordinates", () => {
    const onCellClick = vi.fn();
    render(<Heatmap {...props} onCellClick={onCellClick} />);
    fireEvent.click(screen.getAllByTestId("heatmap-cell")[1]!);
    expect(onCellClick).toHaveBeenCalledWith({ row: "Mon", column: "PM", value: 50, rowIndex: 0, columnIndex: 1 });
  });

  it("renders custom cell content", () => {
    render(<Heatmap {...props} renderCell={({ value }) => <text>v{value}</text>} />);
    expect(screen.getByText("v50")).toBeInTheDocument();
  });
});
