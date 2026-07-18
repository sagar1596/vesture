import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Combobox,
  DataGrid,
  defaultThemeClass,
  Divider,
  DropdownMenu,
  Input,
  Label,
  Modal,
  NumberInput,
  Pagination,
  Popover,
  Progress,
  Radio,
  Select,
  Slider,
  Spinner,
  Stack,
  Switch,
  Tabs,
  Textarea,
  ToastProvider,
  Tooltip,
  TreeView,
  useToast,
  vars
} from "@vesture/react";
import type {
  ComboboxOption,
  DataGridColumn,
  SliderValue,
  TreeNode,
} from "@vesture/react";
import { retroThemeClass } from "@vesture/theme-retro";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const THEMES = {
  default: defaultThemeClass,
  retro: retroThemeClass
} as const;

type ThemeName = keyof typeof THEMES;

function useThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeName>("default");

  useEffect(() => {
    const root = document.documentElement;
    for (const className of Object.values(THEMES)) {
      root.classList.remove(className);
    }
    root.classList.add(THEMES[theme]);
  }, [theme]);

  return { theme, setTheme };
}

function ThemeSwitcher({ theme, setTheme }: { theme: ThemeName; setTheme: (theme: ThemeName) => void }) {
  return (
    <Stack direction="row" gap="sm">
      <Button variant={theme === "default" ? "primary" : "secondary"} onClick={() => setTheme("default")}>
        Default theme
      </Button>
      <Button variant={theme === "retro" ? "primary" : "secondary"} onClick={() => setTheme("retro")}>
        Retro theme
      </Button>
    </Stack>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap="md" style={{ width: "100%", maxWidth: "720px" }}>
      <h2
        style={{
          fontFamily: vars.font.display,
          fontSize: vars.font.sizeLg,
          color: vars.color.text,
          margin: 0
        }}
      >
        {title}
      </h2>
      <Card elevation="raised">{children}</Card>
    </Stack>
  );
}

function ButtonsSection() {
  return (
    <Section title="Buttons">
      <Stack direction="row" gap="sm" wrap>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </Stack>
    </Section>
  );
}

function FormControlsSection() {
  return (
    <Section title="Form controls">
      <Stack gap="lg">
        <Stack gap="sm">
          <Label htmlFor="showcase-input">Input</Label>
          <Input id="showcase-input" placeholder="Type something" />
        </Stack>
        <Stack gap="sm">
          <Label htmlFor="showcase-input-invalid">Input (invalid)</Label>
          <Input id="showcase-input-invalid" defaultValue="not-an-email" invalid />
        </Stack>
        <Stack gap="sm">
          <Label htmlFor="showcase-input-disabled">Input (disabled)</Label>
          <Input id="showcase-input-disabled" defaultValue="Can't edit this" disabled />
        </Stack>
        <Stack gap="sm">
          <Label htmlFor="showcase-select">Select</Label>
          <Select id="showcase-select" defaultValue="">
            <option value="" disabled>
              Choose an option
            </option>
            <option value="a">Option A</option>
            <option value="b">Option B</option>
          </Select>
        </Stack>
        <Stack gap="sm">
          <Label htmlFor="showcase-textarea">Textarea</Label>
          <Textarea id="showcase-textarea" placeholder="Write a message" />
        </Stack>
      </Stack>
    </Section>
  );
}

function SelectionControlsSection() {
  const [switchOn, setSwitchOn] = useState(true);

  return (
    <Section title="Selection controls">
      <Stack gap="md">
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="Disabled" disabled />
        <Divider />
        <Radio label="Option A" name="showcase-radio" defaultChecked />
        <Radio label="Option B" name="showcase-radio" />
        <Radio label="Disabled" name="showcase-radio-disabled" disabled />
        <Divider />
        <Switch label="Toggle" checked={switchOn} onChange={(e) => setSwitchOn(e.target.checked)} />
        <Switch label="Disabled" disabled />
      </Stack>
    </Section>
  );
}

const FRUIT_OPTIONS: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "durian", label: "Durian", disabled: true },
  { value: "elderberry", label: "Elderberry" },
  { value: "fig", label: "Fig" },
  { value: "grape", label: "Grape" }
];

