import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PivotGrid } from "./PivotGrid";
import { buildPivot } from "./pivot";

type Sale = { region: string; product: string; quarter: string; revenue: number | null };

const sales: Sale[] = [
  { region: "East", product: "Widget", quarter: "Q1", revenue: 100 },
  { region: "East", product: "Widget", quarter: "Q2", revenue: 150 },
  { region: "East", product: "Gadget", quarter: "Q1", revenue: 50 },
  { region: "West", product: "Widget", quarter: "Q1", revenue: 200 },
  { region: "West", product: "Gadget", quarter: "Q2", revenue: 30 },
  { region: "West", product: "Gadget", quarter: "Q2", revenue: null }
];

describe("buildPivot", () => {
  it("sums by row group and column, with row, column and grand totals", () => {
    const p = buildPivot(sales, { rows: ["region"], columns: "quarter", value: "revenue", aggregate: "sum" });
    expect(p.columnKeys).toEqual(["Q1", "Q2"]);
    expect(p.rows.map((r) => [r.path, r.cells, r.total])).toEqual([
      [["East"], [150, 150], 300],
      [["West"], [200, 30], 230]
    ]);
    expect(p.columnTotals).toEqual([350, 180]);
    expect(p.grandTotal).toBe(530);
  });

  it("computes avg totals from records, not from averaged cells", () => {
    const p = buildPivot(sales, { rows: ["region"], columns: "quarter", value: "revenue", aggregate: "avg" });
    // East: (100+150+50)/3, not avg(75, 150)
    expect(p.rows[0]!.total).toBeCloseTo(100);
    expect(p.rows[0]!.cells).toEqual([75, 150]);
  });

  it("counts records even when the value is missing, but other aggregates skip them", () => {
    const count = buildPivot(sales, { rows: ["region"], aggregate: "count" });
    expect(count.rows.map((r) => r.total)).toEqual([3, 3]);
    const sum = buildPivot(sales, { rows: ["region"], value: "revenue", aggregate: "sum" });
    expect(sum.rows[1]!.total).toBe(230);
  });

  it("supports min/max and nested row fields sorted by path", () => {
    const p = buildPivot(sales, { rows: ["region", "product"], value: "revenue", aggregate: "max" });
    expect(p.rows.map((r) => r.path.join("/"))).toEqual(["East/Gadget", "East/Widget", "West/Gadget", "West/Widget"]);
    expect(p.rows[1]!.total).toBe(150);
  });

  it("leaves cells with no records as null", () => {
    const p = buildPivot(sales, { rows: ["product"], columns: "region", value: "revenue", aggregate: "sum" });
    expect(p.rows.every((r) => r.cells.every((c) => c !== null))).toBe(true);
    const sparse = buildPivot(sales, { rows: ["region", "product"], columns: "quarter", value: "revenue", aggregate: "sum" });
    expect(sparse.rows.find((r) => r.path.join() === "East,Gadget")!.cells).toEqual([50, null]);
  });
});

