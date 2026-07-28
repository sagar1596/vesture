"use client";

import { useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  WheelEvent as ReactWheelEvent
} from "react";
import {
  buildDiagramLayout,
  findConnectedEdgeIds,
  findNodeAtPoint,
  getAnchorPoint,
  getCardinalHandlePoints
} from "./Diagram.render";
import {
  arrowMarkerPath,
  canvas,
  connectPreviewPath,
  edgeLabel,
  edgeLabelBackground,
  edgePath,
  edgePathInteractive,
  edgeSelectionRing,
  emptyState,
  nodeDropTargetRing,
  nodeHandle,
  nodeLabel,
  nodeSelectionRing,
  nodeShape,
  nodeShapeInteractive,
  root,
  visuallyHidden
} from "./Diagram.css";
import type { DiagramEdgeLayout, ResolvedDiagramNode } from "./Diagram.render";
import type { DiagramBaseProps, DiagramEdge, DiagramNode } from "./types";

export interface InteractiveDiagramProps extends DiagramBaseProps {
  /** Defaults to 600. */
  width?: number;
  /** Defaults to 400. */
  height?: number;
  onNodeClick?: (node: DiagramNode) => void;
  /** Fires when the empty canvas background is clicked (a click that isn't a pan drag and isn't on a node) — also clears selection. */
  onCanvasClick?: () => void;
  /** Enables node dragging, connection drawing, and delete/nudge keyboard shortcuts. Defaults to
   * false — pan/zoom/select-only, byte-identical to phase 1's behavior. */
  editable?: boolean;
  /** Controlled, same philosophy as everywhere else in the library: called with the full updated
   * array after a node drag, a keyboard nudge, or a new connection is drawn — Diagram never
   * mutates `nodes` itself. */
  onNodesChange?: (nodes: DiagramNode[]) => void;
  /** Called after a new connection is drawn (pointer or keyboard). */
  onEdgesChange?: (edges: DiagramEdge[]) => void;
  /** Grid size in pixels: when set, a dragged or keyboard-nudged node's position snaps to the
   * nearest multiple during the drag itself, not just on drop. */
  snapToGrid?: number;
  /** Fires when a focused node is deleted (Delete/Backspace). `orphanedEdgeIds` is every edge
   * that touches this node as source or target — Diagram only reports deletion intent, since it
   * doesn't own combined nodes+edges state; the consumer is responsible for removing both the
   * node (via its own state) and these edges (e.g. by filtering `edges` in the same update that
   * removes the node from `nodes`) so the two stay in sync. */
  onNodeDelete?: (nodeId: string, orphanedEdgeIds: string[]) => void;
  /** Fires when a focused edge is deleted (Delete/Backspace). */
  onEdgeDelete?: (edgeId: string) => void;
}

const ARROW_MARKER_ID = "vesture-diagram-arrow-interactive";
const EDGE_LABEL_WIDTH = 80;
const EDGE_LABEL_HEIGHT = 20;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.1;
/** Pointer movement under this many pixels during a canvas/node pointerdown->up is treated as a click, not a drag. */
const CLICK_DRAG_THRESHOLD = 4;
const FIT_PADDING = 0.9;
/** Arrow-key nudge step in pixels when `snapToGrid` isn't set. */
const DEFAULT_NUDGE_STEP = 10;
const HANDLE_RADIUS = 5;

interface Transform {
  tx: number;
  ty: number;
  scale: number;
}

interface ScreenPoint {
  x: number;
  y: number;
}

function distance(a: ScreenPoint, b: ScreenPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

let edgeIdCounter = 0;
/** `crypto.randomUUID` when available (all real browsers); a counter-based fallback keeps this
 * working in older/test DOM environments that don't implement it. */
function generateEdgeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  edgeIdCounter += 1;
  return `edge-${Date.now()}-${edgeIdCounter}`;
}

interface PanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startTx: number;
  startTy: number;
  moved: boolean;
}

interface PinchState {
  startDistance: number;
  startScale: number;
  /** The pinch midpoint's world-space coordinate, kept fixed under the (moving) screen midpoint as the pinch progresses. */
  worldX: number;
  worldY: number;
}

