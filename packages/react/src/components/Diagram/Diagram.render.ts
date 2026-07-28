import { vars } from "@vesture/tokens";
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from "./types";
import type { DiagramEdge, DiagramEdgeStyle, DiagramNode, DiagramNodeShape } from "./types";

/**
 * Fixed-order categorical cycle backing every chart/diagram component. A node/edge index
 * beyond 8 wraps back around to series1 — with more than 8 nodes, colors repeat.
 */
export const SERIES_COLOR_CYCLE: readonly string[] = [
  vars.chart.series1,
  vars.chart.series2,
  vars.chart.series3,
  vars.chart.series4,
  vars.chart.series5,
  vars.chart.series6,
  vars.chart.series7,
  vars.chart.series8
];

export function getNodeColor(node: DiagramNode, index: number): string {
  return node.color ?? SERIES_COLOR_CYCLE[index % SERIES_COLOR_CYCLE.length]!;
}

export function getEdgeColor(edge: DiagramEdge, index: number): string {
  return edge.color ?? SERIES_COLOR_CYCLE[index % SERIES_COLOR_CYCLE.length]!;
}

export interface ResolvedDiagramNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: DiagramNodeShape;
  label: DiagramNode["label"];
  color: string;
}

export function resolveNode(node: DiagramNode, index: number): ResolvedDiagramNode {
  return {
    id: node.id,
    x: node.x,
    y: node.y,
    width: node.width ?? DEFAULT_NODE_WIDTH,
    height: node.height ?? DEFAULT_NODE_HEIGHT,
    shape: node.shape ?? "rectangle",
    label: node.label,
    color: getNodeColor(node, index)
  };
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Point on a node's boundary along the direction from its center toward `(towardX, towardY)`,
 * based on shape — so an edge connects to the correct side of a box/circle/diamond rather than
 * always the center or a fixed point regardless of direction. Degenerates to the center itself
 * when the other node is at the exact same position (zero-length direction).
 */
export function getAnchorPoint(
  node: ResolvedDiagramNode,
  towardX: number,
  towardY: number
): Point {
  const dx = towardX - node.x;
  const dy = towardY - node.y;
  if (dx === 0 && dy === 0) return { x: node.x, y: node.y };

  const hw = node.width / 2;
  const hh = node.height / 2;

  let scale: number;
  if (node.shape === "circle") {
    // Treat width/height as an ellipse's axes; point on the ellipse boundary in direction (dx, dy).
    scale = 1 / Math.sqrt((dx / hw) ** 2 + (dy / hh) ** 2);
  } else if (node.shape === "diamond") {
    // Diamond boundary satisfies |x'/hw| + |y'/hh| = 1 for center-relative (x', y').
    scale = 1 / (Math.abs(dx) / hw + Math.abs(dy) / hh);
  } else {
    // Rectangle: largest t such that |dx*t| <= hw and |dy*t| <= hh.
    const scaleX = dx === 0 ? Infinity : hw / Math.abs(dx);
    const scaleY = dy === 0 ? Infinity : hh / Math.abs(dy);
    scale = Math.min(scaleX, scaleY);
  }

  return { x: node.x + dx * scale, y: node.y + dy * scale };
}

export interface DiagramEdgeLayout {
  id: string;
  source: string;
  target: string;
  label: DiagramEdge["label"];
  color: string;
  style: DiagramEdgeStyle;
  sourceAnchor: Point;
  targetAnchor: Point;
  /** SVG path `d` attribute: a straight line, or a quadratic bezier for curved edges. */
  path: string;
  /** Midpoint of the path, used to position an edge label. */
  labelPosition: Point;
}

const CURVE_SPACING = 24;

function unorderedPairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

/**
 * Quadratic bezier control point offset perpendicular to the straight source->target line, by
 * `offset` pixels — used to visually separate multiple curved edges running between the same
 * (or similarly positioned) pair of nodes.
 */
function curveControlPoint(source: Point, target: Point, offset: number): Point {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return { x: source.x, y: source.y };

  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  // Perpendicular unit vector.
  const normalX = -dy / length;
  const normalY = dx / length;

  return { x: midX + normalX * offset, y: midY + normalY * offset };
}

export function buildEdgePath(
  source: Point,
  target: Point,
  style: DiagramEdgeStyle,
  offset: number
): { path: string; labelPosition: Point } {
  if (style === "curved") {
    const control = curveControlPoint(source, target, offset);
    return {
      path: `M ${source.x} ${source.y} Q ${control.x} ${control.y} ${target.x} ${target.y}`,
      // Point on the quadratic curve at t=0.5.
      labelPosition: {
        x: 0.25 * source.x + 0.5 * control.x + 0.25 * target.x,
        y: 0.25 * source.y + 0.5 * control.y + 0.25 * target.y
      }
    };
  }
  return {
    path: `M ${source.x} ${source.y} L ${target.x} ${target.y}`,
    labelPosition: { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 }
  };
}

export interface DiagramViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const VIEWBOX_PADDING = 40;

export function computeViewBox(nodes: ResolvedDiagramNode[]): DiagramViewBox {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, width: 400, height: 300 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const hw = node.width / 2;
    const hh = node.height / 2;
    minX = Math.min(minX, node.x - hw);
    minY = Math.min(minY, node.y - hh);
    maxX = Math.max(maxX, node.x + hw);
    maxY = Math.max(maxY, node.y + hh);
  }

  return {
    minX: minX - VIEWBOX_PADDING,
    minY: minY - VIEWBOX_PADDING,
    width: maxX - minX + VIEWBOX_PADDING * 2,
    height: maxY - minY + VIEWBOX_PADDING * 2
  };
}

