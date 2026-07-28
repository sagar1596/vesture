import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Diagram } from "./Diagram";
import { InteractiveDiagram } from "./Diagram.interactive";
import { buildDiagramLayout, getAnchorPoint } from "./Diagram.render";
import type { ResolvedDiagramNode } from "./Diagram.render";
import type { DiagramEdge, DiagramNode } from "./types";

const nodes: DiagramNode[] = [
  { id: "a", x: 0, y: 0, label: "A" },
  { id: "b", x: 200, y: 0, label: "B" },
  { id: "c", x: 200, y: 200, label: "C", shape: "circle" }
];

const edges: DiagramEdge[] = [
  { id: "ab", source: "a", target: "b" },
  { id: "bc", source: "b", target: "c" }
];

function makeNode(overrides: Partial<ResolvedDiagramNode>): ResolvedDiagramNode {
  return {
    id: "n",
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    shape: "rectangle",
    label: "N",
    color: "#000",
    ...overrides
  };
}

describe("Diagram (static)", () => {
  it("renders one shape element per node and one path per edge", () => {
    const { container } = render(<Diagram nodes={nodes} edges={edges} width={600} height={400} />);
    // rect for "a" and "b" (rectangle default), ellipse for "c" (circle shape).
    expect(container.querySelectorAll("rect[data-node-id]")).toHaveLength(2);
    expect(container.querySelectorAll("ellipse[data-node-id]")).toHaveLength(1);
    expect(container.querySelectorAll("path[data-edge-id]")).toHaveLength(2);
  });

  it("renders a diamond as a polygon", () => {
    const diamondNodes: DiagramNode[] = [{ id: "d", x: 0, y: 0, label: "D", shape: "diamond" }];
    const { container } = render(<Diagram nodes={diamondNodes} edges={[]} width={300} height={200} />);
    expect(container.querySelector("polygon[data-node-id]")).not.toBeNull();
  });

  it("renders the empty state instead of an svg when there are no nodes", () => {
    const { container } = render(<Diagram nodes={[]} edges={[]} width={400} height={200} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("has no \"use client\" directive and no hooks (server-safe)", () => {
    const source = readFileSync(join(import.meta.dirname, "Diagram.tsx"), "utf-8");
    expect(source).not.toMatch(/use client/);
    expect(source).not.toMatch(/\buse(State|Effect|Ref|Memo|Callback)\b/);
  });
});

describe("getAnchorPoint", () => {
  it("connects to the top/bottom side when the other node is directly above/below (rectangle)", () => {
    const node = makeNode({ x: 100, y: 100, width: 100, height: 50 });
    const above = getAnchorPoint(node, 100, -100);
    expect(above.y).toBeCloseTo(75); // top edge: y - height/2
    expect(above.x).toBeCloseTo(100);

    const below = getAnchorPoint(node, 100, 300);
    expect(below.y).toBeCloseTo(125); // bottom edge: y + height/2
    expect(below.x).toBeCloseTo(100);
  });

  it("connects to the left/right side when the other node is to the left/right (rectangle)", () => {
    const node = makeNode({ x: 100, y: 100, width: 100, height: 50 });
    const right = getAnchorPoint(node, 400, 100);
    expect(right.x).toBeCloseTo(150); // right edge: x + width/2
    expect(right.y).toBeCloseTo(100);

    const left = getAnchorPoint(node, -200, 100);
    expect(left.x).toBeCloseTo(50); // left edge: x - width/2
    expect(left.y).toBeCloseTo(100);
  });

  it("does not always default to the center regardless of direction", () => {
    const node = makeNode({ x: 0, y: 0, width: 100, height: 50 });
    const toRight = getAnchorPoint(node, 500, 0);
    const toBelow = getAnchorPoint(node, 0, 500);
    expect(toRight).not.toEqual({ x: 0, y: 0 });
    expect(toBelow).not.toEqual({ x: 0, y: 0 });
    expect(toRight).not.toEqual(toBelow);
  });

  it("places circle anchors on the ellipse boundary, not the bounding box corner", () => {
    const node = makeNode({ x: 0, y: 0, width: 100, height: 100, shape: "circle" });
    const diagonal = getAnchorPoint(node, 100, 100);
    // On a circle of radius 50, the 45-degree point is (35.35, 35.35), not the box corner (50, 50).
    expect(diagonal.x).toBeCloseTo(35.36, 1);
    expect(diagonal.y).toBeCloseTo(35.36, 1);
  });
});

describe("buildDiagramLayout edge paths", () => {
  it("produces different path data for curved vs. straight edges between the same node pair", () => {
    const pairNodes: DiagramNode[] = [
      { id: "a", x: 0, y: 0, label: "A" },
      { id: "b", x: 200, y: 0, label: "B" }
    ];
    const straightLayout = buildDiagramLayout(pairNodes, [
      { id: "e", source: "a", target: "b", style: "straight" }
    ]);
    const curvedLayout = buildDiagramLayout(pairNodes, [
      { id: "e", source: "a", target: "b", style: "curved" }
    ]);
    expect(straightLayout.edgeLayouts[0]!.path).not.toBe(curvedLayout.edgeLayouts[0]!.path);
    expect(straightLayout.edgeLayouts[0]!.path).toContain(" L ");
    expect(curvedLayout.edgeLayouts[0]!.path).toContain(" Q ");
  });
});

describe("InteractiveDiagram", () => {
  it('declares "use client" (unlike the static Diagram)', () => {
    const source = readFileSync(join(import.meta.dirname, "Diagram.interactive.tsx"), "utf-8");
    expect(source).toMatch(/^"use client";/);
  });

  it("updates the transform group's translate on a pan drag", () => {
    const { getByTestId } = render(<InteractiveDiagram nodes={nodes} edges={edges} width={600} height={400} />);
    const canvasEl = getByTestId("diagram-canvas");
    const group = getByTestId("diagram-transform-group");
    const before = group.getAttribute("transform");

    fireEvent.pointerDown(canvasEl, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canvasEl, { pointerId: 1, clientX: 150, clientY: 130 });
    fireEvent.pointerUp(canvasEl, { pointerId: 1, clientX: 150, clientY: 130 });

    expect(group.getAttribute("transform")).not.toBe(before);
  });

  it("respects min/max zoom bounds on repeated wheel zoom", () => {
    const { getByTestId } = render(<InteractiveDiagram nodes={nodes} edges={edges} width={600} height={400} />);
    const svg = getByTestId("diagram-transform-group").closest("svg")!;
    const group = getByTestId("diagram-transform-group");

    for (let i = 0; i < 60; i++) {
      fireEvent.wheel(svg, { deltaY: -100, clientX: 300, clientY: 200 });
    }
    let scale = Number(group.getAttribute("transform")!.match(/scale\(([^)]+)\)/)![1]);
    expect(scale).toBeLessThanOrEqual(4);

    for (let i = 0; i < 120; i++) {
      fireEvent.wheel(svg, { deltaY: 100, clientX: 300, clientY: 200 });
    }
    scale = Number(group.getAttribute("transform")!.match(/scale\(([^)]+)\)/)![1]);
    expect(scale).toBeGreaterThanOrEqual(0.25);
  });

  it("fires onNodeClick when a node is clicked, and does not fire onCanvasClick", () => {
    const onNodeClick = vi.fn();
    const onCanvasClick = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        onNodeClick={onNodeClick}
        onCanvasClick={onCanvasClick}
      />
    );

    fireEvent.click(getByTestId("diagram-node-a"));

    expect(onNodeClick).toHaveBeenCalledTimes(1);
    expect(onNodeClick).toHaveBeenCalledWith(nodes[0]);
    expect(onCanvasClick).not.toHaveBeenCalled();
  });

  it("fires onCanvasClick (and clears selection) on an empty-canvas click, not onNodeClick", () => {
    const onNodeClick = vi.fn();
    const onCanvasClick = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        onNodeClick={onNodeClick}
        onCanvasClick={onCanvasClick}
      />
    );

    const canvasEl = getByTestId("diagram-canvas");
    fireEvent.pointerDown(canvasEl, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(canvasEl, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(onCanvasClick).toHaveBeenCalledTimes(1);
    expect(onNodeClick).not.toHaveBeenCalled();
  });

  it("editable=false renders no connection handles even on hover (phase 1 behavior unchanged)", () => {
    const { getByTestId, container } = render(
      <InteractiveDiagram nodes={nodes} edges={edges} width={600} height={400} />
    );
    fireEvent.pointerEnter(getByTestId("diagram-node-a"));
    expect(container.querySelectorAll("circle[data-handle]")).toHaveLength(0);
  });
});

function readTransform(el: Element): { tx: number; ty: number; scale: number } {
  const value = el.getAttribute("transform")!;
  const [, tx, ty] = value.match(/translate\(([^ ]+) ([^)]+)\)/)!;
  const [, scale] = value.match(/scale\(([^)]+)\)/)!;
  return { tx: Number(tx), ty: Number(ty), scale: Number(scale) };
}

