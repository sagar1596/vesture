import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Gantt } from "./Gantt";
import { applyDelta, buildRows, collectDependencies, dependencyPath, formatDay, parseDay } from "./gantt-layout";
import type { GanttTask } from "./types";

const tasks: GanttTask[] = [
  { id: "p", name: "Launch", start: "2026-03-02", end: "2026-03-02" },
  { id: "a", name: "Design", start: "2026-03-02", end: "2026-03-06", parentId: "p", progress: 50 },
  { id: "b", name: "Build", start: "2026-03-09", end: "2026-03-20", parentId: "p", dependsOn: ["a"] },
  { id: "c", name: "Ship", start: "2026-03-23", end: "2026-03-23", dependsOn: ["b"] }
];

describe("gantt-layout", () => {
  it("round-trips ISO dates through day numbers, across DST changes", () => {
    expect(formatDay(parseDay("2026-03-08"))).toBe("2026-03-08");
    expect(parseDay("2026-03-09") - parseDay("2026-03-08")).toBe(1);
  });

  it("makes a parent's span cover its children and nests depth", () => {
    const rows = buildRows(tasks, new Set());
    const parent = rows.find((r) => r.task.id === "p")!;
    expect(parent.hasChildren).toBe(true);
    expect(formatDay(parent.start)).toBe("2026-03-02");
    expect(formatDay(parent.end)).toBe("2026-03-20");
    expect(rows.find((r) => r.task.id === "a")!.depth).toBe(1);
  });

  it("hides descendants of collapsed tasks", () => {
    expect(buildRows(tasks, new Set(["p"])).map((r) => r.task.id)).toEqual(["p", "c"]);
  });

  it("survives parentId cycles and unknown parents", () => {
    const odd: GanttTask[] = [
      { id: "x", name: "X", start: "2026-01-01", end: "2026-01-02", parentId: "y" },
      { id: "y", name: "Y", start: "2026-01-01", end: "2026-01-02", parentId: "x" },
      { id: "z", name: "Z", start: "2026-01-01", end: "2026-01-02", parentId: "nope" }
    ];
    expect(() => buildRows(odd, new Set())).not.toThrow();
    expect(buildRows(odd, new Set()).map((r) => r.task.id)).toContain("z");
  });

  it("applies move/resize deltas without letting end precede start", () => {
    expect(applyDelta("move", 10, 12, 3)).toEqual([13, 15]);
    expect(applyDelta("resize-end", 10, 12, -5)).toEqual([10, 10]);
    expect(applyDelta("resize-start", 10, 12, 5)).toEqual([12, 12]);
  });

  it("collects only dependencies between visible rows", () => {
    const rows = buildRows(tasks, new Set(["p"]));
    expect(collectDependencies(rows)).toEqual([]); // c depends on hidden b
    expect(collectDependencies(buildRows(tasks, new Set()))).toHaveLength(2);
  });

  it("routes a backwards dependency around instead of through the target", () => {
    expect(dependencyPath(0, 0, 100, 40)).toBe("M0,0 H8 V40 H100");
    expect(dependencyPath(100, 0, 20, 40)).toContain("V26");
  });
});

