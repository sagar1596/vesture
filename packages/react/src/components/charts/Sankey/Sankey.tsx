import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { vars } from "@vesture/tokens";
import { computeSankey } from "./sankey-layout";
import type { SankeyLayout, SankeyLink, SankeyLinkInput, SankeyNode, SankeyNodeInput } from "./sankey-layout";
import { emptyState, label, labelValue, link as linkClass, node as nodeClass, nodeRect, root } from "./Sankey.css";

export type SankeyLinkColor = "source" | "target" | "gradient" | "neutral" | ((link: SankeyLink, layout: SankeyLayout) => string);

export interface SankeyChartProps {
  nodes: SankeyNodeInput[];
  links: SankeyLinkInput[];
  width: number;
  height: number;
  nodeWidth?: number;
  nodePadding?: number;
  align?: "left" | "justify";
  /** Link coloring: inherit from the source/target node, blend both, one neutral tone, or compute per link. */
  linkColor?: SankeyLinkColor;
  linkOpacity?: number;
  /** Opacity of links not connected to the hovered/focused node. */
  dimmedOpacity?: number;
  colors?: string[];
  formatValue?: (v: number) => string;
  showValues?: boolean;
  /** Reserved horizontal space (px) for labels on the right/left edges. */
  labelPadding?: number;
  renderNodeLabel?: (node: SankeyNode, info: { formatted: string; side: "left" | "right" }) => ReactNode;
  onNodeClick?: (node: SankeyNode) => void;
  onLinkClick?: (link: SankeyLink) => void;
  className?: string;
}

const SERIES = [
  vars.chart.series1,
  vars.chart.series2,
  vars.chart.series3,
  vars.chart.series4,
  vars.chart.series5,
  vars.chart.series6,
  vars.chart.series7,
  vars.chart.series8
];

let gradientId = 0;

export function SankeyChart({
  nodes,
  links,
  width,
  height,
  nodeWidth = 14,
  nodePadding = 14,
  align = "justify",
  linkColor = "source",
  linkOpacity = 0.35,
  dimmedOpacity = 0.08,
  colors = SERIES,
  formatValue = String,
  showValues = true,
  labelPadding = 90,
  renderNodeLabel,
  onNodeClick,
  onLinkClick,
  className
}: SankeyChartProps): ReactElement {
  const [active, setActive] = useState<string | null>(null);
  const [uid] = useState(() => `sankey-${++gradientId}`);
  const innerW = Math.max(10, width - labelPadding * 2);
  const layout = computeSankey(nodes, links, { width: innerW, height, nodeWidth, nodePadding, align });

  if (layout.nodes.length === 0 || layout.links.length === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No data
        </div>
      </div>
    );
  }

  const nodeColor = (n: SankeyNode) => n.color ?? colors[nodes.findIndex((x) => x.key === n.key) % colors.length]!;
  const byKey = new Map(layout.nodes.map((n) => [n.key, n]));
  const connected = (l: SankeyLink) => active === null || l.source === active || l.target === active;
  const lastColumn = Math.max(...layout.nodes.map((n) => n.column));

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
      <svg width={width} height={height} role="img" aria-label="Sankey diagram">
        <defs>
          {linkColor === "gradient"
            ? layout.links.map((l) => (
                <linearGradient key={l.index} id={`${uid}-${l.index}`} gradientUnits="userSpaceOnUse" x1={l.x0} x2={l.x1}>
                  <stop offset="0%" stopColor={nodeColor(byKey.get(l.source)!)} />
                  <stop offset="100%" stopColor={nodeColor(byKey.get(l.target)!)} />
                </linearGradient>
              ))
            : null}
        </defs>
        <g transform={`translate(${labelPadding},0)`}>
          {layout.links.map((l) => {
            const stroke =
              typeof linkColor === "function"
                ? linkColor(l, layout)
                : linkColor === "gradient"
                  ? `url(#${uid}-${l.index})`
                  : linkColor === "neutral"
                    ? vars.chart.axis
                    : nodeColor(byKey.get(linkColor === "source" ? l.source : l.target)!);
            return (
              <path
                key={l.index}
                className={linkClass}
                data-testid="sankey-link"
                d={l.path}
                stroke={stroke}
                strokeWidth={l.thickness}
                opacity={connected(l) ? linkOpacity : dimmedOpacity}
                style={onLinkClick ? { cursor: "pointer" } : undefined}
                onClick={onLinkClick ? () => onLinkClick(l) : undefined}
              >
                <title>{`${byKey.get(l.source)!.label ?? l.source} → ${byKey.get(l.target)!.label ?? l.target}: ${formatValue(l.value)}`}</title>
              </path>
            );
          })}
          {layout.nodes.map((n) => {
            const side: "left" | "right" = n.column === lastColumn && lastColumn > 0 ? "left" : "right";
            const formatted = formatValue(n.value);
            return (
              <g
                key={n.key}
                className={nodeClass}
                data-testid="sankey-node"
                tabIndex={0}
                role={onNodeClick ? "button" : "img"}
                aria-label={`${n.label ?? n.key}: ${formatted}`}
                onMouseEnter={() => setActive(n.key)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(n.key)}
                onBlur={() => setActive(null)}
                onClick={onNodeClick ? () => onNodeClick(n) : undefined}
                onKeyDown={
                  onNodeClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onNodeClick(n);
                        }
                      }
                    : undefined
                }
                style={onNodeClick ? { cursor: "pointer" } : undefined}
              >
                <rect className={nodeRect} x={n.x} y={n.y} width={n.width} height={n.height} fill={nodeColor(n)} rx={2} />
                {renderNodeLabel ? (
                  renderNodeLabel(n, { formatted, side })
                ) : (
                  <text
                    className={label}
                    x={side === "right" ? n.x + n.width + 6 : n.x - 6}
                    y={n.y + n.height / 2}
                    textAnchor={side === "right" ? "start" : "end"}
                    dominantBaseline="middle"
                  >
                    {n.label ?? n.key}
                    {showValues ? <tspan className={labelValue}>{` ${formatted}`}</tspan> : null}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