interface NodeDragState {
  pointerId: number;
  nodeId: string;
  startClientX: number;
  startClientY: number;
  startNodeX: number;
  startNodeY: number;
  currentX: number;
  currentY: number;
  moved: boolean;
}

interface ConnectDrawState {
  pointerId: number;
  sourceNodeId: string;
  /** World-space coordinates (already inverse-transformed), updated on every pointermove. */
  currentX: number;
  currentY: number;
  hoveredTargetId: string | null;
}

interface ConnectModeState {
  sourceNodeId: string;
  targetIndex: number;
  candidateIds: string[];
}

type HandleName = "top" | "right" | "bottom" | "left";
type HandlePointerHandler = (event: ReactPointerEvent<SVGCircleElement>) => void;

function NodeShape({
  node,
  selected,
  isConnectSource,
  isDropTarget,
  showHandles,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onHandlePointerCancel
}: {
  node: ResolvedDiagramNode;
  selected: boolean;
  isConnectSource: boolean;
  isDropTarget: boolean;
  showHandles: boolean;
  onHandlePointerDown: (handle: HandleName) => HandlePointerHandler;
  onHandlePointerMove: HandlePointerHandler;
  onHandlePointerUp: HandlePointerHandler;
  onHandlePointerCancel: HandlePointerHandler;
}): ReactElement {
  const hw = node.width / 2;
  const hh = node.height / 2;
  const className = `${nodeShape} ${nodeShapeInteractive}`;
  const ringPadding = 6;
  const showSelectionRing = (selected || isConnectSource) && !isDropTarget;

  const handles = showHandles ? (
    <>
      {(Object.entries(getCardinalHandlePoints(node)) as [HandleName, { x: number; y: number }][]).map(
        ([handleName, point]) => (
          <circle
            key={handleName}
            className={nodeHandle}
            cx={point.x}
            cy={point.y}
            r={HANDLE_RADIUS}
            data-handle={handleName}
            data-node-id={node.id}
            onPointerDown={onHandlePointerDown(handleName)}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerCancel}
            onClick={(event) => event.stopPropagation()}
          />
        )
      )}
    </>
  ) : null;

  if (node.shape === "circle") {
    return (
      <>
        {isDropTarget ? (
          <ellipse
            className={nodeDropTargetRing}
            cx={node.x}
            cy={node.y}
            rx={hw + ringPadding}
            ry={hh + ringPadding}
            aria-hidden="true"
          />
        ) : showSelectionRing ? (
          <ellipse
            className={nodeSelectionRing}
            cx={node.x}
            cy={node.y}
            rx={hw + ringPadding}
            ry={hh + ringPadding}
            aria-hidden="true"
          />
        ) : null}
        <ellipse
          className={className}
          cx={node.x}
          cy={node.y}
          rx={hw}
          ry={hh}
          stroke={node.color}
          data-node-id={node.id}
          data-selected={selected}
        />
        {handles}
      </>
    );
  }

  if (node.shape === "diamond") {
    const points = [
      `${node.x},${node.y - hh}`,
      `${node.x + hw},${node.y}`,
      `${node.x},${node.y + hh}`,
      `${node.x - hw},${node.y}`
    ].join(" ");
    const ringPoints = [
      `${node.x},${node.y - hh - ringPadding}`,
      `${node.x + hw + ringPadding},${node.y}`,
      `${node.x},${node.y + hh + ringPadding}`,
      `${node.x - hw - ringPadding},${node.y}`
    ].join(" ");
    return (
      <>
        {isDropTarget ? (
          <polygon className={nodeDropTargetRing} points={ringPoints} aria-hidden="true" />
        ) : showSelectionRing ? (
          <polygon className={nodeSelectionRing} points={ringPoints} aria-hidden="true" />
        ) : null}
        <polygon
          className={className}
          points={points}
          stroke={node.color}
          data-node-id={node.id}
          data-selected={selected}
        />
        {handles}
      </>
    );
  }

  return (
    <>
      {isDropTarget ? (
        <rect
          className={nodeDropTargetRing}
          x={node.x - hw - ringPadding}
          y={node.y - hh - ringPadding}
          width={node.width + ringPadding * 2}
          height={node.height + ringPadding * 2}
          aria-hidden="true"
        />
      ) : showSelectionRing ? (
        <rect
          className={nodeSelectionRing}
          x={node.x - hw - ringPadding}
          y={node.y - hh - ringPadding}
          width={node.width + ringPadding * 2}
          height={node.height + ringPadding * 2}
          aria-hidden="true"
        />
      ) : null}
      <rect
        className={className}
        x={node.x - hw}
        y={node.y - hh}
        width={node.width}
        height={node.height}
        stroke={node.color}
        data-node-id={node.id}
        data-selected={selected}
      />
      {handles}
    </>
  );
}