describe("InteractiveDiagram (editable)", () => {
  it("dragging a node fires onNodesChange with the correct new position", () => {
    const onNodesChange = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        editable
        onNodesChange={onNodesChange}
      />
    );
    const { scale } = readTransform(getByTestId("diagram-transform-group"));
    const nodeEl = getByTestId("diagram-node-a");

    fireEvent.pointerDown(nodeEl, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(nodeEl, { pointerId: 1, clientX: 150, clientY: 140 });
    fireEvent.pointerUp(nodeEl, { pointerId: 1, clientX: 150, clientY: 140 });

    expect(onNodesChange).toHaveBeenCalledTimes(1);
    const updatedA = onNodesChange.mock.calls[0]![0].find((n: DiagramNode) => n.id === "a")!;
    expect(updatedA.x).toBeCloseTo(nodes[0]!.x + 50 / scale, 1);
    expect(updatedA.y).toBeCloseTo(nodes[0]!.y + 40 / scale, 1);
  });

  it("snaps a dragged node's position to snapToGrid during the drag", () => {
    const onNodesChange = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        editable
        snapToGrid={50}
        onNodesChange={onNodesChange}
      />
    );
    const nodeEl = getByTestId("diagram-node-a");

    fireEvent.pointerDown(nodeEl, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(nodeEl, { pointerId: 1, clientX: 43, clientY: 12 });
    fireEvent.pointerUp(nodeEl, { pointerId: 1, clientX: 43, clientY: 12 });

    const updatedA = onNodesChange.mock.calls[0]![0].find((n: DiagramNode) => n.id === "a")!;
    expect(updatedA.x % 50).toBe(0);
    expect(updatedA.y % 50).toBe(0);
  });

  it("a drag that doesn't move fires onNodeClick, not onNodesChange", () => {
    const onNodeClick = vi.fn();
    const onNodesChange = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        editable
        onNodeClick={onNodeClick}
        onNodesChange={onNodesChange}
      />
    );
    const nodeEl = getByTestId("diagram-node-a");

    fireEvent.pointerDown(nodeEl, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(nodeEl, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.click(nodeEl);

    expect(onNodesChange).not.toHaveBeenCalled();
    expect(onNodeClick).toHaveBeenCalledTimes(1);
  });

  it("drawing a connection from a handle to a valid target fires onEdgesChange with the new edge", () => {
    const onEdgesChange = vi.fn();
    const { getByTestId, container } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        editable
        onEdgesChange={onEdgesChange}
      />
    );
    fireEvent.pointerEnter(getByTestId("diagram-node-a"));
    const handle = container.querySelector('circle[data-handle="right"][data-node-id="a"]')!;
    const { tx, ty, scale } = readTransform(getByTestId("diagram-transform-group"));
    // Node "b" is at world (200, 0); jsdom's getBoundingClientRect is all-zero, so
    // clientX/Y = tx/ty + worldX/Y * scale lands the pointer exactly on its center.
    const targetClientX = tx + nodes[1]!.x * scale;
    const targetClientY = ty + nodes[1]!.y * scale;

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: targetClientX, clientY: targetClientY });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: targetClientX, clientY: targetClientY });

    expect(onEdgesChange).toHaveBeenCalledTimes(1);
    const newEdges: DiagramEdge[] = onEdgesChange.mock.calls[0]![0];
    expect(newEdges).toHaveLength(edges.length + 1);
    const newEdge = newEdges[newEdges.length - 1]!;
    expect(newEdge.source).toBe("a");
    expect(newEdge.target).toBe("b");
  });

  it("cancels the connection draw without firing onEdgesChange when released over empty canvas", () => {
    const onEdgesChange = vi.fn();
    const { getByTestId, container } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        editable
        onEdgesChange={onEdgesChange}
      />
    );
    fireEvent.pointerEnter(getByTestId("diagram-node-a"));
    const handle = container.querySelector('circle[data-handle="right"][data-node-id="a"]')!;

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 5000, clientY: 5000 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientX: 5000, clientY: 5000 });

    expect(onEdgesChange).not.toHaveBeenCalled();
  });

  it("Delete on a focused node fires onNodeDelete with the correctly computed orphanedEdgeIds", () => {
    const onNodeDelete = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        editable
        onNodeDelete={onNodeDelete}
      />
    );
    // Node "b" touches both edges ("ab" and "bc").
    fireEvent.keyDown(getByTestId("diagram-node-b"), { key: "Delete" });

    expect(onNodeDelete).toHaveBeenCalledTimes(1);
    const [nodeId, orphanedEdgeIds] = onNodeDelete.mock.calls[0] as [string, string[]];
    expect(nodeId).toBe("b");
    expect(orphanedEdgeIds.slice().sort()).toEqual(["ab", "bc"]);
  });

  it("Delete on a focused edge fires onEdgeDelete", () => {
    const onEdgeDelete = vi.fn();
    const { container } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        editable
        onEdgeDelete={onEdgeDelete}
      />
    );
    const edgeEl = container.querySelector('path[data-edge-id="ab"]')!;
    fireEvent.keyDown(edgeEl, { key: "Delete" });
    expect(onEdgeDelete).toHaveBeenCalledWith("ab");
  });

  it("arrow-key nudge moves a focused node by the default step", () => {
    const onNodesChange = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram nodes={nodes} edges={edges} width={600} height={400} editable onNodesChange={onNodesChange} />
    );
    fireEvent.keyDown(getByTestId("diagram-node-a"), { key: "ArrowRight" });

    const updatedA = onNodesChange.mock.calls[0]![0].find((n: DiagramNode) => n.id === "a")!;
    expect(updatedA.x).toBe(nodes[0]!.x + 10);
    expect(updatedA.y).toBe(nodes[0]!.y);
  });

  it("arrow-key nudge uses snapToGrid's value as the step when set", () => {
    const onNodesChange = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram
        nodes={nodes}
        edges={edges}
        width={600}
        height={400}
        editable
        snapToGrid={25}
        onNodesChange={onNodesChange}
      />
    );
    fireEvent.keyDown(getByTestId("diagram-node-a"), { key: "ArrowDown" });

    const updatedA = onNodesChange.mock.calls[0]![0].find((n: DiagramNode) => n.id === "a")!;
    expect(updatedA.y).toBe(nodes[0]!.y + 25);
  });

  it("the 'c' key enters connect mode; Tab cycles targets and Enter confirms the connection", () => {
    const onEdgesChange = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram nodes={nodes} edges={edges} width={600} height={400} editable onEdgesChange={onEdgesChange} />
    );
    const nodeA = getByTestId("diagram-node-a");
    fireEvent.keyDown(nodeA, { key: "c" });
    fireEvent.keyDown(nodeA, { key: "Tab" });
    fireEvent.keyDown(nodeA, { key: "Enter" });

    expect(onEdgesChange).toHaveBeenCalledTimes(1);
    const newEdges: DiagramEdge[] = onEdgesChange.mock.calls[0]![0];
    const newEdge = newEdges[newEdges.length - 1]!;
    expect(newEdge.source).toBe("a");
    // candidateIds = ["b", "c"] (every other node); one Tab from index 0 lands on "c".
    expect(newEdge.target).toBe("c");
  });

  it("Escape cancels connect mode without creating an edge", () => {
    const onEdgesChange = vi.fn();
    const { getByTestId } = render(
      <InteractiveDiagram nodes={nodes} edges={edges} width={600} height={400} editable onEdgesChange={onEdgesChange} />
    );
    const nodeA = getByTestId("diagram-node-a");
    fireEvent.keyDown(nodeA, { key: "c" });
    fireEvent.keyDown(nodeA, { key: "Escape" });
    fireEvent.keyDown(nodeA, { key: "Enter" });

    expect(onEdgesChange).not.toHaveBeenCalled();
  });
});