describe("PivotGrid", () => {
  it("renders headers, formatted values and a totals footer", () => {
    render(<PivotGrid data={sales} rows={["region"]} columns="quarter" value="revenue" formatValue={(n) => `$${n}`} />);
    expect(screen.getByRole("columnheader", { name: "Q1" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeInTheDocument();
    const allRows = screen.getAllByRole("row");
    const footer = allRows[allRows.length - 1]!;
    expect(within(footer).getByText("$530")).toBeInTheDocument();
  });

  it("renders a dash for empty cells", () => {
    render(<PivotGrid data={sales} rows={["region", "product"]} columns="quarter" value="revenue" />);
    expect(screen.getAllByText("–").length).toBeGreaterThan(0);
  });

  it("hides repeated outer labels visually but keeps them in the DOM", () => {
    render(<PivotGrid data={sales} rows={["region", "product"]} value="revenue" />);
    const east = screen.getAllByRole("rowheader", { name: "East" });
    expect(east).toHaveLength(2);
    expect(east[0]).toHaveAttribute("data-repeat", "false");
    expect(east[1]).toHaveAttribute("data-repeat", "true");
  });

  it("omits totals when showTotals is false and shows an empty state with no data", () => {
    const { rerender } = render(<PivotGrid data={sales} rows={["region"]} columns="quarter" value="revenue" showTotals={false} />);
    expect(screen.queryByRole("columnheader", { name: "Total" })).toBeNull();
    rerender(<PivotGrid data={[]} rows={["region"]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});

describe("PivotGrid customization", () => {
  it("accepts a custom aggregate function (median)", () => {
    const median = (v: number[]) => {
      const s = [...v].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
    };
    const p = buildPivot(sales, { rows: ["region"], value: "revenue", aggregate: median });
    // East: [100,150,50] -> 100; West: [200,30] -> 115
    expect(p.rows.map((r) => r.total)).toEqual([100, 115]);
    expect(p.grandTotal).toBe(median([100, 150, 50, 200, 30]));
  });

  it("orders columns explicitly and rows with a comparator", () => {
    const p = buildPivot(sales, {
      rows: ["region"],
      columns: "quarter",
      value: "revenue",
      aggregate: "sum",
      columnOrder: ["Q2"],
      sortRows: (a, b) => b[0]!.localeCompare(a[0]!)
    });
    expect(p.columnKeys).toEqual(["Q2", "Q1"]);
    expect(p.rows.map((r) => r.path[0])).toEqual(["West", "East"]);
  });

  it("toggles row and column totals independently and relabels them", () => {
    render(<PivotGrid data={sales} rows={["region"]} columns="quarter" value="revenue" rowTotals={false} totalLabel="All" />);
    expect(screen.queryByRole("columnheader", { name: "All" })).toBeNull();
    expect(screen.getByRole("rowheader", { name: "All" })).toBeInTheDocument();
  });

  it("customizes empty cells, labels and cell content", () => {
    render(
      <PivotGrid
        data={sales}
        rows={["region", "product"]}
        columns="quarter"
        value="revenue"
        emptyValue="n/a"
        renderRowLabel={(l, level) => (level === 0 ? l.toUpperCase() : l)}
        renderColumnLabel={(k) => `Quarter ${k}`}
        renderCell={(i) => (i.kind === "grandTotal" ? <b>GRAND {i.formatted}</b> : undefined)}
      />
    );
    expect(screen.getAllByText("n/a").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("rowheader", { name: "EAST" })).toHaveLength(2);
    expect(screen.getByRole("columnheader", { name: "Quarter Q1" })).toBeInTheDocument();
    expect(screen.getByText("GRAND 530")).toBeInTheDocument();
  });

  it("styles cells conditionally", () => {
    render(<PivotGrid data={sales} rows={["region"]} value="revenue" getCellStyle={(i) => (i.kind === "cell" && (i.value ?? 0) > 250 ? { color: "red" } : undefined)} />);
    expect(screen.getByText("300")).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("fires onCellClick with drill-down context, by click and keyboard, but not for empty cells", () => {
    const onCellClick = vi.fn();
    render(<PivotGrid data={sales} rows={["region", "product"]} columns="quarter" value="revenue" onCellClick={onCellClick} />);
    fireEvent.click(screen.getByText("150", { selector: "td[data-kind='cell']" }));
    expect(onCellClick).toHaveBeenCalledWith(expect.objectContaining({ kind: "cell", value: 150, columnKey: "Q2", rowPath: ["East", "Widget"] }));
    onCellClick.mockClear();
    fireEvent.click(screen.getAllByText("–")[0]!);
    expect(onCellClick).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByText("50", { selector: "td[data-kind='cell']" }), { key: "Enter" });
    expect(onCellClick).toHaveBeenCalledTimes(1);
  });
});