function NewFormControlsSection() {
  const [quantity, setQuantity] = useState<number | null>(3);
  const [volume, setVolume] = useState<SliderValue>(40);
  const [priceRange, setPriceRange] = useState<SliderValue>([20, 80]);
  const [fruit, setFruit] = useState<string | null>(null);
  const [fruits, setFruits] = useState<string[]>(["apple", "fig"]);

  return (
    <Section title="NumberInput, Slider & Combobox">
      <Stack gap="lg">
        <Stack gap="sm">
          <Label htmlFor="showcase-number-input">NumberInput</Label>
          <NumberInput
            id="showcase-number-input"
            value={quantity}
            onChange={setQuantity}
            min={0}
            max={10}
            style={{ maxWidth: "160px" }}
          />
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Label htmlFor="showcase-slider">Slider — {volume}</Label>
          <Slider id="showcase-slider" aria-label="Volume" value={volume} onChange={setVolume} />
        </Stack>

        <Stack gap="sm">
          <Label>
            Range slider — {Array.isArray(priceRange) ? `${priceRange[0]} – ${priceRange[1]}` : priceRange}
          </Label>
          <Slider
            aria-label={["Minimum price", "Maximum price"]}
            value={priceRange}
            onChange={setPriceRange}
            min={0}
            max={200}
          />
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Label htmlFor="showcase-combobox">Combobox</Label>
          <Combobox
            id="showcase-combobox"
            aria-label="Fruit"
            options={FRUIT_OPTIONS}
            value={fruit}
            onChange={(next) => setFruit(next as string | null)}
            placeholder="Search fruit…"
          />
        </Stack>

        <Stack gap="sm">
          <Label htmlFor="showcase-combobox-multi">Combobox (multi-select)</Label>
          <Combobox
            id="showcase-combobox-multi"
            aria-label="Fruits"
            options={FRUIT_OPTIONS}
            multiple
            value={fruits}
            onChange={(next) => setFruits(next as string[])}
            placeholder="Add fruit…"
          />
        </Stack>
      </Stack>
    </Section>
  );
}

function LayoutSection() {
  return (
    <Section title="Layout">
      <Stack gap="md">
        <Stack direction="row" gap="md">
          <Card elevation="flat" style={{ flex: 1 }}>
            Flat
          </Card>
          <Card elevation="raised" style={{ flex: 1 }}>
            Raised
          </Card>
          <Card elevation="overlay" style={{ flex: 1 }}>
            Overlay
          </Card>
        </Stack>
        <Divider />
        <Stack direction="row" gap="sm" align="center">
          <span>Left</span>
          <Divider orientation="vertical" />
          <span>Center</span>
          <Divider orientation="vertical" />
          <span>Right</span>
        </Stack>
      </Stack>
    </Section>
  );
}

function OverlaysSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  return (
    <Section title="Overlays & feedback">
      <Stack direction="row" gap="sm" wrap align="center">
        <Tooltip content="I'm a helpful tooltip">
          <Button variant="secondary">Hover me</Button>
        </Tooltip>

        <Popover
          content={
            <Stack gap="sm">
              <strong>Popover title</strong>
              <span>Supporting content goes here.</span>
            </Stack>
          }
        >
          <Button variant="secondary">Click me</Button>
        </Popover>

        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          Open modal
        </Button>

        <Button
          variant="secondary"
          onClick={() =>
            toast({ title: "Saved", description: "Your changes have been saved.", variant: "success" })
          }
        >
          Fire toast
        </Button>

        <DropdownMenu trigger={<Button variant="secondary">Options</Button>}>
          <DropdownMenu.Item onSelect={() => toast({ title: "Edited" })}>Edit</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => toast({ title: "Duplicated" })}>Duplicate</DropdownMenu.Item>
          <DropdownMenu.Item disabled>Archive (disabled)</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => toast({ title: "Deleted", variant: "danger" })}>
            Delete
          </DropdownMenu.Item>
        </DropdownMenu>
      </Stack>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title="Delete item">
        <Stack gap="lg">
          <p style={{ margin: 0 }}>Are you sure you want to delete this item? This action cannot be undone.</p>
          <Stack direction="row" gap="sm" justify="end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false);
                toast({ title: "Item deleted", variant: "danger" });
              }}
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </Section>
  );
}

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  salary: number;
}

