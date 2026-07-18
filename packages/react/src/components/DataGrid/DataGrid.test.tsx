import { createRef } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataGrid } from "./DataGrid";
import type { DataGridHandle } from "./DataGrid";
import type { DataGridColumn } from "./types";

const { aoaToSheet, bookNew, bookAppendSheet, writeFile } = vi.hoisted(() => ({
  aoaToSheet: vi.fn(() => ({})),
  bookNew: vi.fn(() => ({})),
  bookAppendSheet: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("xlsx", () => ({
  utils: {
    aoa_to_sheet: aoaToSheet,
    book_new: bookNew,
    book_append_sheet: bookAppendSheet,
  },
  writeFile,
}));

interface Person {
  id: string;
  name: string;
  age: number;
}

const people: Person[] = Array.from({ length: 50 }, (_, i) => ({
  id: `r${i}`,
  name: `Person ${i}`,
  age: 50 - i,
}));

const columns: DataGridColumn<Person>[] = [
  { key: "name", header: "Name", sortable: true, accessor: (r) => r.name },
  { key: "age", header: "Age", sortable: true, accessor: (r) => r.age },
];

describe("DataGrid", () => {
  it("renders column headers and cell values", () => {
    render(
      <DataGrid
        columns={columns}
        data={people.slice(0, 5)}
        getRowId={(r) => r.id}
      />
    );
    expect(
      screen.getByRole("columnheader", { name: /Name/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Person 0")).toBeInTheDocument();
  });

  it("only renders a virtualized window of rows for large datasets", () => {
    render(
      <DataGrid
        columns={columns}
        data={people}
        getRowId={(r) => r.id}
        height={100}
        rowHeight={40}
        overscan={2}
      />
    );
    expect(screen.getByText("Person 0")).toBeInTheDocument();
    expect(screen.queryByText("Person 49")).not.toBeInTheDocument();
  });

  it("sorts ascending then descending then clears on repeated header clicks", () => {
    const small = people.slice(0, 5);
    render(
      <DataGrid
        columns={columns}
        data={small}
        getRowId={(r) => r.id}
        height={400}
      />
    );

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
    render(
      <DataGrid
        columns={columns}
        data={small}
        getRowId={(r) => r.id}
        selectable
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Select row 1" }));
    expect(
      screen.getByRole("checkbox", { name: "Select row 1" })
    ).toBeChecked();
  });

  it("shows the empty message when there is no data", () => {
    render(
      <DataGrid
        columns={columns}
        data={[]}
        getRowId={(r) => r.id}
        emptyMessage="Nothing here"
      />
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  describe("pinned columns", () => {
    const pinnedColumns: DataGridColumn<Person>[] = [
      { key: "name", header: "Name", pinned: "left", accessor: (r) => r.name },
      { key: "age", header: "Age", accessor: (r) => r.age },
      { key: "id", header: "ID", pinned: "right", accessor: (r) => r.id },
    ];

    it("renders left-pinned columns before scrollable columns regardless of declared order", () => {
      const small = people.slice(0, 2);
      render(
        <DataGrid columns={pinnedColumns} data={small} getRowId={(r) => r.id} />
      );
      const headers = screen
        .getAllByRole("columnheader")
        .map((h) => h.textContent);
      expect(headers).toEqual(["Name", "Age", "ID"]);
    });

    it("applies a sticky left offset to left-pinned cells", () => {
      const small = people.slice(0, 2);
      render(
        <DataGrid
          columns={pinnedColumns}
          data={small}
          getRowId={(r) => r.id}
          selectable
        />
      );
      const nameHeader = screen.getByRole("columnheader", { name: /Name/ });
      // The checkbox column (44px) comes before it when selectable.
      expect(nameHeader.style.left).toBe("44px");
      expect(nameHeader.className).toMatch(/pinnedHeaderCell/);
    });

    it("applies a sticky right offset to right-pinned cells", () => {
      const small = people.slice(0, 2);
      render(
        <DataGrid columns={pinnedColumns} data={small} getRowId={(r) => r.id} />
      );
      const idHeader = screen.getByRole("columnheader", { name: /ID/ });
      expect(idHeader.style.right).toBe("0px");
      expect(idHeader.className).toMatch(/pinnedHeaderCell/);
    });
  });

  describe("inline row editing", () => {
    const editableColumns: DataGridColumn<Person>[] = [
      { key: "name", header: "Name", editable: true, accessor: (r) => r.name },
      { key: "age", header: "Age", accessor: (r) => r.age },
    ];

    it("does not render an actions column without onRowEdit", () => {
      const small = people.slice(0, 2);
      render(
        <DataGrid
          columns={editableColumns}
          data={small}
          getRowId={(r) => r.id}
        />
      );
      expect(
        screen.queryByRole("button", { name: /Edit row/ })
      ).not.toBeInTheDocument();
    });

    it("enters edit mode and shows an input for editable columns only", () => {
      const small = people.slice(0, 1);
      render(
        <DataGrid
          columns={editableColumns}
          data={small}
          getRowId={(r) => r.id}
          onRowEdit={() => {}}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Edit row 1" }));
      expect(screen.getByRole("textbox", { name: "Edit Name" })).toHaveValue(
        "Person 0"
      );
      expect(
        screen.queryByRole("textbox", { name: "Edit Age" })
      ).not.toBeInTheDocument();
    });

    it("saves the edited value via onRowEdit and exits edit mode", () => {
      const onRowEdit = vi.fn();
      const small = people.slice(0, 1);
      render(
        <DataGrid
          columns={editableColumns}
          data={small}
          getRowId={(r) => r.id}
          onRowEdit={onRowEdit}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Edit row 1" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Edit Name" }), {
        target: { value: "Ada Lovelace" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save row 1" }));

      expect(onRowEdit).toHaveBeenCalledWith("r0", { name: "Ada Lovelace" });
      expect(
        screen.queryByRole("textbox", { name: "Edit Name" })
      ).not.toBeInTheDocument();
    });

    it("discards changes on cancel without calling onRowEdit", () => {
      const onRowEdit = vi.fn();
      const small = people.slice(0, 1);
      render(
        <DataGrid
          columns={editableColumns}
          data={small}
          getRowId={(r) => r.id}
          onRowEdit={onRowEdit}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Edit row 1" }));
      fireEvent.change(screen.getByRole("textbox", { name: "Edit Name" }), {
        target: { value: "Discarded" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Cancel editing row 1" })
      );

      expect(onRowEdit).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("textbox", { name: "Edit Name" })
      ).not.toBeInTheDocument();
      expect(screen.getByText("Person 0")).toBeInTheDocument();
    });

    it("saves on Enter and cancels on Escape", () => {
      const onRowEdit = vi.fn();
      const small = people.slice(0, 1);
      render(
        <DataGrid
          columns={editableColumns}
          data={small}
          getRowId={(r) => r.id}
          onRowEdit={onRowEdit}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Edit row 1" }));
      const input = screen.getByRole("textbox", { name: "Edit Name" });
      fireEvent.change(input, { target: { value: "Enter Saved" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onRowEdit).toHaveBeenCalledWith("r0", { name: "Enter Saved" });

      fireEvent.click(screen.getByRole("button", { name: "Edit row 1" }));
      const input2 = screen.getByRole("textbox", { name: "Edit Name" });
      fireEvent.keyDown(input2, { key: "Escape" });
      expect(
        screen.queryByRole("textbox", { name: "Edit Name" })
      ).not.toBeInTheDocument();
    });
  });

  describe("column filtering", () => {
    const filterableColumns: DataGridColumn<Person>[] = [
      {
        key: "name",
        header: "Name",
        sortable: true,
        filterable: true,
        accessor: (r) => r.name,
      },
      { key: "age", header: "Age", sortable: true, accessor: (r) => r.age },
    ];

    it("filters rows by a text filter input after debouncing", async () => {
      const small = people.slice(0, 10);
      render(
        <DataGrid
          columns={filterableColumns}
          data={small}
          getRowId={(r) => r.id}
          height={400}
        />
      );

      expect(screen.getByText("Person 5")).toBeInTheDocument();

      fireEvent.change(screen.getByRole("textbox", { name: "Filter Name" }), {
        target: { value: "Person 5" },
      });

      await waitFor(() => {
        expect(screen.queryByText("Person 1")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Person 5")).toBeInTheDocument();
    });

    it("combines filter and sort: filter narrows the set, sort then orders it", async () => {
      const small = people.slice(0, 10); // ages 41..50, names Person 0..9
      render(
        <DataGrid
          columns={filterableColumns}
          data={small}
          getRowId={(r) => r.id}
          height={400}
        />
      );

      fireEvent.change(screen.getByRole("textbox", { name: "Filter Name" }), {
        target: { value: "Person" },
      });

      const ageHeader = screen.getByRole("columnheader", { name: /Age/ });
      fireEvent.click(within(ageHeader).getByRole("button"));

      await waitFor(() => {
        // getAllByRole("row") includes the header row and the filter row before data rows.
        const rows = screen.getAllByRole("row").slice(2);
        expect(within(rows[0]!).getByText("Person 9")).toBeInTheDocument();
      });
    });

    it("does not re-filter or re-sort data client-side when serverSide is true", async () => {
      const small = people.slice(0, 5);
      const onFilterChange = vi.fn();
      render(
        <DataGrid
          columns={filterableColumns}
          data={small}
          getRowId={(r) => r.id}
          height={400}
          serverSide
          filters={[]}
          onFilterChange={onFilterChange}
        />
      );

      fireEvent.change(screen.getByRole("textbox", { name: "Filter Name" }), {
        target: { value: "Person 0" },
      });

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith([
          { key: "name", value: "Person 0" },
        ]);
      });
      // Rows remain unchanged client-side since serverSide trusts the caller's data.
      expect(screen.getByText("Person 1")).toBeInTheDocument();
      expect(screen.getByText("Person 4")).toBeInTheDocument();
    });
  });

  describe("loading overlay", () => {
    it("renders the loading overlay without unmounting existing rows", () => {
      const small = people.slice(0, 3);
      render(
        <DataGrid
          columns={columns}
          data={small}
          getRowId={(r) => r.id}
          height={400}
          loading
        />
      );

      expect(
        screen.getByRole("status", { name: "Loading" })
      ).toBeInTheDocument();
      expect(screen.getByText("Person 0")).toBeInTheDocument();
    });
  });

  describe("Excel export", () => {
    interface Row {
      id: string;
      name: string;
      age: number;
      raw: string;
    }

    const rows: Row[] = [
      { id: "r0", name: "Ada Lovelace", age: 36, raw: "raw-0" },
      { id: "r1", name: "Alan Turing", age: 41, raw: "raw-1" },
    ];

    const exportColumns: DataGridColumn<Row>[] = [
      {
        key: "name",
        header: "Name",
        accessor: (r) => r.name,
        exportValue: (r) => r.name.toUpperCase(),
      },
      { key: "age", header: "Age", accessor: (r) => r.age },
      { key: "raw", header: "Raw" },
    ];

    it("does not render the toolbar export button by default", () => {
      render(<DataGrid columns={columns} data={people.slice(0, 2)} getRowId={(r) => r.id} />);
      expect(
        screen.queryByRole("button", { name: "Export" })
      ).not.toBeInTheDocument();
    });

    it("renders a toolbar export button when enableExport is true and triggers export on click", async () => {
      render(
        <DataGrid
          columns={exportColumns}
          data={rows}
          getRowId={(r) => r.id}
          enableExport
        />
      );

      const exportButton = screen.getByRole("button", { name: "Export" });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(writeFile).toHaveBeenCalledTimes(1);
      });
    });

    it("exports via the imperative ref handle using the value-resolution fallback order: exportValue > accessor > raw", async () => {
      const ref = createRef<DataGridHandle<Row>>();
      render(
        <DataGrid
          columns={exportColumns}
          data={rows}
          getRowId={(r) => r.id}
          ref={ref}
        />
      );

      await ref.current!.exportToExcel({
        filename: "custom.xlsx",
        sheetName: "Custom",
      });

      expect(aoaToSheet).toHaveBeenCalledWith([
        ["Name", "Age", "Raw"],
        ["ADA LOVELACE", 36, "raw-0"],
        ["ALAN TURING", 41, "raw-1"],
      ]);
      expect(bookAppendSheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "Custom"
      );
      expect(writeFile).toHaveBeenCalledWith(expect.anything(), "custom.xlsx");
    });

    it("respects the current filtered/sorted view, not the raw data prop, when exporting", async () => {
      const sortableExportColumns: DataGridColumn<Row>[] = [
        { key: "name", header: "Name", sortable: true, accessor: (r) => r.name },
        { key: "age", header: "Age", sortable: true, accessor: (r) => r.age },
      ];
      const ref = createRef<DataGridHandle<Row>>();
      render(
        <DataGrid
          columns={sortableExportColumns}
          data={rows}
          getRowId={(r) => r.id}
          ref={ref}
        />
      );

      const ageHeader = screen.getByRole("columnheader", { name: /Age/ });
      fireEvent.click(within(ageHeader).getByRole("button")); // ascending
      fireEvent.click(within(ageHeader).getByRole("button")); // descending

      await ref.current!.exportToExcel();

      expect(aoaToSheet).toHaveBeenCalledWith([
        ["Name", "Age"],
        ["Alan Turing", 41],
        ["Ada Lovelace", 36],
      ]);
    });
  });
});
