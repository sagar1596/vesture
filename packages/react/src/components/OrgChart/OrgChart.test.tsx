import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrgChart } from "./OrgChart";
import { collectParentIds, computeOrgLayout } from "./org-layout";
import type { OrgNodeData } from "./org-layout";

const tree: OrgNodeData = {
  id: "ceo",
  name: "Ada Lovelace",
  title: "CEO",
  children: [
    { id: "cto", name: "Grace Hopper", title: "CTO", children: [{ id: "dev1", name: "Linus T" }, { id: "dev2", name: "Ken T" }] },
    { id: "cfo", name: "Warren B", title: "CFO" }
  ]
};
const opts = { nodeWidth: 100, nodeHeight: 40, gapX: 20, gapY: 30, orientation: "vertical" as const, edgeStyle: "elbow" as const };

describe("computeOrgLayout", () => {
  it("centers a parent over its children", () => {
    const { nodes } = computeOrgLayout([tree], new Set(), opts);
    const x = Object.fromEntries(nodes.map((n) => [n.id, n.x]));
    expect(x.dev1).toBe(0);
    expect(x.dev2).toBe(120);
    expect(x.cto).toBe(60);
    expect(x.cfo).toBe(240);
    expect(x.ceo).toBe((60 + 240) / 2);
  });
  it("puts levels on y vertically and on x horizontally", () => {
    const v = computeOrgLayout([tree], new Set(), opts).nodes.find((n) => n.id === "dev1")!;
    expect(v.y).toBe(2 * 70);
    const h = computeOrgLayout([tree], new Set(), { ...opts, orientation: "horizontal" }).nodes.find((n) => n.id === "dev1")!;
    expect(h.x).toBe(2 * 120);
  });
  it("hides descendants of collapsed nodes", () => {
    const { nodes, edges } = computeOrgLayout([tree], new Set(["cto"]), opts);
    expect(nodes.map((n) => n.id).sort()).toEqual(["ceo", "cfo", "cto"]);
    expect(edges).toHaveLength(2);
    expect(nodes.find((n) => n.id === "cto")!.collapsed).toBe(true);
  });
  it("supports a forest and every edge style", () => {
    const forest = [tree, { id: "x", name: "X" }];
    expect(computeOrgLayout(forest, new Set(), opts).nodes).toHaveLength(6);
    for (const edgeStyle of ["elbow", "curve", "straight"] as const) {
      expect(computeOrgLayout([tree], new Set(), { ...opts, edgeStyle }).edges[0]!.path).toMatch(/^M/);
    }
  });
  it("lists parent ids", () => {
    expect(collectParentIds([tree])).toEqual(["ceo", "cto"]);
  });
});

describe("OrgChart", () => {
  it("renders a card per visible node plus edges", () => {
    render(<OrgChart data={tree} />);
    expect(screen.getAllByTestId("orgchart-node")).toHaveLength(5);
    expect(screen.getAllByTestId("orgchart-edge")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Grace Hopper, CTO" })).toBeInTheDocument();
  });
  it("collapses and expands a branch (uncontrolled)", () => {
    render(<OrgChart data={tree} />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse Grace Hopper" }));
    expect(screen.getAllByTestId("orgchart-node")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Expand Grace Hopper" }));
    expect(screen.getAllByTestId("orgchart-node")).toHaveLength(5);
  });
  it("is controllable through collapsedIds", () => {
    const onCollapsedChange = vi.fn();
    render(<OrgChart data={tree} collapsedIds={["ceo"]} onCollapsedChange={onCollapsedChange} />);
    expect(screen.getAllByTestId("orgchart-node")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Expand Ada Lovelace" }));
    expect(onCollapsedChange).toHaveBeenCalledWith([]);
    expect(screen.getAllByTestId("orgchart-node")).toHaveLength(1);
  });
  it("collapse all / expand all", () => {
    render(<OrgChart data={tree} />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.getAllByTestId("orgchart-node")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getAllByTestId("orgchart-node")).toHaveLength(5);
  });
  it("supports custom nodes, click, selection, and hiding toggles", () => {
    const onNodeClick = vi.fn();
    render(
      <OrgChart
        data={tree}
        collapsible={false}
        selectedId="cfo"
        onNodeClick={onNodeClick}
        renderNode={(n) => <strong data-testid="custom">{n.name.toUpperCase()}</strong>}
      />
    );
    expect(screen.getAllByTestId("custom")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: /Collapse Grace/ })).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: /Warren B/ })[0]!);
    expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({ id: "cfo" }));
    expect(screen.getAllByTestId("orgchart-node").find((n) => n.getAttribute("aria-selected") === "true")).toBeTruthy();
  });
  it("navigates with arrow keys", () => {
    render(<OrgChart data={tree} />);
    const ceo = screen.getByRole("button", { name: "Ada Lovelace, CEO" });
    ceo.focus();
    fireEvent.keyDown(ceo, { key: "ArrowDown" });
    expect(screen.getByRole("button", { name: "Grace Hopper, CTO" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Warren B, CFO" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
    expect(ceo).toHaveFocus();
  });
  it("applies zoom as a transform", () => {
    render(<OrgChart data={tree} defaultZoom={0.5} />);
    expect(screen.getByTestId("orgchart-canvas").style.transform).toBe("scale(0.5)");
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByTestId("orgchart-canvas").style.transform).toBe("scale(0.6)");
  });
});
