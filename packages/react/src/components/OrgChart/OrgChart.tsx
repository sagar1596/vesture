import { useRef, useState } from "react";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { collectParentIds, computeOrgLayout } from "./org-layout";
import type { OrgEdgeStyle, OrgLayoutNode, OrgNodeData, OrgOrientation } from "./org-layout";
import {
  avatar as avatarClass,
  canvas,
  card,
  controlButton,
  controls,
  edge as edgeClass,
  edges as edgesClass,
  empty,
  name as nameClass,
  node as nodeClass,
  root,
  text,
  title as titleClass,
  toggle
} from "./OrgChart.css";

export interface OrgChartProps {
  /** One root, or several (a forest). */
  data: OrgNodeData | OrgNodeData[];
  orientation?: OrgOrientation;
  edgeStyle?: OrgEdgeStyle;
  nodeWidth?: number;
  nodeHeight?: number;
  /** Horizontal / vertical space between sibling slots and levels. */
  gapX?: number;
  gapY?: number;
  /** Controlled set of collapsed node ids. */
  collapsedIds?: string[];
  defaultCollapsedIds?: string[];
  onCollapsedChange?: (ids: string[]) => void;
  /** Hides the +/- expand toggles. */
  collapsible?: boolean;
  selectedId?: string;
  onNodeClick?: (node: OrgNodeData) => void;
  /** Replaces the default avatar + name + title card. */
  renderNode?: (node: OrgNodeData, info: { selected: boolean; collapsed: boolean; hasChildren: boolean; depth: number }) => ReactNode;
  /** Controlled zoom factor. */
  zoom?: number;
  defaultZoom?: number;
  onZoomChange?: (zoom: number) => void;
  showZoomControls?: boolean;
  /** Visible viewport size; the chart scrolls inside it. */
  height?: number | string;
  className?: string;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

/** Hierarchical org chart with collapsible branches, keyboard navigation and custom node cards. */
export function OrgChart({
  data,
  orientation = "vertical",
  edgeStyle = "elbow",
  nodeWidth = 200,
  nodeHeight = 64,
  gapX = 28,
  gapY = 48,
  collapsedIds,
  defaultCollapsedIds = [],
  onCollapsedChange,
  collapsible = true,
  selectedId,
  onNodeClick,
  renderNode,
  zoom: controlledZoom,
  defaultZoom = 1,
  onZoomChange,
  showZoomControls = true,
  height = 420,
  className
}: OrgChartProps): ReactElement {
  const roots = Array.isArray(data) ? data : [data];
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState<string[]>(defaultCollapsedIds);
  const [uncontrolledZoom, setUncontrolledZoom] = useState(defaultZoom);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement | HTMLDivElement>());
  const collapsedList = collapsedIds !== undefined ? collapsedIds : uncontrolledCollapsed;
  const zoom = controlledZoom !== undefined ? controlledZoom : uncontrolledZoom;
  const collapsed = new Set(collapsedList);

  const setCollapsed = (next: string[]) => {
    if (collapsedIds === undefined) setUncontrolledCollapsed(next);
    onCollapsedChange?.(next);
  };
  const setZoom = (z: number) => {
    const c = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
    if (controlledZoom === undefined) setUncontrolledZoom(c);
    onZoomChange?.(c);
  };
  const toggleNode = (id: string) =>
    setCollapsed(collapsed.has(id) ? collapsedList.filter((x) => x !== id) : [...collapsedList, id]);

  const layout = computeOrgLayout(roots, collapsed, { nodeWidth, nodeHeight, gapX, gapY, orientation, edgeStyle });
  const vertical = orientation === "vertical";