describe("Gantt", () => {
  it("renders a row and bar per visible task with accessible labels", () => {
    render(<Gantt tasks={tasks} today="2026-03-10" />);
    expect(screen.getAllByTestId("gantt-row")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Design, 2026-03-02 to 2026-03-06, 50% complete" })).toBeInTheDocument();
  });

  it("draws one arrow per dependency and a today marker", () => {
    render(<Gantt tasks={tasks} today="2026-03-10" />);
    expect(screen.getAllByTestId("gantt-dependency")).toHaveLength(2);
    expect(screen.getByTestId("gantt-today")).toBeInTheDocument();
  });

  it("collapses and expands a summary task", () => {
    render(<Gantt tasks={tasks} today="2026-03-10" />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse Launch" }));
    expect(screen.getAllByTestId("gantt-row")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Expand Launch" }));
    expect(screen.getAllByTestId("gantt-row")).toHaveLength(4);
  });

  it("is read-only without onTaskChange", () => {
    render(<Gantt tasks={tasks} today="2026-03-10" />);
    expect(screen.queryAllByTestId("gantt-handle-end")).toHaveLength(0);
    fireEvent.keyDown(screen.getByRole("button", { name: /^Build/ }), { key: "ArrowRight" });
  });

  it("moves a task a day with ArrowRight and resizes with Shift+ArrowRight", () => {
    const onTaskChange = vi.fn();
    render(<Gantt tasks={tasks} today="2026-03-10" onTaskChange={onTaskChange} />);
    const bar = screen.getByRole("button", { name: /^Build/ });
    fireEvent.keyDown(bar, { key: "ArrowRight" });
    expect(onTaskChange).toHaveBeenLastCalledWith("b", { start: "2026-03-10", end: "2026-03-21" });
    fireEvent.keyDown(bar, { key: "ArrowRight", shiftKey: true });
    expect(onTaskChange).toHaveBeenLastCalledWith("b", { start: "2026-03-09", end: "2026-03-21" });
  });

  it("does not allow editing summary bars", () => {
    const onTaskChange = vi.fn();
    render(<Gantt tasks={tasks} today="2026-03-10" onTaskChange={onTaskChange} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /^Launch/ }), { key: "ArrowRight" });
    expect(onTaskChange).not.toHaveBeenCalled();
  });

  it("commits a pointer drag in whole days and not a plain click", () => {
    const onTaskChange = vi.fn();
    const onTaskClick = vi.fn();
    render(<Gantt tasks={tasks} dayWidth={30} today="2026-03-10" onTaskChange={onTaskChange} onTaskClick={onTaskClick} />);
    const bar = screen.getByRole("button", { name: /^Ship/ });
    fireEvent.pointerDown(bar, { clientX: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(bar, { clientX: 160, pointerId: 1 });
    fireEvent.pointerUp(bar, { clientX: 160, pointerId: 1 });
    expect(onTaskChange).toHaveBeenCalledWith("c", { start: "2026-03-25", end: "2026-03-25" });

    onTaskChange.mockClear();
    fireEvent.pointerDown(bar, { clientX: 100, button: 0, pointerId: 1 });
    fireEvent.pointerUp(bar, { clientX: 100, pointerId: 1 });
    expect(onTaskChange).not.toHaveBeenCalled();
  });
});

describe("Gantt customization", () => {
  it("renders extra columns and a custom name header", () => {
    render(
      <Gantt
        tasks={tasks}
        today="2026-03-10"
        nameHeader="Work item"
        columns={[{ key: "owner", header: "Owner", width: 80, render: (t) => (t.id === "a" ? "Sam" : "") }]}
      />
    );
    expect(screen.getByText("Work item")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
  });

  it("renders milestones as diamonds and only allows moving them", () => {
    const onTaskChange = vi.fn();
    const ms: GanttTask[] = [{ id: "m", name: "Go live", start: "2026-03-10", end: "2026-03-30", type: "milestone" }];
    render(<Gantt tasks={ms} today="2026-03-10" onTaskChange={onTaskChange} />);
    const bar = screen.getByRole("button", { name: /^Go live/ });
    expect(bar).toHaveAttribute("data-milestone", "true");
    expect(bar).toHaveAttribute("data-end", "2026-03-10");
    expect(screen.queryByTestId("gantt-handle-end")).toBeNull();
    fireEvent.keyDown(bar, { key: "ArrowRight", shiftKey: true });
    expect(onTaskChange).toHaveBeenLastCalledWith("m", { start: "2026-03-11", end: "2026-03-11" });
  });

  it("colors bars from task.color, then getBarColor", () => {
    render(<Gantt tasks={[{ ...tasks[1]!, color: "rgb(1, 2, 3)" }, tasks[2]!]} today="2026-03-10" getBarColor={() => "rgb(9, 9, 9)"} />);
    expect(screen.getByRole("button", { name: /^Design/ })).toHaveStyle({ background: "rgb(1, 2, 3)" });
    expect(screen.getByRole("button", { name: /^Build/ })).toHaveStyle({ background: "rgb(9, 9, 9)" });
  });

  it("isTaskEditable locks individual tasks", () => {
    const onTaskChange = vi.fn();
    render(<Gantt tasks={tasks} today="2026-03-10" onTaskChange={onTaskChange} isTaskEditable={(t) => t.id !== "b"} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /^Build/ }), { key: "ArrowRight" });
    expect(onTaskChange).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("button", { name: /^Design/ }), { key: "ArrowRight" });
    expect(onTaskChange).toHaveBeenCalledTimes(1);
  });

  it("snapDays applies to keyboard and pointer moves", () => {
    const onTaskChange = vi.fn();
    render(<Gantt tasks={tasks} dayWidth={30} snapDays={7} today="2026-03-10" onTaskChange={onTaskChange} />);
    const bar = screen.getByRole("button", { name: /^Ship/ });
    fireEvent.keyDown(bar, { key: "ArrowLeft" });
    expect(onTaskChange).toHaveBeenLastCalledWith("c", { start: "2026-03-16", end: "2026-03-16" });
    fireEvent.pointerDown(bar, { clientX: 0, button: 0, pointerId: 1 });
    fireEvent.pointerMove(bar, { clientX: 150, pointerId: 1 }); // 5 days -> rounds to 7
    fireEvent.pointerUp(bar, { clientX: 150, pointerId: 1 });
    expect(onTaskChange).toHaveBeenLastCalledWith("c", { start: "2026-03-30", end: "2026-03-30" });
  });

  it("can hide dependencies, the today line, and start collapsed", () => {
    render(<Gantt tasks={tasks} today="2026-03-10" showDependencies={false} showToday={false} defaultCollapsed={["p"]} />);
    expect(screen.queryAllByTestId("gantt-dependency")).toHaveLength(0);
    expect(screen.queryByTestId("gantt-today")).toBeNull();
    expect(screen.getAllByTestId("gantt-row")).toHaveLength(2);
  });

  it("honors an explicit range and weekendDays", () => {
    const { container } = render(<Gantt tasks={[tasks[3]!]} today="2026-03-10" range={{ start: "2026-03-01", end: "2026-03-31" }} dayWidth={20} weekendDays={[]} />);
    const cells = container.querySelectorAll('[data-weekend="true"]');
    expect(cells).toHaveLength(0);
    expect(screen.getByText("Mar 2026")).toBeInTheDocument();
  });

  it("customizes bar labels", () => {
    render(<Gantt tasks={tasks} dayWidth={40} today="2026-03-10" renderBarLabel={(t) => `#${t.id}`} />);
    expect(screen.getByText("#b")).toBeInTheDocument();
  });
});
