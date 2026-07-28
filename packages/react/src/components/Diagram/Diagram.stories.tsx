import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Diagram } from "./Diagram";
import { InteractiveDiagram } from "./Diagram.interactive";
import type { DiagramEdge, DiagramNode } from "./types";

const meta: Meta<typeof Diagram> = {
  title: "Components/Diagram",
  component: Diagram
};

export default meta;
type Story = StoryObj<typeof Diagram>;

const flowNodes: DiagramNode[] = [
  { id: "start", x: 60, y: 100, label: "Start" },
  { id: "validate", x: 260, y: 40, label: "Validate input" },
  { id: "process", x: 260, y: 160, label: "Process" },
  { id: "error", x: 460, y: 40, label: "Show error" },
  { id: "end", x: 460, y: 160, label: "End", shape: "circle" }
];

const flowEdges: DiagramEdge[] = [
  { id: "e1", source: "start", target: "validate" },
  { id: "e2", source: "start", target: "process" },
  { id: "e3", source: "validate", target: "error", label: "invalid" },
  { id: "e4", source: "process", target: "end", label: "done" }
];

export const StaticSimpleFlow: Story = {
  render: () => <Diagram nodes={flowNodes} edges={flowEdges} width={600} height={260} />
};

const curvedPairNodes: DiagramNode[] = [
  { id: "a", x: 80, y: 120, label: "Service A" },
  { id: "b", x: 400, y: 120, label: "Service B" }
];

const curvedPairEdges: DiagramEdge[] = [
  { id: "req", source: "a", target: "b", label: "request", style: "curved" },
  { id: "res", source: "b", target: "a", label: "response", style: "curved" },
  { id: "retry", source: "a", target: "b", label: "retry", style: "curved" }
];

export const StaticWithCurvedEdges: Story = {
  render: () => <Diagram nodes={curvedPairNodes} edges={curvedPairEdges} width={500} height={260} />
};

export const InteractiveWithPanZoom: Story = {
  render: () => (
    <InteractiveDiagram nodes={flowNodes} edges={flowEdges} width={600} height={320} />
  )
};

export const InteractiveNodeSelection: Story = {
  render: () => {
    function Demo() {
      const [selectedLabel, setSelectedLabel] = useState<string>("(none)");
      return (
        <div>
          <p>Selected node: {selectedLabel}</p>
          <InteractiveDiagram
            nodes={flowNodes}
            edges={flowEdges}
            width={600}
            height={320}
            onNodeClick={(node) => setSelectedLabel(String(node.label))}
            onCanvasClick={() => setSelectedLabel("(none)")}
          />
        </div>
      );
    }
    return <Demo />;
  }
};

const shapeNodes: DiagramNode[] = [
  { id: "rect", x: 80, y: 80, label: "Rectangle", shape: "rectangle" },
  { id: "circle", x: 300, y: 80, label: "Circle", shape: "circle" },
  { id: "diamond", x: 520, y: 80, label: "Diamond?", shape: "diamond" }
];

const shapeEdges: DiagramEdge[] = [
  { id: "e1", source: "rect", target: "circle" },
  { id: "e2", source: "circle", target: "diamond" }
];

export const DifferentShapes: Story = {
  render: () => <Diagram nodes={shapeNodes} edges={shapeEdges} width={640} height={200} />
};

// 36 nodes in a 6x6 grid, each connected to its right and down neighbor (~60 edges). Renders
// via plain (non-virtualized) SVG, same "check scale before adding windowing" question phase 1
// asked of KanbanBoard — see CLAUDE.md "Recent context" for the measured finding at this size.
const GRID_SIZE = 6;
const largeGraphNodes: DiagramNode[] = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
  const row = Math.floor(i / GRID_SIZE);
  const col = i % GRID_SIZE;
  return {
    id: `n${i}`,
    x: 80 + col * 130,
    y: 60 + row * 110,
    label: `Node ${i}`
  };
});
const largeGraphEdges: DiagramEdge[] = [];
for (let row = 0; row < GRID_SIZE; row++) {
  for (let col = 0; col < GRID_SIZE; col++) {
    const i = row * GRID_SIZE + col;
    if (col < GRID_SIZE - 1) {
      largeGraphEdges.push({ id: `h${i}`, source: `n${i}`, target: `n${i + 1}` });
    }
    if (row < GRID_SIZE - 1) {
      largeGraphEdges.push({ id: `v${i}`, source: `n${i}`, target: `n${i + GRID_SIZE}` });
    }
  }
}

export const LargeGraph: Story = {
  render: () => (
    <InteractiveDiagram nodes={largeGraphNodes} edges={largeGraphEdges} width={800} height={600} />
  )
};

// --- Phase 2: editable stories ---

