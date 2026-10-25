export interface SankeyNodeInput {
  key: string;
  label?: string;
  color?: string;
}
export interface SankeyLinkInput {
  source: string;
  target: string;
  value: number;
}
export interface SankeyNode extends SankeyNodeInput {
  column: number;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface SankeyLink extends SankeyLinkInput {
  index: number;
  /** Stroke width in px. */
  thickness: number;
  /** Vertical center where the link leaves the source / enters the target. */
  y0: number;
  y1: number;
  x0: number;
  x1: number;
  path: string;
}
export interface SankeyLayout {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
export interface SankeyOptions {
  width: number;
  height: number;
  nodeWidth: number;
  nodePadding: number;
  /** `left` keeps sinks in their natural column; `justify` pushes every sink to the last column. */
  align: "left" | "justify";
}

/** Longest-path column assignment; links that would close a cycle are ignored for layering. */
function assignColumns(keys: string[], links: SankeyLinkInput[], align: "left" | "justify"): Map<string, number> {
  const col = new Map(keys.map((k) => [k, 0]));
  for (let pass = 0; pass < keys.length; pass++) {
    let changed = false;
    for (const l of links) {
      const next = col.get(l.source)! + 1;
      if (next > col.get(l.target)! && next < keys.length) {
        col.set(l.target, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  if (align === "justify") {
    const max = Math.max(...col.values());
    const hasOut = new Set(links.map((l) => l.source));
    for (const k of keys) if (!hasOut.has(k)) col.set(k, max);
  }
  return col;
}

export function computeSankey(nodesIn: SankeyNodeInput[], linksIn: SankeyLinkInput[], opts: SankeyOptions): SankeyLayout {
  const keys = nodesIn.map((n) => n.key);
  const known = new Set(keys);
  const links = linksIn.filter((l) => known.has(l.source) && known.has(l.target) && l.source !== l.target && l.value > 0);
  if (nodesIn.length === 0) return { nodes: [], links: [] };

  const col = assignColumns(keys, links, opts.align);
  const colCount = Math.max(...col.values()) + 1;
  const inSum = new Map<string, number>();
  const outSum = new Map<string, number>();
  for (const l of links) {
    outSum.set(l.source, (outSum.get(l.source) ?? 0) + l.value);
    inSum.set(l.target, (inSum.get(l.target) ?? 0) + l.value);
  }
  const valueOf = (k: string) => Math.max(inSum.get(k) ?? 0, outSum.get(k) ?? 0);

  const columns: string[][] = Array.from({ length: colCount }, () => []);
  for (const k of keys) columns[col.get(k)!]!.push(k);

  // One scale for the whole diagram so equal values look equal across columns.
  let ky = Infinity;
  for (const c of columns) {
    if (c.length === 0) continue;
    const total = c.reduce((s, k) => s + valueOf(k), 0);
    if (total > 0) ky = Math.min(ky, (opts.height - (c.length - 1) * opts.nodePadding) / total);
  }
  if (!Number.isFinite(ky) || ky <= 0) ky = 1;

  const colX = (c: number) => (colCount === 1 ? 0 : (c * (opts.width - opts.nodeWidth)) / (colCount - 1));
  const nodeMap = new Map<string, SankeyNode>();
  const stack = (order: string[]) => {
    const total = order.reduce((s, k) => s + valueOf(k) * ky, 0) + (order.length - 1) * opts.nodePadding;
    let y = (opts.height - total) / 2;
    for (const k of order) {
      const src = nodesIn.find((n) => n.key === k)!;
      const h = Math.max(1, valueOf(k) * ky);
      nodeMap.set(k, { ...src, column: col.get(k)!, value: valueOf(k), x: colX(col.get(k)!), y, width: opts.nodeWidth, height: h });
      y += h + opts.nodePadding;
    }
  };
  columns.forEach(stack);

  // Two barycenter passes to cut crossings: order each column by the mean y of its neighbours.
  for (let pass = 0; pass < 2; pass++) {
    for (let c = 1; c < colCount; c++) {
      const center = (k: string) => {
        const nbrs = links.filter((l) => l.target === k).map((l) => nodeMap.get(l.source)!).filter((n) => n.column < c);
        if (nbrs.length === 0) return nodeMap.get(k)!.y;
        return nbrs.reduce((s, n) => s + n.y + n.height / 2, 0) / nbrs.length;
      };
      columns[c]!.sort((a, b) => center(a) - center(b));
      stack(columns[c]!);
    }
  }

  const outOffset = new Map<string, number>();
  const inOffset = new Map<string, number>();
  const sortedOut = [...links.keys()].sort((a, b) => nodeMap.get(links[a]!.target)!.y - nodeMap.get(links[b]!.target)!.y);
  const sortedIn = [...links.keys()].sort((a, b) => nodeMap.get(links[a]!.source)!.y - nodeMap.get(links[b]!.source)!.y);
  const sy = new Map<number, number>();
  const ty = new Map<number, number>();
  for (const i of sortedOut) {
    const l = links[i]!;
    const off = outOffset.get(l.source) ?? 0;
    sy.set(i, nodeMap.get(l.source)!.y + off + (l.value * ky) / 2);
    outOffset.set(l.source, off + l.value * ky);
  }
  for (const i of sortedIn) {
    const l = links[i]!;
    const off = inOffset.get(l.target) ?? 0;
    ty.set(i, nodeMap.get(l.target)!.y + off + (l.value * ky) / 2);
    inOffset.set(l.target, off + l.value * ky);
  }

  const outLinks: SankeyLink[] = links.map((l, i) => {
    const s = nodeMap.get(l.source)!;
    const t = nodeMap.get(l.target)!;
    const x0 = s.x + s.width;
    const x1 = t.x;
    const mid = (x0 + x1) / 2;
    const y0 = sy.get(i)!;
    const y1 = ty.get(i)!;
    return { ...l, index: i, thickness: Math.max(1, l.value * ky), x0, x1, y0, y1, path: `M${x0},${y0}C${mid},${y0} ${mid},${y1} ${x1},${y1}` };
  });
  return { nodes: [...nodeMap.values()], links: outLinks };
}
