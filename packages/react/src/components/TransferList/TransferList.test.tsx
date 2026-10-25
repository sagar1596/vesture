import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransferList } from "./TransferList";

const items = [
  { key: "a", label: "Apple" },
  { key: "b", label: "Banana" },
  { key: "c", label: "Cherry", disabled: true },
  { key: "d", label: "Date" }
];
const source = () => within(screen.getByTestId("transfer-source"));
const target = () => within(screen.getByTestId("transfer-target"));

describe("TransferList", () => {
  it("lists unselected items on the left and selected on the right", () => {
    render(<TransferList items={items} defaultValue={["d"]} />);
    expect(source().getAllByRole("checkbox", { name: /Apple|Banana|Cherry/ })).toHaveLength(3);
    expect(target().getByText("Date")).toBeInTheDocument();
  });
  it("moves checked items right and back left", () => {
    const onChange = vi.fn();
    render(<TransferList items={items} onChange={onChange} />);
    fireEvent.click(source().getByLabelText("Apple"));
    fireEvent.click(screen.getByLabelText("Move checked to selected"));
    expect(onChange).toHaveBeenLastCalledWith(["a"]);
    expect(target().getByText("Apple")).toBeInTheDocument();
    fireEvent.click(target().getByLabelText("Apple"));
    fireEvent.click(screen.getByLabelText("Move checked to available"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
  it("moves everything that's enabled with the bulk buttons", () => {
    const onChange = vi.fn();
    render(<TransferList items={items} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Move all to selected"));
    expect(onChange).toHaveBeenLastCalledWith(["a", "b", "d"]);
    fireEvent.click(screen.getByLabelText("Move all to available"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
  it("select-all in a panel ignores disabled rows", () => {
    render(<TransferList items={items} />);
    fireEvent.click(screen.getByLabelText("Select all in Available"));
    expect(source().getByLabelText("Cherry")).not.toBeChecked();
    expect(source().getByLabelText("Apple")).toBeChecked();
  });
  it("filters with search and respects a custom filter", () => {
    render(<TransferList items={items} />);
    fireEvent.change(screen.getByLabelText("Search Available"), { target: { value: "an" } });
    expect(source().queryByText("Apple")).toBeNull();
    expect(source().getByText("Banana")).toBeInTheDocument();
  });
  it("double-click moves one item", () => {
    const onChange = vi.fn();
    render(<TransferList items={items} onChange={onChange} />);
    fireEvent.doubleClick(source().getByText("Banana"));
    expect(onChange).toHaveBeenCalledWith(["b"]);
  });
  it("caps the target list with maxTarget", () => {
    const onChange = vi.fn();
    render(<TransferList items={items} maxTarget={2} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Move all to selected"));
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
    expect(screen.getByLabelText("Move all to selected")).toBeDisabled();
  });
  it("is controlled", () => {
    const onChange = vi.fn();
    render(<TransferList items={items} value={[]} onChange={onChange} />);
    fireEvent.doubleClick(source().getByText("Apple"));
    expect(onChange).toHaveBeenCalledWith(["a"]);
    expect(source().getByText("Apple")).toBeInTheDocument();
  });
  it("renders groups, custom rows and empty text", () => {
    render(
      <TransferList
        items={[{ key: "x", label: "X", group: "Letters" }]}
        renderItem={(i) => <b>custom {i.label}</b>}
        emptyText={["none", "nothing yet"]}
      />
    );
    expect(screen.getByText("Letters")).toBeInTheDocument();
    expect(screen.getByText("custom X")).toBeInTheDocument();
    expect(screen.getByText("nothing yet")).toBeInTheDocument();
  });
});