const editableFlowNodes: DiagramNode[] = [
  { id: "start", x: 60, y: 100, label: "Start" },
  { id: "validate", x: 260, y: 40, label: "Validate input" },
  { id: "process", x: 260, y: 160, label: "Process" },
  { id: "end", x: 460, y: 100, label: "End", shape: "circle" }
];

const editableFlowEdges: DiagramEdge[] = [
  { id: "e1", source: "start", target: "validate" },
  { id: "e2", source: "start", target: "process" },
  { id: "e3", source: "process", target: "end", label: "done" }
];

export const EditableNodeDrag: Story = {
  render: () => {
    function Demo() {
      const [nodes, setNodes] = useState(editableFlowNodes);
      return (
        <div>
          <p>Drag any node — connected edges follow in real time. Click a node without moving it to select instead.</p>
          <InteractiveDiagram
            nodes={nodes}
            edges={editableFlowEdges}
            width={600}
            height={260}
            editable
            onNodesChange={setNodes}
          />
        </div>
      );
    }
    return <Demo />;
  }
};

export const EditableConnectionDrawing: Story = {
  render: () => {
    function Demo() {
      const [edges, setEdges] = useState(editableFlowEdges);
      return (
        <div>
          <p>
            Hover a node to reveal its four connection handles, drag from a handle to another node
            to draw a new edge. Dropping on empty canvas or the same node cancels the draw.
          </p>
          <InteractiveDiagram
            nodes={editableFlowNodes}
            edges={edges}
            width={600}
            height={260}
            editable
            onEdgesChange={setEdges}
          />
        </div>
      );
    }
    return <Demo />;
  }
};

export const EditableWithSnapToGrid: Story = {
  render: () => {
    function Demo() {
      const [nodes, setNodes] = useState(editableFlowNodes);
      return (
        <div>
          <p>Drag or arrow-key-nudge a node — position snaps to a 40px grid during the drag itself.</p>
          <InteractiveDiagram
            nodes={nodes}
            edges={editableFlowEdges}
            width={600}
            height={260}
            editable
            snapToGrid={40}
            onNodesChange={setNodes}
          />
        </div>
      );
    }
    return <Demo />;
  }
};

export const DeleteNodeAndOrphanedEdges: Story = {
  render: () => {
    function Demo() {
      const [nodes, setNodes] = useState(editableFlowNodes);
      const [edges, setEdges] = useState(editableFlowEdges);
      const [lastDeletion, setLastDeletion] = useState<string>("(none yet)");
      return (
        <div>
          <p>
            Focus a node (click it, or Tab to it) and press Delete/Backspace. Deleting a node is
            only reported as intent by Diagram — the consumer removes the node AND the orphaned
            edges together in one update, using the `orphanedEdgeIds` this callback computes.
          </p>
          <p>Last deletion: {lastDeletion}</p>
          <InteractiveDiagram
            nodes={nodes}
            edges={edges}
            width={600}
            height={260}
            editable
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onNodeDelete={(nodeId, orphanedEdgeIds) => {
              setNodes((prev) => prev.filter((n) => n.id !== nodeId));
              setEdges((prev) => prev.filter((e) => !orphanedEdgeIds.includes(e.id)));
              setLastDeletion(`Removed node "${nodeId}" and orphaned edges [${orphanedEdgeIds.join(", ")}]`);
            }}
            onEdgeDelete={(edgeId) => {
              setEdges((prev) => prev.filter((e) => e.id !== edgeId));
              setLastDeletion(`Removed edge "${edgeId}"`);
            }}
          />
        </div>
      );
    }
    return <Demo />;
  }
};

export const KeyboardOnlyEditing: Story = {
  render: () => {
    function Demo() {
      const [nodes, setNodes] = useState(editableFlowNodes);
      const [edges, setEdges] = useState(editableFlowEdges);
      return (
        <div>
          <p>Manual accessibility test — no mouse/pointer required:</p>
          <ul>
            <li>Tab to a node, Arrow keys nudge its position (10px, or snapToGrid&apos;s value).</li>
            <li>
              Press <kbd>C</kbd> to enter connect mode, <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> to
              cycle the prospective target, <kbd>Enter</kbd> to confirm, <kbd>Escape</kbd> to cancel.
            </li>
            <li>
              <kbd>Delete</kbd>/<kbd>Backspace</kbd> on a focused node or edge removes it.
            </li>
          </ul>
          <InteractiveDiagram
            nodes={nodes}
            edges={edges}
            width={600}
            height={260}
            editable
            onNodesChange={setNodes}
            onEdgesChange={setEdges}
            onNodeDelete={(nodeId, orphanedEdgeIds) => {
              setNodes((prev) => prev.filter((n) => n.id !== nodeId));
              setEdges((prev) => prev.filter((e) => !orphanedEdgeIds.includes(e.id)));
            }}
            onEdgeDelete={(edgeId) => setEdges((prev) => prev.filter((e) => e.id !== edgeId))}
          />
        </div>
      );
    }
    return <Demo />;
  }
};
