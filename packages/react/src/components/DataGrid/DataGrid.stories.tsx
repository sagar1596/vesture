import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "../Badge";
import { DataGrid } from "./DataGrid";
import type { DataGridColumn } from "./types";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  salary: number;
}

const departments = ["Engineering", "Design", "Sales", "Marketing", "Support"];
const roles = ["Manager", "Senior", "Junior", "Lead", "Director"];

const employees: Employee[] = Array.from({ length: 500 }, (_, i) => ({
  id: `emp-${i}`,
  name: `Employee ${i}`,
  role: roles[i % roles.length]!,
  department: departments[i % departments.length]!,
  status: i % 5 === 0 ? "inactive" : "active",
  salary: 60000 + ((i * 733) % 80000)
}));

const columns: DataGridColumn<Employee>[] = [
  { key: "name", header: "Name", sortable: true, accessor: (r) => r.name, width: 180 },
  { key: "role", header: "Role", sortable: true, accessor: (r) => r.role, width: 140 },
  { key: "department", header: "Department", sortable: true, accessor: (r) => r.department, width: 160 },
  {
    key: "status",
    header: "Status",
    sortable: true,
    accessor: (r) => r.status,
    width: 120,
    render: (r) => <Badge variant={r.status === "active" ? "success" : "default"}>{r.status}</Badge>
  },
  {
    key: "salary",
    header: "Salary",
    sortable: true,
    accessor: (r) => r.salary,
    width: 140,
    render: (r) => `$${r.salary.toLocaleString()}`
  }
];

const meta: Meta<typeof DataGrid<Employee>> = {
  title: "Components/DataGrid",
  component: DataGrid<Employee>
};

export default meta;
type Story = StoryObj<typeof DataGrid<Employee>>;

export const Default: Story = {
  render: () => (
    <DataGrid columns={columns} data={employees.slice(0, 20)} getRowId={(r) => r.id} height={400} />
  )
};

export const LargeDataset: Story = {
  render: () => <DataGrid columns={columns} data={employees} getRowId={(r) => r.id} height={480} />
};

export const Selectable: Story = {
  render: () => {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    return (
      <div>
        <p>{selected.size} selected</p>
        <DataGrid
          columns={columns}
          data={employees.slice(0, 30)}
          getRowId={(r) => r.id}
          height={400}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
        />
      </div>
    );
  }
};

export const Empty: Story = {
  render: () => <DataGrid columns={columns} data={[]} getRowId={(r) => r.id} height={200} />
};

const pinnedColumns: DataGridColumn<Employee>[] = [
  { key: "name", header: "Name", sortable: true, accessor: (r) => r.name, width: 180, pinned: "left" },
  { key: "role", header: "Role", sortable: true, accessor: (r) => r.role, width: 140 },
  { key: "department", header: "Department", sortable: true, accessor: (r) => r.department, width: 160 },
  {
    key: "status",
    header: "Status",
    sortable: true,
    accessor: (r) => r.status,
    width: 120,
    render: (r) => <Badge variant={r.status === "active" ? "success" : "default"}>{r.status}</Badge>
  },
  {
    key: "salary",
    header: "Salary",
    sortable: true,
    accessor: (r) => r.salary,
    width: 140,
    pinned: "right",
    render: (r) => `$${r.salary.toLocaleString()}`
  }
];

export const PinnedColumns: Story = {
  render: () => (
    <DataGrid columns={pinnedColumns} data={employees.slice(0, 30)} getRowId={(r) => r.id} height={400} />
  )
};

const editableColumns: DataGridColumn<Employee>[] = [
  { key: "name", header: "Name", sortable: true, accessor: (r) => r.name, width: 180, editable: true },
  { key: "role", header: "Role", sortable: true, accessor: (r) => r.role, width: 140, editable: true },
  { key: "department", header: "Department", sortable: true, accessor: (r) => r.department, width: 160 },
  {
    key: "status",
    header: "Status",
    sortable: true,
    accessor: (r) => r.status,
    width: 120,
    render: (r) => <Badge variant={r.status === "active" ? "success" : "default"}>{r.status}</Badge>
  }
];

export const EditableRows: Story = {
  render: () => {
    const [rows, setRows] = useState(employees.slice(0, 20));
    return (
      <DataGrid
        columns={editableColumns}
        data={rows}
        getRowId={(r) => r.id}
        height={400}
        onRowEdit={(id, values) =>
          setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...values } : r)))
        }
      />
    );
  }
};
