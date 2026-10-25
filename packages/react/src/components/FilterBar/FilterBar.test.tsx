import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterBar } from "./FilterBar";
import { applyFilters } from "./filters";
import type { FilterCondition, FilterField } from "./filters";

const fields: FilterField[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "age", label: "Age", type: "number" },
  { key: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }] },
  { key: "joined", label: "Joined", type: "date" },
  { key: "vip", label: "VIP", type: "boolean" }
];
const rows = [
  { name: "Ada", age: 36, status: "active", joined: "2024-01-10", vip: true },
  { name: "Alan", age: 41, status: "paused", joined: "2023-06-01", vip: false },
  { name: "Grace", age: 85, status: "active", joined: "2022-03-15", vip: false }
];
const c = (field: string, operator: string, value: string): FilterCondition => ({ id: `${field}${operator}${value}`, field, operator, value });

describe("applyFilters", () => {
  it("combines conditions with AND", () => {
    const out = applyFilters(rows, [c("status", "is", "active"), c("age", "gt", "50")], fields);
    expect(out.map((r) => r.name)).toEqual(["Grace"]);
  });
  it("handles every type", () => {
    expect(applyFilters(rows, [c("name", "startsWith", "al")], fields)).toHaveLength(1);
    expect(applyFilters(rows, [c("name", "notContains", "a")], fields)).toHaveLength(0);
    expect(applyFilters(rows, [c("status", "isNot", "active")], fields)).toHaveLength(1);
    expect(applyFilters(rows, [c("joined", "before", "2023-12-31")], fields)).toHaveLength(2);
    expect(applyFilters(rows, [c("joined", "on", "2024-01-10")], fields)).toHaveLength(1);
    expect(applyFilters(rows, [c("vip", "is", "true")], fields)).toHaveLength(1);
    expect(applyFilters(rows, [c("age", "lte", "41")], fields)).toHaveLength(2);
  });
  it("ignores empty values and unknown fields", () => {
    expect(applyFilters(rows, [c("name", "contains", ""), c("nope", "is", "x")], fields)).toHaveLength(3);
  });
});

describe("FilterBar", () => {
  it("adds a text filter", () => {
    const onChange = vi.fn();
    render(<FilterBar fields={fields} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add filter" }));
    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "ada" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ field: "name", operator: "contains", value: "ada" })]);
    expect(screen.getAllByTestId("filter-chip")).toHaveLength(1);
  });
  it("resets operator and value when the field changes", () => {
    render(<FilterBar fields={fields} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add filter" }));
    fireEvent.change(screen.getByLabelText("Field"), { target: { value: "status" } });
    expect(screen.getByLabelText("Operator")).toHaveValue("is");
    expect(screen.getByLabelText("Value")).toHaveValue("active");
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByTestId("filter-chip")).toHaveTextContent("Status is Active");
  });
  it("does not add a filter with an empty value", () => {
    render(<FilterBar fields={fields} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add filter" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.queryAllByTestId("filter-chip")).toHaveLength(0);
  });
  it("edits and removes existing chips", () => {
    const onChange = vi.fn();
    render(<FilterBar fields={fields} defaultValue={[c("age", "gt", "30")]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Edit filter: Age/ }));
    fireEvent.change(screen.getByLabelText("Value"), { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ value: "40" })]);
    fireEvent.click(screen.getByRole("button", { name: "Remove filter: Age" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
  it("is controlled", () => {
    const onChange = vi.fn();
    render(<FilterBar fields={fields} value={[c("age", "gt", "30")]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.getAllByTestId("filter-chip")).toHaveLength(1);
  });
  it("applies and saves views", () => {
    const onChange = vi.fn();
    const onSaveView = vi.fn();
    const views = [{ id: "v1", name: "Seniors", conditions: [c("age", "gt", "60")] }];
    render(<FilterBar fields={fields} views={views} onChange={onChange} onSaveView={onSaveView} defaultValue={[c("name", "contains", "a")]} />);
    fireEvent.change(screen.getByLabelText("Saved views"), { target: { value: "v1" } });
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ field: "age", value: "60" })]);
    fireEvent.click(screen.getByRole("button", { name: "Save view" }));
    fireEvent.change(screen.getByLabelText("View name"), { target: { value: "Mine" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSaveView).toHaveBeenCalledWith("Mine", [expect.objectContaining({ field: "age" })]);
  });
  it("supports a custom chip renderer", () => {
    render(<FilterBar fields={fields} defaultValue={[c("age", "gt", "30")]} renderChip={(cond) => <b>custom {cond.value}</b>} />);
    expect(screen.getByText("custom 30")).toBeInTheDocument();
  });
});