export interface CardinalHandlePoints {
  top: Point;
  right: Point;
  bottom: Point;
  left: Point;
}

/**
 * The four cardinal points on a node's boundary (top/right/bottom/left of its bounding box) —
 * used for connection-drawing handles. The formula is shape-agnostic: a rectangle's bounding-box
 * midpoints, an ellipse's axis endpoints, and a diamond's own vertices are all exactly these same
 * four coordinates, so no shape branching is needed here (unlike `getAnchorPoint`, which anchors
 * along an arbitrary direction rather than these four fixed ones).
 */
export function getCardinalHandlePoints(node: ResolvedDiagramNode): CardinalHandlePoints {
  const hw = node.width / 2;
  const hh = node.height / 2;
  return {
    top: { x: node.x, y: node.y - hh },
    right: { x: node.x + hw, y: node.y },
    bottom: { x: node.x, y: node.y + hh },
    left: { x: node.x - hw, y: node.y }
  };
}

/** Shape-aware point-in-node containment test, used to hit-test a connection drag's drop target. */
export function isPointInNode(node: ResolvedDiagramNode, x: number, y: number): boolean {
  const dx = x - node.x;
  const dy = y - node.y;
  const hw = node.width / 2;
  const hh = node.height / 2;

  if (node.shape === "circle") {
    return (dx / hw) ** 2 + (dy / hh) ** 2 <= 1;
  }
  if (node.shape === "diamond") {
    return Math.abs(dx) / hw + Math.abs(dy) / hh <= 1;
  }
  return Math.abs(dx) <= hw && Math.abs(dy) <= hh;
}

/** First node (in array order, excluding `excludeId`) whose shape contains `(x, y)` — used to
 * find a connection drag's drop target under the pointer. */
export function findNodeAtPoint(
  nodes: ResolvedDiagramNode[],
  x: number,
  y: number,
  excludeId?: string
): ResolvedDiagramNode | undefined {
  return nodes.find((node) => node.id !== excludeId && isPointInNode(node, x, y));
}

/** Ids of every edge touching `nodeId` as either source or target — the set that would be
 * orphaned if `nodeId` were deleted. Diagram itself doesn't own combined nodes+edges state (see
 * `InteractiveDiagramProps.onNodeDelete`'s doc comment), so it reports this set rather than
 * deleting the edges itself. */
export function findConnectedEdgeIds(edges: DiagramEdge[], nodeId: string): string[] {
  return edges.filter((edge) => edge.source === nodeId || edge.target === nodeId).map((edge) => edge.id);
}

export interface DiagramLayout {
  nodes: ResolvedDiagramNode[];
  edgeLayouts: DiagramEdgeLayout[];
  viewBox: DiagramViewBox;
}

/**
 * The shared entry point: given nodes/edges, computes resolved node geometry, per-edge anchor
 * points + path data, and the bounding viewBox once. Both the static `Diagram` and
 * `InteractiveDiagram` call this same function rather than re-deriving geometry independently.
 */
export function buildDiagramLayout(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramLayout {
  const resolvedNodes = nodes.map((n, i) => resolveNode(n, i));
  const nodesById = new Map(resolvedNodes.map((n) => [n.id, n]));

  // Assign each edge an index within its unordered node-pair group, so multiple edges between
  // the same pair (in either direction) fan out symmetrically instead of overlapping.
  const pairCounts = new Map<string, number>();
  const pairSizes = new Map<string, number>();
  for (const edge of edges) {
    const key = unorderedPairKey(edge.source, edge.target);
    pairSizes.set(key, (pairSizes.get(key) ?? 0) + 1);
  }

  const edgeLayouts: DiagramEdgeLayout[] = [];
  edges.forEach((edge, index) => {
    const sourceNode = nodesById.get(edge.source);
    const targetNode = nodesById.get(edge.target);
    if (!sourceNode || !targetNode) return;

    const key = unorderedPairKey(edge.source, edge.target);
    const indexInPair = pairCounts.get(key) ?? 0;
    pairCounts.set(key, indexInPair + 1);
    const sizeInPair = pairSizes.get(key) ?? 1;
    const offset = (indexInPair - (sizeInPair - 1) / 2) * CURVE_SPACING;

    const sourceAnchor = getAnchorPoint(sourceNode, targetNode.x, targetNode.y);
    const targetAnchor = getAnchorPoint(targetNode, sourceNode.x, sourceNode.y);
    const style = edge.style ?? "straight";
    const { path, labelPosition } = buildEdgePath(sourceAnchor, targetAnchor, style, offset);

    edgeLayouts.push({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      color: getEdgeColor(edge, index),
      style,
      sourceAnchor,
      targetAnchor,
      path,
      labelPosition
    });
  });

  return { nodes: resolvedNodes, edgeLayouts, viewBox: computeViewBox(resolvedNodes) };
}
