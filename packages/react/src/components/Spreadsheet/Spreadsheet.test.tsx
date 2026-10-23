import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Spreadsheet } from "./Spreadsheet";
import { colToIndex, evaluateGrid, indexToCol, parseRef } from "./spreadsheet-formula";

describe("column helpers", () => {
  it("converts between letters and indexes, including multi-letter columns", () => {
    expect(indexToCol(0)).toBe("A");
    expect(indexToCol(25)).toBe("Z");
    expect(indexToCol(26)).toBe("AA");
    expect(colToIndex("AB")).toBe(27);
    expect(parseRef("C4")).toEqual({ row: 3, col: 2 });
    expect(parseRef("nope")).toBeNull();
  });
});

describe("evaluateGrid", () => {
  const run = (rows: string[][]) => evaluateGrid(rows);

  it("evaluates arithmetic with precedence, parentheses and unary minus", () => {
    expect(run([["=1+2*3", "=(1+2)*3", "=-4+10", "=10/4"]])[0]).toEqual([7, 9, 6, 2.5]);
  });

  it("resolves cell references and chains of formulas", () => {
    const out = run([["2", "=A1*5", "=B1+1"]]);
    expect(out[0]).toEqual([2, 10, 11]);
  });

  it("supports SUM / AVERAGE / MIN / MAX / COUNT over ranges and mixed args", () => {
    const out = run([["1"], ["2"], ["x"], ["6"], ["=SUM(A1:A4)"], ["=AVERAGE(A1:A4)"], ["=MIN(A1:A4, 0)"], ["=MAX(A1:A4)"], ["=COUNT(A1:A4)"]]);
    expect(out.slice(4).map((r) => r[0])).toEqual([9, 3, 0, 6, 3]);
  });

  it("reports division by zero, bad syntax, unknown names and bad refs", () => {
    const out = run([["=1/0", "=1+", "=FOO(1)", "=A0", "=1 +* 2"]]);
    expect(out[0]).toEqual(["#DIV/0!", "#ERR!", "#NAME?", "#REF!", "#ERR!"]);
  });

  it("flags circular references instead of recursing forever", () => {
    const out = run([["=B1", "=A1"], ["=A2+1"]]);
    expect(out[0]).toEqual(["#CYCLE!", "#CYCLE!"]);
    expect(out[1]![0]).toBe("#CYCLE!");
  });

  it("propagates errors and rejects text in arithmetic", () => {
    const out = run([["=1/0", "=A1+1", "hello", "=C1+1"]]);
    expect(out[0]![1]).toBe("#DIV/0!");
    expect(out[0]![3]).toBe("#VALUE!");
  });

  it("treats blanks as zero and rounds float noise", () => {
    const out = run([["=0.1+0.2", "=Z9+1"]]);
    expect(out[0]).toEqual([0.3, 1]);
  });
});

describe("Spreadsheet", () => {
  it("renders computed values and shows the raw formula in the formula bar when selected", () => {
    render(<Spreadsheet defaultValue={[["2", "3", "=A1+B1"]]} />);
    expect(screen.getByRole("gridcell", { name: "C1" })).toHaveTextContent("5");
    fireEvent.click(screen.getByRole("gridcell", { name: "C1" }));
    expect(screen.getByTestId("spreadsheet-name-box")).toHaveTextContent("C1");
    expect(screen.getByText("=A1+B1")).toBeInTheDocument();
  });

  it("moves the active cell with arrow keys", () => {
    render(<Spreadsheet defaultValue={[["a"]]} />);
    const a1 = screen.getByRole("gridcell", { name: "A1" });
    a1.focus();
    fireEvent.keyDown(a1, { key: "ArrowRight" });
    expect(screen.getByTestId("spreadsheet-name-box")).toHaveTextContent("B1");
    fireEvent.keyDown(screen.getByRole("gridcell", { name: "B1" }), { key: "ArrowDown" });
    expect(screen.getByTestId("spreadsheet-name-box")).toHaveTextContent("B2");
  });

  it("types to edit, commits on Enter, and recalculates dependents", () => {
    const onChange = vi.fn();
    render(<Spreadsheet defaultValue={[["1", "=A1*2"]]} onChange={onChange} />);
    const a1 = screen.getByRole("gridcell", { name: "A1" });
    a1.focus();
    fireEvent.keyDown(a1, { key: "7" });
    const input = screen.getByLabelText("Edit A1");
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByRole("gridcell", { name: "B1" })).toHaveTextContent("14");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0][0]).toEqual(["7", "=A1*2", "", "", "", ""]);
    expect(screen.getByTestId("spreadsheet-name-box")).toHaveTextContent("A2");
  });

  it("cancels an edit with Escape", () => {
    render(<Spreadsheet defaultValue={[["keep"]]} />);
    const a1 = screen.getByRole("gridcell", { name: "A1" });
    a1.focus();
    fireEvent.keyDown(a1, { key: "Enter" });
    const input = screen.getByLabelText("Edit A1");
    fireEvent.change(input, { target: { value: "gone" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByRole("gridcell", { name: "A1" })).toHaveTextContent("keep");
  });

  it("clears a cell with Delete", () => {
    render(<Spreadsheet defaultValue={[["bye"]]} />);
    const a1 = screen.getByRole("gridcell", { name: "A1" });
    a1.focus();
    fireEvent.keyDown(a1, { key: "Delete" });
    expect(screen.getByRole("gridcell", { name: "A1" })).toHaveTextContent("");
  });

  it("is controlled when value is provided", () => {
    const onChange = vi.fn();
    render(<Spreadsheet value={[["fixed"]]} onChange={onChange} />);
    const a1 = screen.getByRole("gridcell", { name: "A1" });
    a1.focus();
    fireEvent.keyDown(a1, { key: "Delete" });
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole("gridcell", { name: "A1" })).toHaveTextContent("fixed");
  });

  it("right-aligns numbers and marks errors", () => {
    render(<Spreadsheet defaultValue={[["5", "=1/0"]]} />);
    expect(screen.getByRole("gridcell", { name: "A1" })).toHaveAttribute("data-numeric", "true");
    expect(screen.getByRole("gridcell", { name: "B1" })).toHaveAttribute("data-error", "true");
  });
});