  const focusNode = (id: string | undefined) => {
    if (id) nodeRefs.current.get(id)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>, n: OrgLayoutNode) => {
    const siblings = layout.nodes.filter((s) => s.parentId === n.parentId && s.depth === n.depth);
    const i = siblings.findIndex((s) => s.id === n.id);
    const [prevKey, nextKey, parentKey, childKey] = vertical
      ? ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]
      : ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (e.key === prevKey) focusNode(siblings[i - 1]?.id);
    else if (e.key === nextKey) focusNode(siblings[i + 1]?.id);
    else if (e.key === parentKey) focusNode(n.parentId ?? undefined);
    else if (e.key === childKey) {
      if (n.collapsed && n.hasChildren) {
        toggleNode(n.id);
      } else {
        focusNode(n.childIds[0]);
      }
    } else if (e.key === "Home") focusNode(siblings[0]?.id);
    else if (e.key === "End") focusNode(siblings[siblings.length - 1]?.id);
    else return;
    e.preventDefault();
  };

  if (layout.nodes.length === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ height }}>
        <div className={empty}>No people to show</div>
      </div>
    );
  }

  const pad = 24;
  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ height }} role="tree" aria-label="Organization chart" aria-orientation={vertical ? "vertical" : "horizontal"}>
      {showZoomControls || collapsible ? (
        <div className={controls}>
          {showZoomControls ? (
            <>
              <button type="button" className={controlButton} aria-label="Zoom out" onClick={() => setZoom(zoom - 0.1)}>
                −
              </button>
              <button type="button" className={controlButton} aria-label="Reset zoom" onClick={() => setZoom(1)}>
                {Math.round(zoom * 100)}%
              </button>
              <button type="button" className={controlButton} aria-label="Zoom in" onClick={() => setZoom(zoom + 0.1)}>
                +
              </button>
            </>
          ) : null}
          {collapsible ? (
            <>
              <button type="button" className={controlButton} onClick={() => setCollapsed(collectParentIds(roots))}>
                Collapse all
              </button>
              <button type="button" className={controlButton} onClick={() => setCollapsed([])}>
                Expand all
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      <div style={{ width: (layout.width + pad * 2) * zoom, height: (layout.height + pad * 2) * zoom, position: "relative" }}>
        <div
          className={canvas}
          data-testid="orgchart-canvas"
          style={{ width: layout.width + pad * 2, height: layout.height + pad * 2, transform: `scale(${zoom})` }}
        >
          <svg className={edgesClass} width={layout.width + pad * 2} height={layout.height + pad * 2}>
            <g transform={`translate(${pad},${pad})`}>
              {layout.edges.map((e) => (
                <path key={e.id} className={edgeClass} data-testid="orgchart-edge" d={e.path} />
              ))}
            </g>
          </svg>
          {layout.nodes.map((n) => {
            const selected = selectedId === n.id;
            const info = { selected, collapsed: n.collapsed, hasChildren: n.hasChildren, depth: n.depth };
            const toggleStyle = vertical
              ? { left: nodeWidth / 2 - 10, top: nodeHeight - 10 }
              : { left: nodeWidth - 10, top: nodeHeight / 2 - 10 };
            return (
              <div
                key={n.id}
                className={nodeClass}
                data-testid="orgchart-node"
                role="treeitem"
                aria-level={n.depth + 1}
                aria-expanded={n.hasChildren ? !n.collapsed : undefined}
                aria-selected={selected}
                style={{ left: n.x + pad, top: n.y + pad, width: nodeWidth, height: nodeHeight }}
              >
                <button
                  type="button"
                  className={card}
                  data-selected={selected}
                  data-clickable={!!onNodeClick}
                  ref={(el) => {
                    if (el) nodeRefs.current.set(n.id, el);
                    else nodeRefs.current.delete(n.id);
                  }}
                  onClick={() => onNodeClick?.(n.node)}
                  onKeyDown={(e) => onKeyDown(e, n)}
                  aria-label={n.node.title ? `${n.node.name}, ${n.node.title}` : n.node.name}
                >
                  {renderNode ? (
                    renderNode(n.node, info)
                  ) : (
                    <>
                      {n.node.avatar ? (
                        <img className={avatarClass} src={n.node.avatar} alt="" />
                      ) : (
                        <span className={avatarClass} aria-hidden>
                          {initials(n.node.name)}
                        </span>
                      )}
                      <span className={text}>
                        <span className={nameClass}>{n.node.name}</span>
                        {n.node.title ? <span className={titleClass}>{n.node.title}</span> : null}
                      </span>
                    </>
                  )}
                </button>
                {collapsible && n.hasChildren ? (
                  <button
                    type="button"
                    className={toggle}
                    style={toggleStyle}
                    aria-label={`${n.collapsed ? "Expand" : "Collapse"} ${n.node.name}`}
                    onClick={() => toggleNode(n.id)}
                  >
                    {n.collapsed ? "+" : "−"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