const DEPARTMENTS = ["Engineering", "Design", "Sales", "Marketing", "Support"];
const ROLES = ["Manager", "Senior", "Junior", "Lead", "Director"];

const employees: Employee[] = Array.from({ length: 500 }, (_, i) => ({
  id: `emp-${i}`,
  name: `Employee ${i}`,
  role: ROLES[i % ROLES.length]!,
  department: DEPARTMENTS[i % DEPARTMENTS.length]!,
  status: i % 5 === 0 ? "inactive" : "active",
  salary: 60000 + ((i * 733) % 80000)
}));

const employeeColumns: DataGridColumn<Employee>[] = [
  { key: "name", header: "Name", sortable: true, accessor: (r) => r.name, width: 180, pinned: "left", editable: true },
  { key: "role", header: "Role", sortable: true, accessor: (r) => r.role, width: 140, editable: true },
  { key: "department", header: "Department", sortable: true, accessor: (r) => r.department, width: 160 },
  { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, width: 120, pinned: "right" }
];

function DataGridSection() {
  const [rows, setRows] = useState(employees);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <Section title="DataGrid">
      <Stack gap="sm">
        <p style={{ fontSize: vars.font.sizeSm, color: vars.color.textMuted, margin: 0 }}>
          {rows.length} rows, virtualized · {selected.size} selected · Name pinned left, Status pinned right ·
          Name/Role editable
        </p>
        <DataGrid
          columns={employeeColumns}
          data={rows}
          getRowId={(r) => r.id}
          height={360}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          onRowEdit={(id, values) =>
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...values } : r)))
          }
        />
      </Stack>
    </Section>
  );
}

const groupableEmployeeColumns: DataGridColumn<Employee>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, width: 180 },
  { key: "role", header: "Role", accessor: (r) => r.role, width: 140 },
  { key: "department", header: "Department", accessor: (r) => r.department, width: 160 },
  { key: "status", header: "Status", accessor: (r) => r.status, width: 120 },
  {
    key: "salary",
    header: "Salary",
    accessor: (r) => r.salary,
    width: 140,
    aggregate: "sum",
    render: (r) => `$${r.salary.toLocaleString()}`
  }
];

function DataGridGroupingSection() {
  return (
    <Section title="DataGrid — Grouping">
      <Stack gap="sm">
        <p style={{ fontSize: vars.font.sizeSm, color: vars.color.textMuted, margin: 0 }}>
          Grouped by Department · Salary column aggregates via sum · click the chevron to collapse/expand
        </p>
        <DataGrid
          columns={groupableEmployeeColumns}
          data={employees.slice(0, 100)}
          getRowId={(r) => r.id}
          height={400}
          groupBy="department"
          selectable
        />
      </Stack>
    </Section>
  );
}

const filterableEmployeeColumns: DataGridColumn<Employee>[] = [
  { key: "name", header: "Name", sortable: true, filterable: true, accessor: (r) => r.name, width: 180 },
  { key: "role", header: "Role", sortable: true, filterable: true, accessor: (r) => r.role, width: 140 },
  {
    key: "department",
    header: "Department",
    sortable: true,
    filterable: true,
    filterType: "select",
    accessor: (r) => r.department,
    width: 160
  },
  { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, width: 120 }
];

function DataGridFilteringSection() {
  return (
    <Section title="DataGrid — Filtering">
      <Stack gap="sm">
        <p style={{ fontSize: vars.font.sizeSm, color: vars.color.textMuted, margin: 0 }}>
          Name/Role text filters, Department select filter · filters apply before sort, client-side
        </p>
        <DataGrid columns={filterableEmployeeColumns} data={employees} getRowId={(r) => r.id} height={360} />
      </Stack>
    </Section>
  );
}

const SERVER_PAGE_SIZE = 10;

function fetchEmployeesPage(
  page: number,
  nameFilter: string
): Promise<{ rows: Employee[]; total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filtered = nameFilter
        ? employees.filter((r) => r.name.toLowerCase().includes(nameFilter.toLowerCase()))
        : employees;
      const start = (page - 1) * SERVER_PAGE_SIZE;
      resolve({ rows: filtered.slice(start, start + SERVER_PAGE_SIZE), total: filtered.length });
    }, 400);
  });
}

