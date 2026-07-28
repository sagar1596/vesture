import type { ReactNode } from "react";

export type DiagramNodeShape = "rectangle" | "circle" | "diamond";

export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  /** Defaults to 120. */
  width?: number;
  /** Defaults to 48. */
  height?: number;
  /** Defaults to "rectangle". */
  shape?: DiagramNodeShape;
  label: ReactNode;
  /** Overrides the auto-assigned series1-8 token color for this node's fill/border. */
  color?: string;
}

export type DiagramEdgeStyle = "straight" | "curved";

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: ReactNode;
  /** Defaults to "straight". */
  style?: DiagramEdgeStyle;
  /** Overrides the auto-assigned series1-8 token color for this edge's stroke. */
  color?: string;
}

export const DEFAULT_NODE_WIDTH = 120;
export const DEFAULT_NODE_HEIGHT = 48;

/** Props shared by the static `Diagram` and the client-only `InteractiveDiagram`. */
export interface DiagramBaseProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}
