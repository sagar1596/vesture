import type { ReactElement } from "react";
import { buildDiagramLayout } from "./Diagram.render";
import {
  arrowMarkerPath,
  edgeLabel,
  edgeLabelBackground,
  edgePath,
  emptyState,
  nodeLabel,
  nodeShape,
  root
} from "./Diagram.css";
import type { DiagramBaseProps } from "./types";
import type { DiagramEdgeLayout, ResolvedDiagramNode } from "./Diagram.render";

export interface DiagramProps extends DiagramBaseProps {
  /** Defaults to 600. */
  width?: number;
  /** Defaults to 400. */
  height?: number;
}

const ARROW_MARKER_ID = "vesture-diagram-arrow";
const EDGE_LABEL_WIDTH = 80;
const EDGE_LABEL_HEIGHT = 20;

function NodeShape({ node }: { node: ResolvedDiagramNode }): ReactElement {
  const hw = node.width / 2;
  const hh = node.height / 2;

  if (node.shape === "circle") {
    return (
      <ellipse
        className={nodeShape}
        cx={node.x}
        cy={node.y}
        rx={hw}
        ry={hh}
        stroke={node.color}
        data-node-id={node.id}
      />
    );
  }

  if (node.shape === "diamond") {
    const points = [
      `${node.x},${node.y - hh}`,
      `${node.x + hw},${node.y}`,
      `${node.x},${node.y + hh}`,
      `${node.x - hw},${node.y}`
    ].join(" ");
    return (
      <polygon className={nodeShape} points={points} stroke={node.color} data-node-id={node.id} />
    );
  }

  return (
    <rect
      className={nodeShape}
      x={node.x - hw}
      y={node.y - hh}
      width={node.width}
      height={node.height}
      stroke={node.color}
      data-node-id={node.id}
    />
  );
}

function EdgeLine({ edge }: { edge: DiagramEdgeLayout }): ReactElement {
  return (
    <>
      <path
        className={edgePath}
        d={edge.path}
        stroke={edge.color}
        markerEnd={`url(#${ARROW_MARKER_ID})`}
        data-edge-id={edge.id}
      />
      {edge.label ? (
        <foreignObject
          x={edge.labelPosition.x - EDGE_LABEL_WIDTH / 2}
          y={edge.labelPosition.y - EDGE_LABEL_HEIGHT / 2}
          width={EDGE_LABEL_WIDTH}
          height={EDGE_LABEL_HEIGHT}
        >
          <div className={edgeLabelBackground} style={{ display: "flex", justifyContent: "center" }}>
            <span className={edgeLabel}>{edge.label}</span>
          </div>
        </foreignObject>
      ) : null}
    </>
  );
}

/**
 * Server-safe, zero-JS diagram renderer. Renders static SVG (nodes as rect/ellipse/polygon,
 * edges as paths with arrowheads) with no event handlers, no pan/zoom — use it in server
 * components, static previews, or documentation. For click selection and pan/zoom, use
 * `InteractiveDiagram` instead (it wraps this component and requires client-side JS).
 *
 * Node/edge labels render via `<foreignObject>` so they can contain arbitrary React content,
 * not just SVG text. Support is excellent in all modern browsers, but worth knowing if a
 * consumer needs to export this diagram as a rasterized image via `<canvas>` — `foreignObject`
 * has cross-browser serialization quirks in that specific scenario (e.g. Safari's handling of
 * `canvas.drawImage` on an SVG data URL containing foreignObject content).
 */
export function Diagram({ nodes, edges, width = 600, height = 400 }: DiagramProps): ReactElement {
  if (nodes.length === 0) {
    return (
      <div className={root} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const { nodes: resolvedNodes, edgeLayouts, viewBox } = buildDiagramLayout(nodes, edges);

  return (
    <div className={root}>
      <svg
        width={width}
        height={height}
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        role="img"
        aria-label="Diagram"
      >
        <defs>
          <marker
            id={ARROW_MARKER_ID}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path className={arrowMarkerPath} d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        {edgeLayouts.map((edge) => (
          <EdgeLine key={edge.id} edge={edge} />
        ))}
        {resolvedNodes.map((node) => (
          <g key={node.id}>
            <NodeShape node={node} />
            <foreignObject
              x={node.x - node.width / 2}
              y={node.y - node.height / 2}
              width={node.width}
              height={node.height}
            >
              <div className={nodeLabel}>{node.label}</div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  );
}