describe("Spreadsheet customization", () => {
  it("supports custom formula functions (case-insensitive) and the extra built-ins", () => {
    const out = evaluateGrid([["=tax(100)", "=MEDIAN(1,9,5)", "=PRODUCT(2,3,4)"]], { TAX: ([n]) => n! * 0.2 });
    expect(out[0]).toEqual([20, 5, 24]);
    expect(evaluateGrid([["=MEDIAN(A2:A3)"]])[0]![0]).toBe("#NUM!");
    expect(evaluateGrid([["=BOOM(1)"]], { BOOM: () => { throw new Error("x"); } })[0]![0]).toBe("#ERR!");
  });

  it("recalculates with functions passed to the component", () => {
    render(<Spreadsheet defaultValue={[["=double(4)"]]} functions={{ double: ([n]) => n! * 2 }} />);
    expect(screen.getByRole("gridcell", { name: "A1" })).toHaveTextContent("8");
  });

  it("readOnly blocks edits, clearing and double-click editing", () => {
    const onChange = vi.fn();
    render(<Spreadsheet defaultValue={[["locked"]]} readOnly onChange={onChange} />);
    const a1 = screen.getByRole("gridcell", { name: "A1" });
    a1.focus();
    fireEvent.keyDown(a1, { key: "Delete" });
    fireEvent.keyDown(a1, { key: "x" });
    fireEvent.doubleClick(a1);
    expect(screen.queryByLabelText("Edit A1")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(a1).toHaveTextContent("locked");
  });

  it("isCellEditable locks individual cells only", () => {
    render(<Spreadsheet defaultValue={[["head", "body"]]} isCellEditable={({ row }) => row > 0} />);
    fireEvent.doubleClick(screen.getByRole("gridcell", { name: "A1" }));
    expect(screen.queryByLabelText("Edit A1")).toBeNull();
    fireEvent.doubleClick(screen.getByRole("gridcell", { name: "A2" }));
    expect(screen.getByLabelText("Edit A2")).toBeInTheDocument();
  });

  it("formats, styles and renders cells", () => {
    render(
      <Spreadsheet
        defaultValue={[["1500", "-3"]]}
        formatCell={(v) => (typeof v === "number" ? `$${v.toFixed(2)}` : v)}
        getCellStyle={(v) => (typeof v === "number" && v < 0 ? { color: "red" } : undefined)}
        getCellClassName={(_, { col }) => (col === 0 ? "first-col" : undefined)}
        renderCell={({ pos, value }) => (pos.col === 1 ? <em>neg:{String(value)}</em> : undefined)}
      />
    );
    expect(screen.getByRole("gridcell", { name: "A1" })).toHaveTextContent("$1500.00");
    expect(screen.getByRole("gridcell", { name: "A1" })).toHaveClass("first-col");
    expect(screen.getByRole("gridcell", { name: "B1" })).toHaveTextContent("neg:-3");
    expect(screen.getByRole("gridcell", { name: "B1" })).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("custom headers, hidden headers and hidden formula bar", () => {
    const { rerender } = render(<Spreadsheet defaultValue={[["a"]]} columnHeaders={["Name", "Qty"]} />);
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    rerender(<Spreadsheet defaultValue={[["a"]]} showHeaders={false} showFormulaBar={false} />);
    expect(screen.queryByRole("columnheader")).toBeNull();
    expect(screen.queryByTestId("spreadsheet-name-box")).toBeNull();
  });

  it("applies per-column widths", () => {
    render(<Spreadsheet defaultValue={[["a"]]} columnWidths={[200]} columnWidth={90} />);
    expect(screen.getByRole("columnheader", { name: "A" })).toHaveStyle({ width: "200px" });
    expect(screen.getByRole("columnheader", { name: "B" })).toHaveStyle({ width: "90px" });
  });

  it("reports active-cell changes", () => {
    const onActiveCellChange = vi.fn();
    render(<Spreadsheet defaultValue={[["a"]]} onActiveCellChange={onActiveCellChange} />);
    const a1 = screen.getByRole("gridcell", { name: "A1" });
    a1.focus();
    fireEvent.keyDown(a1, { key: "ArrowDown" });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ row: 1, col: 0 });
  });
});
