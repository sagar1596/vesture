export interface OrgNodeData {
  id: string;
  name: string;
  title?: string;
  /** Image URL shown in the default card. */
  avatar?: string;
  children?: OrgNodeData[];
  /** Anything extra you want available in `renderNode`. */
  data?: unknown;
}

export type OrgOrientation = "vertical" | "horizontal";
export type OrgEdgeStyle = "elbow" | "curve" | "straight";

export interface OrgLayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  gapX: number;
  gapY: number;
  orientation: OrgOrientation;
  edgeStyle: OrgEdgeStyle;
}

export interface OrgLayoutNode {
  id: string;
  node: OrgNodeData;
  parentId: string | null;
  depth: number;
  x: number;
  y: number;
  hasChildren: boolean;
  collapsed: boolean;
  childIds: string[];
}

export interface OrgLayoutEdge {
  id: string;
  from: string;
  to: string;
  path: string;
}

export interface OrgLayout {
  nodes: OrgLayoutNode[];
  edges: OrgLayoutEdge[];
  width: number;
  height: number;
}

/**
 * Tidy-tree layout: every visible leaf gets the next slot along the cross axis and each parent
 * is centered over its first and last child. Collapsed nodes count as leaves.
 */
export function computeOrgLayout(roots: OrgNodeData[], collapsed: Set<string>, o: OrgLayoutOptions): OrgLayout {
  const vertical = o.orientation === "vertical";
  const slotSize = vertical ? o.nodeWidth + o.gapX : o.nodeHeight + o.gapY;
  const levelSize = vertical ? o.nodeHeight + o.gapY : o.nodeWidth + o.gapX;
  const nodes: OrgLayoutNode[] = [];
  const pos = new Map<string, { cross: number; depth: number }>();
  let nextSlot = 0;

  const visit = (n: OrgNodeData, depth: number, parentId: string | null): number => {
    const isCollapsed = collapsed.has(n.id);
    const kids = !isCollapsed && n.children?.length ? n.children : [];
    let cross: number;
    if (kids.length === 0) {
      cross = nextSlot++;
    } else {
      const childCross = kids.map((k) => visit(k, depth + 1, n.id));
      cross = (childCross[0]! + childCross[childCross.length - 1]!) / 2;
    }
    pos.set(n.id, { cross, depth });
    nodes.push({
      id: n.id,
      node: n,
      parentId,
      depth,
      x: 0,
      y: 0,
      hasChildren: !!n.children?.length,
      collapsed: isCollapsed,
      childIds: kids.map((k) => k.id)
    });
    return cross;
  };
  roots.forEach((r) => visit(r, 0, null));

  for (const ln of nodes) {
    const p = pos.get(ln.id)!;
    ln.x = vertical ? p.cross * slotSize : p.depth * levelSize;
    ln.y = vertical ? p.depth * levelSize : p.cross * slotSize;
  }
  // visit() pushes children before parents; present parents first.
  nodes.sort((a, b) => a.depth - b.depth || a.x - b.x || a.y - b.y);

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: OrgLayoutEdge[] = [];
  for (const n of nodes) {
    if (!n.parentId) continue;
    const p = byId.get(n.parentId)!;
    const [x0, y0, x1, y1] = vertical
      ? [p.x + o.nodeWidth / 2, p.y + o.nodeHeight, n.x + o.nodeWidth / 2, n.y]
      : [p.x + o.nodeWidth, p.y + o.nodeHeight / 2, n.x, n.y + o.nodeHeight / 2];
    let path: string;
    if (o.edgeStyle === "straight") {
      path = `M${x0},${y0}L${x1},${y1}`;
    } else if (o.edgeStyle === "curve") {
      path = vertical
        ? `M${x0},${y0}C${x0},${(y0 + y1) / 2} ${x1},${(y0 + y1) / 2} ${x1},${y1}`
        : `M${x0},${y0}C${(x0 + x1) / 2},${y0} ${(x0 + x1) / 2},${y1} ${x1},${y1}`;
    } else {
      path = vertical
        ? `M${x0},${y0}V${(y0 + y1) / 2}H${x1}V${y1}`
        : `M${x0},${y0}H${(x0 + x1) / 2}V${y1}H${x1}`;
    }
    edges.push({ id: `${p.id}->${n.id}`, from: p.id, to: n.id, path });
  }

  const width = nodes.length ? Math.max(...nodes.map((n) => n.x)) + o.nodeWidth : 0;
  const height = nodes.length ? Math.max(...nodes.map((n) => n.y)) + o.nodeHeight : 0;
  return { nodes, edges, width, height };
}

/** Ids of every node that has children — handy for "collapse all". */
export function collectParentIds(roots: OrgNodeData[]): string[] {
  const out: string[] = [];
  const walk = (n: OrgNodeData) => {
    if (n.children?.length) {
      out.push(n.id);
      n.children.forEach(walk);
    }
  };
  roots.forEach(walk);
  return out;
}