function DataGridServerSideSection() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const nameFilter = filters.find((f) => f.key === "name")?.value ?? "";
    fetchEmployeesPage(page, nameFilter).then(({ rows: nextRows, total: nextTotal }) => {
      if (cancelled) return;
      setRows(nextRows);
      setTotal(nextTotal);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [page, filters]);

  return (
    <Section title="DataGrid — Server-side">
      <Stack gap="sm">
        <p style={{ fontSize: vars.font.sizeSm, color: vars.color.textMuted, margin: 0 }}>
          {total} matching rows · page {page} · simulated 400ms network latency
        </p>
        <DataGrid
          columns={filterableEmployeeColumns}
          data={rows}
          getRowId={(r) => r.id}
          height={360}
          serverSide
          loading={loading}
          filters={filters}
          onFilterChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          page={page}
          pageSize={SERVER_PAGE_SIZE}
          totalRowCount={total}
          onPageChange={setPage}
        />
      </Stack>
    </Section>
  );
}

function FeedbackSection() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <Section title="Feedback & status">
      <Stack gap="lg">
        <Stack direction="row" gap="sm" wrap>
          <Badge>Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
        </Stack>

        <Divider />

        <Stack direction="row" gap="md" align="center">
          <Avatar name="Ada Lovelace" size="sm" />
          <Avatar name="Ada Lovelace" size="md" status="online" />
          <Avatar name="Grace Hopper" size="lg" status="busy" />
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Progress value={60} label="Uploading" style={{ width: "320px" }} />
          <Progress label="Processing" style={{ width: "320px" }} />
        </Stack>

        <Divider />

        <Stack direction="row" gap="md" align="center">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Alert variant="info" title="Heads up">
            This is an informational message.
          </Alert>
          <Alert variant="success" title="Success">
            Your changes have been saved.
          </Alert>
          <Alert variant="warning" title="Warning">
            This action may have side effects.
          </Alert>
          {!dismissed ? (
            <Alert variant="danger" title="Error" onDismiss={() => setDismissed(true)}>
              Something went wrong. Please try again.
            </Alert>
          ) : null}
        </Stack>
      </Stack>
    </Section>
  );
}

function NavigationSection() {
  const [page, setPage] = useState(4);

  return (
    <Section title="Navigation">
      <Stack gap="lg">
        <Breadcrumbs>
          <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
          <Breadcrumbs.Item href="/settings">Settings</Breadcrumbs.Item>
          <Breadcrumbs.Item>Profile</Breadcrumbs.Item>
        </Breadcrumbs>

        <Divider />

        <Pagination page={page} totalPages={20} onPageChange={setPage} />

        <Divider />

        <Tabs defaultValue="account">
          <Tabs.List>
            <Tabs.Trigger value="account">Account</Tabs.Trigger>
            <Tabs.Trigger value="security">Security</Tabs.Trigger>
            <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panel value="account">Manage your account details here.</Tabs.Panel>
          <Tabs.Panel value="security">Update your password and two-factor settings.</Tabs.Panel>
          <Tabs.Panel value="billing">View invoices and manage your subscription.</Tabs.Panel>
        </Tabs>

        <Divider />

        <Accordion type="single" defaultValue="a">
          <Accordion.Item value="a">
            <Accordion.Trigger>What is Vesture?</Accordion.Trigger>
            <Accordion.Content>A themeable component library built on a shared token contract.</Accordion.Content>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Trigger>Is it themeable?</Accordion.Trigger>
            <Accordion.Content>
              Yes — every component reads from the token contract, not fixed values.
            </Accordion.Content>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Section>
  );
}

const treeViewNodes: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "components",
        label: "components",
        children: [
          { id: "button", label: "Button.tsx" },
          { id: "checkbox", label: "Checkbox.tsx" },
          {
            id: "treeview-folder",
            label: "TreeView",
            children: [
              { id: "treeview-tsx", label: "TreeView.tsx" },
              { id: "treeview-css", label: "TreeView.css.ts" },
            ],
          },
        ],
      },
      { id: "index", label: "index.ts" },
    ],
  },
  { id: "lazy-folder", label: "Lazy folder (fetches on expand)", hasChildren: true },
  { id: "package", label: "package.json" },
];

