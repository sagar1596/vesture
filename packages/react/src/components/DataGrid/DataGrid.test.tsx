import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataGrid } from "./DataGrid";
import type { DataGridColumn } from "./types";

interface Person {
  id: string;
  name: string;
  age: number;
}

const people: Person[] = Array.from({ length: 50 }, (_, i) => ({
  id: `r${i}`,
  name: `Person ${i}`,
  age: 50 - i
}));

const columns: DataGridColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true, accessor: (r) => r.name },
  { key: "age", header: "Age", sortable: true, accessor: (r) => r.age }
];

describe("DataGrid", () => {
  it("renders column headers and cell values", () => {
    render(<DataGrid columns={columns} data={people.slice(0, 5)} getRowId={(r) => r.id} />);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByText("Person 0")).toBeInTheDocument();
  });

  it("only renders a virtualized window of rows for large datasets", () => {
    render(
      <DataGrid columns={columns} data={people} getRowId={(r) => r.id} height={100} rowHeight={40} overscan={2} />
    );
    expect(screen.getByText("Person 0")).toBeInTheDocument();
    expect(screen.queryByText("Person 49")).not.toBeInTheDocument();
  });

  it("sorts ascending then descending then clears on repeated header clicks", () => {
    const small = people.slice(0, 5);
    render(<DataGrid columns={columns} data={small} getRowId={(r) => r.id} height={400} />);

    const ageHeader = screen.getByRole("columnheader", { name: /Age/ });
    fireEvent.click(within(ageHeader).getByRole("button"));
    expect(ageHeader).toHaveAttribute("aria-sort", "ascending");

    const rowsAsc = screen.getAllByRole("row").slice(1);
    expect(within(rowsAsc[0]!).getByText("Person 4")).toBeInTheDocument();

    fireEvent.click(within(ageHeader).getByRole("button"));
    expect(ageHeader).toHaveAttribute("aria-sort", "descending");
    const rowsDesc = screen.getAllByRole("row").slice(1);
    expect(within(rowsDesc[0]!).getByText("Person 0")).toBeInTheDocument();

    fireEvent.click(within(ageHeader).getByRole("button"));
    expect(ageHeader).toHaveAttribute("aria-sort", "none");
  });

  it("selects all rows via the header checkbox", () => {
    const onSelectionChange = vi.fn();
    const small = people.slice(0, 3);
    render(
      <DataGrid
        columns={columns}
        data={small}
        getRowId={(r) => r.id}
        selectable
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows" }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(["r0", "r1", "r2"]));
  });

  it("selects an individual row", () => {
    const small = people.slice(0, 3);
    render(<DataGrid columns={columns} data={small} getRowId={(r) => r.id} selectable />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Select row 1" }));
    expect(screen.getByRole("checkbox", { name: "Select row 1" })).toBeChecked();
  });

  it("shows the empty message when there is no data", () => {
    render(<DataGrid columns={columns} data={[]} getRowId={(r) => r.id} emptyMessage="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