function EdgeLine({
  edge,
  editable,
  selected,
  onEdgeClick,
  onEdgeKeyDown
}: {
  edge: DiagramEdgeLayout;
  editable: boolean;
  selected: boolean;
  onEdgeClick: () => void;
  onEdgeKeyDown: (event: ReactKeyboardEvent<SVGPathElement>) => void;
}): ReactElement {
  return (
    <>
      {selected ? <path className={edgeSelectionRing} d={edge.path} aria-hidden="true" /> : null}
      <path
        className={editable ? `${edgePath} ${edgePathInteractive}` : edgePath}
        d={edge.path}
        stroke={edge.color}
        markerEnd={`url(#${ARROW_MARKER_ID})`}
        data-edge-id={edge.id}
        data-selected={selected || undefined}
        tabIndex={editable ? 0 : undefined}
        role={editable ? "button" : undefined}
        aria-label={editable ? "Edge. Press Delete to remove." : undefined}
        onClick={
          editable
            ? (event) => {
                // Same SVG-focus quirk as node dragging: a click doesn't move DOM focus to a
                // focusable SVG element on its own, so Delete wouldn't fire without this.
                event.currentTarget.focus();
                onEdgeClick();
              }
            : undefined
        }
        onKeyDown={editable ? onEdgeKeyDown : undefined}
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

function computeFitTransform(
  viewBox: { minX: number; minY: number; width: number; height: number },
  width: number,
  height: number
): Transform {
  const scale = clamp(
    Math.min(width / viewBox.width, height / viewBox.height) * FIT_PADDING,
    MIN_ZOOM,
    MAX_ZOOM
  );
  const tx = width / 2 - (viewBox.minX + viewBox.width / 2) * scale;
  const ty = height / 2 - (viewBox.minY + viewBox.height / 2) * scale;
  return { tx, ty, scale };
}

/**
 * Client-rendered diagram for exploring larger graphs: adds click-drag pan on the empty canvas
 * background (not on a node), mouse-wheel/pinch zoom, node click selection with a focus-ring
 * highlight, and — when `editable` is true — node dragging, connection drawing, and delete/nudge
 * keyboard shortcuts (see individual prop docs). Requires client-side JS ("use client") — for
 * static previews or documentation where no interaction is needed, use the static `Diagram`
 * instead.
 *
 * Phase 1's LargeGraph story (36 nodes / ~60 edges) found no rendering-performance issue with a
 * full `buildDiagramLayout` recompute on every pan/zoom frame, so node dragging reuses that same
 * approach here (recomputing the whole layout — including every connected edge's anchor points —
 * on each pointermove) rather than a more complex partial/connected-edges-only update. Revisit
 * only if a future graph is an order of magnitude larger, same threshold `KanbanBoard` used.
 */
export function InteractiveDiagram({
  nodes,
  edges,
  width = 600,
  height = 400,
  onNodeClick,
  onCanvasClick,
  editable = false,
  onNodesChange,
  onEdgesChange,
  snapToGrid,
  onNodeDelete,
  onEdgeDelete
}: InteractiveDiagramProps): ReactElement {
  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const [transform, setTransform] = useState<Transform>(() => {
    const { viewBox } = buildDiagramLayout(nodes, edges);
    return computeFitTransform(viewBox, width, height);
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [nodeDrag, setNodeDrag] = useState<NodeDragState | null>(null);
  const [connectDraw, setConnectDraw] = useState<ConnectDrawState | null>(null);
  const [connectMode, setConnectMode] = useState<ConnectModeState | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const pointersRef = useRef(new Map<number, ScreenPoint>());
  const panRef = useRef<PanState | null>(null);
  const pinchRef = useRef<PinchState | null>(null);
  const suppressClickRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // The dragged node's live position, so connected edges' anchor points recompute in real time
  // (see the perf note in this component's doc comment above) — `nodes` itself stays untouched
  // until `onNodesChange` commits on pointerup.
  const displayNodes = useMemo(() => {
    if (!nodeDrag) return nodes;
    return nodes.map((n) => (n.id === nodeDrag.nodeId ? { ...n, x: nodeDrag.currentX, y: nodeDrag.currentY } : n));
  }, [nodes, nodeDrag]);

  const { nodes: resolvedNodes, edgeLayouts, viewBox } = useMemo(
    () => buildDiagramLayout(displayNodes, edges),
    [displayNodes, edges]
  );

  function handleWheel(event: ReactWheelEvent<SVGSVGElement>): void {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;

    setTransform((prev) => {
      const newScale = clamp(prev.scale * factor, MIN_ZOOM, MAX_ZOOM);
      const worldX = (screenX - prev.tx) / prev.scale;
      const worldY = (screenY - prev.ty) / prev.scale;
      return { scale: newScale, tx: screenX - worldX * newScale, ty: screenY - worldY * newScale };
    });
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<SVGRectElement>): void {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture isn't implemented in every test/DOM environment.
    }

    if (pointersRef.current.size === 1) {
      pinchRef.current = null;
      panRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTx: transform.tx,
        startTy: transform.ty,
        moved: false
      };
    } else if (pointersRef.current.size === 2) {
      panRef.current = null;
      const [a, b] = Array.from(pointersRef.current.values()) as [ScreenPoint, ScreenPoint];
      const rect = event.currentTarget.getBoundingClientRect();
      const mid = midpoint(a, b);
      pinchRef.current = {
        startDistance: distance(a, b),
        startScale: transform.scale,
        worldX: (mid.x - rect.left - transform.tx) / transform.scale,
        worldY: (mid.y - rect.top - transform.ty) / transform.scale
      };
    }
  }

  function handleCanvasPointerMove(event: ReactPointerEvent<SVGRectElement>): void {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [a, b] = Array.from(pointersRef.current.values()) as [ScreenPoint, ScreenPoint];
      const rect = event.currentTarget.getBoundingClientRect();
      const mid = midpoint(a, b);
      const scaleRatio = distance(a, b) / (pinchRef.current.startDistance || 1);
      const newScale = clamp(pinchRef.current.startScale * scaleRatio, MIN_ZOOM, MAX_ZOOM);
      setTransform({
        scale: newScale,
        tx: mid.x - rect.left - pinchRef.current.worldX * newScale,
        ty: mid.y - rect.top - pinchRef.current.worldY * newScale
      });
      return;
    }

    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    const dx = event.clientX - pan.startClientX;
    const dy = event.clientY - pan.startClientY;
    if (Math.abs(dx) > CLICK_DRAG_THRESHOLD || Math.abs(dy) > CLICK_DRAG_THRESHOLD) {
      pan.moved = true;
    }
    setTransform((prev) => ({ ...prev, tx: pan.startTx + dx, ty: pan.startTy + dy }));
  }

  function handleCanvasPointerUp(event: ReactPointerEvent<SVGRectElement>): void {
    pointersRef.current.delete(event.pointerId);
    const pan = panRef.current;
    if (pan && pan.pointerId === event.pointerId) {
      panRef.current = null;
      if (!pan.moved) {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        onCanvasClick?.();
      }
    }
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
  }

  function handleNodeClick(node: ResolvedDiagramNode): void {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    const original = nodesById.get(node.id);
    if (original) onNodeClick?.(original);
  }

  function handleEdgeClick(edgeId: string): void {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }

  function handleNodePointerDown(node: ResolvedDiagramNode) {
    return (event: ReactPointerEvent<SVGGElement>): void => {
      event.stopPropagation();
      // Unlike HTML elements, a click on a focusable SVG element (tabIndex set) does not move
      // DOM focus there automatically in most browsers — without this, Delete/arrow-key/'c'
      // handlers never fire after a plain mouse click, only after an explicit Tab. Harmless
      // no-op when !editable, since tabIndex is unset then and the element isn't focusable.
      event.currentTarget.focus();
      if (!editable) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture isn't implemented in every test/DOM environment.
      }
      setNodeDrag({
        pointerId: event.pointerId,
        nodeId: node.id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startNodeX: node.x,
        startNodeY: node.y,
        currentX: node.x,
        currentY: node.y,
        moved: false
      });
    };
  }

  function handleNodePointerMove(event: ReactPointerEvent<SVGGElement>): void {
    if (!nodeDrag || event.pointerId !== nodeDrag.pointerId) return;
    event.stopPropagation();
    const dxWorld = (event.clientX - nodeDrag.startClientX) / transform.scale;
    const dyWorld = (event.clientY - nodeDrag.startClientY) / transform.scale;
    let nextX = nodeDrag.startNodeX + dxWorld;
    let nextY = nodeDrag.startNodeY + dyWorld;
    if (snapToGrid) {
      nextX = Math.round(nextX / snapToGrid) * snapToGrid;
      nextY = Math.round(nextY / snapToGrid) * snapToGrid;
    }
    const movedDistance = Math.hypot(event.clientX - nodeDrag.startClientX, event.clientY - nodeDrag.startClientY);
    const moved = movedDistance > CLICK_DRAG_THRESHOLD;
    setNodeDrag({ ...nodeDrag, currentX: nextX, currentY: nextY, moved });
  }

  function handleNodePointerUp(event: ReactPointerEvent<SVGGElement>): void {
    if (!nodeDrag || event.pointerId !== nodeDrag.pointerId) return;
    event.stopPropagation();
    const finished = nodeDrag;
    setNodeDrag(null);
    if (!finished.moved) return;

    suppressClickRef.current = true;
    const updatedNodes = nodes.map((n) =>
      n.id === finished.nodeId ? { ...n, x: finished.currentX, y: finished.currentY } : n
    );
    onNodesChange?.(updatedNodes);
    const label = nodesById.get(finished.nodeId)?.label;
    setAnnouncement(
      `${String(label)} moved to ${Math.round(finished.currentX)}, ${Math.round(finished.currentY)}.`
    );
  }

  function handleNodePointerCancel(event: ReactPointerEvent<SVGGElement>): void {
    if (!nodeDrag || event.pointerId !== nodeDrag.pointerId) return;
    event.stopPropagation();
    setNodeDrag(null);
  }

  function handleHandlePointerDown(node: ResolvedDiagramNode) {
    // The specific cardinal handle (top/right/bottom/left) doesn't affect connect-draw behavior —
    // phase 1's anchor-point calculation already determines the visual connection side from the
    // source/target nodes' relative positions, not from which handle was grabbed.
    return (_handleName: HandleName): HandlePointerHandler =>
      (event) => {
        event.stopPropagation();
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture isn't implemented in every test/DOM environment.
        }
        setConnectDraw({
          pointerId: event.pointerId,
          sourceNodeId: node.id,
          currentX: node.x,
          currentY: node.y,
          hoveredTargetId: null
        });
      };
  }

  function handleConnectPointerMove(event: ReactPointerEvent<SVGCircleElement>): void {
    if (!connectDraw || event.pointerId !== connectDraw.pointerId) return;
    event.stopPropagation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const worldX = (event.clientX - rect.left - transform.tx) / transform.scale;
    const worldY = (event.clientY - rect.top - transform.ty) / transform.scale;
    const target = findNodeAtPoint(resolvedNodes, worldX, worldY, connectDraw.sourceNodeId);
    setConnectDraw({ ...connectDraw, currentX: worldX, currentY: worldY, hoveredTargetId: target?.id ?? null });
  }

  function handleConnectPointerUp(event: ReactPointerEvent<SVGCircleElement>): void {
    if (!connectDraw || event.pointerId !== connectDraw.pointerId) return;
    event.stopPropagation();
    const finished = connectDraw;
    setConnectDraw(null);
    if (finished.hoveredTargetId && finished.hoveredTargetId !== finished.sourceNodeId) {
      const newEdge: DiagramEdge = {
        id: generateEdgeId(),
        source: finished.sourceNodeId,
        target: finished.hoveredTargetId
      };
      onEdgesChange?.([...edges, newEdge]);
      const sourceLabel = nodesById.get(finished.sourceNodeId)?.label;
      const targetLabel = nodesById.get(finished.hoveredTargetId)?.label;
      setAnnouncement(`Connected ${String(sourceLabel)} to ${String(targetLabel)}.`);
    }
  }

  function handleConnectPointerCancel(event: ReactPointerEvent<SVGCircleElement>): void {
    if (!connectDraw || event.pointerId !== connectDraw.pointerId) return;
    event.stopPropagation();
    setConnectDraw(null);
  }

  function handleNodeKeyDown(node: ResolvedDiagramNode) {
    return (event: ReactKeyboardEvent<SVGGElement>): void => {
      if (!editable) return;

      if (connectMode && connectMode.sourceNodeId === node.id) {
        if (event.key === "Tab") {
          event.preventDefault();
          const direction = event.shiftKey ? -1 : 1;
          const { candidateIds } = connectMode;
          const nextIndex = (connectMode.targetIndex + direction + candidateIds.length) % candidateIds.length;
          const candidateLabel = nodesById.get(candidateIds[nextIndex]!)?.label;
          setConnectMode({ ...connectMode, targetIndex: nextIndex });
          setAnnouncement(`Connect to ${String(candidateLabel)}? Press Enter to confirm, Escape to cancel.`);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const targetId = connectMode.candidateIds[connectMode.targetIndex]!;
          const newEdge: DiagramEdge = { id: generateEdgeId(), source: connectMode.sourceNodeId, target: targetId };
          onEdgesChange?.([...edges, newEdge]);
          const sourceLabel = nodesById.get(connectMode.sourceNodeId)?.label;
          const targetLabel = nodesById.get(targetId)?.label;
          setAnnouncement(`Connected ${String(sourceLabel)} to ${String(targetLabel)}.`);
          setConnectMode(null);
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setConnectMode(null);
          setAnnouncement("Connection cancelled.");
          return;
        }
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        const orphanedEdgeIds = findConnectedEdgeIds(edges, node.id);
        onNodeDelete?.(node.id, orphanedEdgeIds);
        setAnnouncement(`${String(node.label)} deleted.`);
        return;
      }

      if ((event.key === "c" || event.key === "C") && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        const candidateIds = nodes.filter((n) => n.id !== node.id).map((n) => n.id);
        if (candidateIds.length === 0) return;
        setConnectMode({ sourceNodeId: node.id, targetIndex: 0, candidateIds });
        const firstLabel = nodesById.get(candidateIds[0]!)?.label;
        setAnnouncement(
          `Connect mode: connecting from ${String(node.label)}. Press Tab to cycle targets, currently ${String(firstLabel)}. Press Enter to confirm, Escape to cancel.`
        );
        return;
      }

      const step = snapToGrid ?? DEFAULT_NUDGE_STEP;
      let dx = 0;
      let dy = 0;
      switch (event.key) {
        case "ArrowUp":
          dy = -step;
          break;
        case "ArrowDown":
          dy = step;
          break;
        case "ArrowLeft":
          dx = -step;
          break;
        case "ArrowRight":
          dx = step;
          break;
        default:
          return;
      }
      event.preventDefault();
      const nextX = node.x + dx;
      const nextY = node.y + dy;
      const updatedNodes = nodes.map((n) => (n.id === node.id ? { ...n, x: nextX, y: nextY } : n));
      onNodesChange?.(updatedNodes);
      setAnnouncement(`${String(node.label)} moved to ${Math.round(nextX)}, ${Math.round(nextY)}.`);
    };
  }

  function handleEdgeKeyDown(edge: DiagramEdgeLayout) {
    return (event: ReactKeyboardEvent<SVGPathElement>): void => {
      if (!editable) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        onEdgeDelete?.(edge.id);
        setAnnouncement("Edge deleted.");
      }
    };
  }

  if (nodes.length === 0) {
    return (
      <div className={root} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const connectSourceNode = connectDraw
    ? resolvedNodes.find((n) => n.id === connectDraw.sourceNodeId)
    : undefined;
  const connectPreviewAnchor =
    connectDraw && connectSourceNode
      ? getAnchorPoint(connectSourceNode, connectDraw.currentX, connectDraw.currentY)
      : null;
  const keyboardConnectTargetId =
    connectMode ? connectMode.candidateIds[connectMode.targetIndex] : null;

  return (
    <div className={root}>
      <div aria-live="polite" className={visuallyHidden}>
        {announcement}
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        role="img"
        aria-label="Diagram"
        onWheel={handleWheel}
        style={{ touchAction: "none" }}
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
        <rect
          className={canvas}
          data-testid="diagram-canvas"
          x={0}
          y={0}
          width={width}
          height={height}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
        />
        <g
          data-testid="diagram-transform-group"
          transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`}
        >
          {edgeLayouts.map((edge) => (
            <EdgeLine
              key={edge.id}
              edge={edge}
              editable={editable}
              selected={edge.id === selectedEdgeId}
              onEdgeClick={() => handleEdgeClick(edge.id)}
              onEdgeKeyDown={handleEdgeKeyDown(edge)}
            />
          ))}
          {resolvedNodes.map((node) => {
            const isDropTarget =
              connectDraw?.hoveredTargetId === node.id || keyboardConnectTargetId === node.id;
            const isConnectSource =
              connectDraw?.sourceNodeId === node.id || connectMode?.sourceNodeId === node.id;
            const showHandles =
              editable &&
              !nodeDrag &&
              (hoveredNodeId === node.id ||
                selectedNodeId === node.id ||
                isConnectSource ||
                connectDraw !== null);
            return (
              <g
                key={node.id}
                data-testid={`diagram-node-${node.id}`}
                tabIndex={editable ? 0 : undefined}
                role={editable ? "button" : undefined}
                aria-label={
                  editable
                    ? `${String(node.label)}. Press arrow keys to move, C to start a connection, Delete to remove.`
                    : undefined
                }
                onPointerDown={handleNodePointerDown(node)}
                onPointerMove={editable ? handleNodePointerMove : undefined}
                onPointerUp={editable ? handleNodePointerUp : undefined}
                onPointerCancel={editable ? handleNodePointerCancel : undefined}
                onPointerEnter={editable ? () => setHoveredNodeId(node.id) : undefined}
                onPointerLeave={
                  editable ? () => setHoveredNodeId((id) => (id === node.id ? null : id)) : undefined
                }
                onClick={() => handleNodeClick(node)}
                onKeyDown={editable ? handleNodeKeyDown(node) : undefined}
              >
                <NodeShape
                  node={node}
                  selected={node.id === selectedNodeId}
                  isConnectSource={isConnectSource}
                  isDropTarget={isDropTarget}
                  showHandles={showHandles}
                  onHandlePointerDown={handleHandlePointerDown(node)}
                  onHandlePointerMove={handleConnectPointerMove}
                  onHandlePointerUp={handleConnectPointerUp}
                  onHandlePointerCancel={handleConnectPointerCancel}
                />
                <foreignObject
                  x={node.x - node.width / 2}
                  y={node.y - node.height / 2}
                  width={node.width}
                  height={node.height}
                  style={{ pointerEvents: "none" }}
                >
                  <div className={nodeLabel}>{node.label}</div>
                </foreignObject>
              </g>
            );
          })}
          {connectDraw && connectPreviewAnchor ? (
            <path
              className={connectPreviewPath}
              d={`M ${connectPreviewAnchor.x} ${connectPreviewAnchor.y} L ${connectDraw.currentX} ${connectDraw.currentY}`}
              aria-hidden="true"
            />
          ) : null}
        </g>
      </svg>
    </div>
  );
}