function fakeFetchTreeChildren(node: TreeNode): Promise<TreeNode[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: `${node.id}-a`, label: "Fetched child A" },
        { id: `${node.id}-b`, label: "Fetched child B" },
      ]);
    }, 700);
  });
}

function TreeViewSection() {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  return (
    <Section title="TreeView">
      <Stack direction="row" gap="lg">
        <Stack gap="sm">
          <Label>Plain (expand/collapse only)</Label>
          <TreeView nodes={treeViewNodes} defaultExpanded={new Set(["src", "components"])} />
        </Stack>
        <Stack gap="sm">
          <Label>Multi-select with cascading + lazy loading</Label>
          <TreeView
            nodes={treeViewNodes}
            selectable="multi"
            selected={selected}
            onSelectedChange={setSelected}
            onLoadChildren={fakeFetchTreeChildren}
            defaultExpanded={new Set(["src", "components"])}
          />
          <p style={{ fontSize: vars.font.sizeSm, color: vars.color.textMuted, margin: 0 }}>
            Selected: {selected.size === 0 ? "none" : Array.from(selected).join(", ")}
          </p>
        </Stack>
      </Stack>
    </Section>
  );
}

function ComposedFormSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const emailTouched = email.length > 0;
  const emailInvalid = emailTouched && !EMAIL_PATTERN.test(email);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setStatus("Full name is required.");
      return;
    }
    if (emailInvalid) {
      setStatus("Enter a valid email address.");
      return;
    }
    setStatus(`Submitted for ${name}.`);
  };

  const handleSaveDraft = () => setStatus("Draft saved.");

  const handleCancel = () => {
    setName("");
    setEmail("");
    setStatus(null);
  };

  return (
    <Section title="Composed example">
      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Label htmlFor="name" required>
              Full name
            </Label>
            <Input id="name" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} />
          </Stack>

          <Stack gap="sm">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ada@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={emailInvalid}
            />
          </Stack>

          <Stack gap="sm">
            <Label htmlFor="role">Role</Label>
            <Select id="role" defaultValue="">
              <option value="" disabled>
                Select a role
              </option>
              <option value="engineer">Engineer</option>
              <option value="designer">Designer</option>
              <option value="pm">Product Manager</option>
            </Select>
          </Stack>

          <Stack gap="sm">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" placeholder="Tell us about yourself" />
          </Stack>

          <Divider />

          <Stack gap="sm">
            <Checkbox label="I agree to the terms and conditions" />
            <Radio label="Notify me by email" name="notify" defaultChecked />
            <Radio label="Notify me by SMS" name="notify" />
            <Switch
              label="Enable push notifications"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
          </Stack>

          <Divider />

          {status ? (
            <p style={{ fontSize: vars.font.sizeSm, color: vars.color.textMuted, margin: 0 }}>{status}</p>
          ) : null}

          <Stack direction="row" gap="sm" justify="end">
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveDraft}>
              Save draft
            </Button>
            <Button type="submit" variant="primary">
              Submit
            </Button>
          </Stack>
        </Stack>
      </form>
    </Section>
  );
}

export function App() {
  const { theme, setTheme } = useThemeSwitcher();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: vars.color.background,
        padding: vars.space["2xl"]
      }}
    >
      <ToastProvider>
        <Stack gap="xl" align="center">
          <h1 style={{ fontFamily: vars.font.display, color: vars.color.text }}>Vesture Playground</h1>
          <ThemeSwitcher theme={theme} setTheme={setTheme} />
          <ButtonsSection />
          <FormControlsSection />
          <NewFormControlsSection />
          <SelectionControlsSection />
          <LayoutSection />
          <OverlaysSection />
          <NavigationSection />
          <FeedbackSection />
          <DataGridSection />
          <DataGridGroupingSection />
          <DataGridFilteringSection />
          <DataGridServerSideSection />
          <TreeViewSection />
          <ComposedFormSection />
        </Stack>
      </ToastProvider>
    </div>
  );
}
