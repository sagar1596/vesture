import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Treemap } from "./Treemap";
import { squarify } from "./Treemap.render";
import type { TreemapDatum } from "./types";

const data: TreemapDatum[] = [
  { key: "a", label: "Alpha", value: 50 },
  { key: "b", label: "Beta", value: 30 },
  { key: "c", label: "Gamma", value: 15 },
  { key: "d", label: "Delta", value: 5 }
];

describe("squarify", () => {
  it("tiles the whole box: rect areas sum to width * height", () => {
    const rects = squarify(data, 400, 300);
    const area = rects.reduce((s, r) => s + r.width * r.height, 0);
    expect(area).toBeCloseTo(400 * 300, 3);
  });

  it("gives areas proportional to values", () => {
    const rects = squarify(data, 400, 300);
    const alpha = rects.find((r) => r.datum.key === "alpha" || r.datum.key === "a")!;
    expect((alpha.width * alpha.height) / (400 * 300)).toBeCloseTo(0.5, 3);
  });

  it("keeps every rect inside the box", () => {
    for (const r of squarify(data, 400, 300)) {
      expect(r.x).toBeGreaterThanOrEqual(-1e-9);
      expect(r.y).toBeGreaterThanOrEqual(-1e-9);
      expect(r.x + r.width).toBeLessThanOrEqual(400 + 1e-9);
      expect(r.y + r.height).toBeLessThanOrEqual(300 + 1e-9);
    }
  });

  it("drops non-positive values", () => {
    const rects = squarify([...data, { key: "z", label: "Zero", value: 0 }, { key: "n", label: "Neg", value: -3 }], 100, 100);
    expect(rects).toHaveLength(4);
  });
});

describe("Treemap", () => {
  it("renders one cell per positive datum and fires onCellClick", () => {
    const onCellClick = vi.fn();
    render(<Treemap data={data} width={400} height={300} onCellClick={onCellClick} />);
    const cells = screen.getAllByTestId("treemap-cell");
    expect(cells).toHaveLength(4);
    fireEvent.click(cells[0]!);
    expect(onCellClick).toHaveBeenCalledWith(expect.objectContaining({ key: "a" }));
  });

  it("shows an empty state with no data", () => {
    render(<Treemap data={[]} width={200} height={100} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});

describe("Treemap customization", () => {
  it("applies colors, getColor precedence and cell radius/gap", () => {
    const { container } = render(
      <Treemap data={data} width={400} height={300} colors={["red", "blue"]} getColor={(d) => (d.key === "b" ? "gold" : undefined as unknown as string)} gap={4} cellRadius={6} />
    );
    const rects = Array.from(container.querySelectorAll("rect"));
    expect(rects.some((r) => r.getAttribute("fill") === "gold")).toBe(true);
    expect(rects.every((r) => r.getAttribute("rx") === "6")).toBe(true);
  });

  it("dims unselected cells", () => {
    render(<Treemap data={data} width={400} height={300} selectedKey="a" />);
    const cells = screen.getAllByTestId("treemap-cell");
    expect(cells.filter((c) => c.getAttribute("data-selected") === "true")).toHaveLength(1);
    expect(cells.filter((c) => c.getAttribute("opacity") === "0.45")).toHaveLength(3);
  });

  it("renders custom labels with the formatted value and percent of total", () => {
    render(<Treemap data={data} width={400} height={300} formatValue={(v) => `${v}!`} renderLabel={(r, i) => <text>{`${r.datum.key}:${i.formatted}:${Math.round(i.percent)}`}</text>} />);
    expect(screen.getByText("a:50!:50")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).toBeNull();
  });

  it("honors minLabelWidth", () => {
    render(<Treemap data={data} width={400} height={300} minLabelWidth={10000} />);
    expect(screen.queryByText("Alpha")).toBeNull();
  });
});
