import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, ReactElement, ReactNode } from "react";
import { vars } from "@vesture/tokens";
import { colorLevel } from "./geo";
import type { GeoRegion } from "./geo";
import { controlButton, controls, emptyState, legend, legendCell, marker as markerClass, region as regionClass, root, surface } from "./GeoMap.css";

export interface GeoMarker {
  key: string;
  /** Position in the map's coordinate space (use the `project` returned by `geoJsonToRegions`). */
  x: number;
  y: number;
  value?: number;
  label?: string;
  color?: string;
}

export interface GeoMapProps {
  regions: GeoRegion[];
  /** Coordinate-space size the region paths were built for. */
  mapWidth: number;
  mapHeight: number;
  /** Rendered size in px. Height defaults to the map's aspect ratio. */
  width: number;
  height?: number;
  markers?: GeoMarker[];
  /** One color per level; index 0 is "no data". Defaults to tints of the primary token. */
  colors?: string[];
  domain?: [number, number];
  noDataColor?: string;
  /** Bubble radius range (px, before zoom) for markers with a value. */
  markerRadius?: [number, number];
  selectedKey?: string;
  /** Enables wheel/drag/button pan and zoom. */
  zoomable?: boolean;
  minZoom?: number;
  maxZoom?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  formatValue?: (v: number) => string;
  /** Extra content drawn in map coordinates above regions and markers. */
  children?: ReactNode;
  onRegionClick?: (region: GeoRegion) => void;
  onMarkerClick?: (marker: GeoMarker) => void;
  className?: string;
}

const defaultColors = [0, 22, 40, 62, 85].map((pct) =>
  pct === 0 ? vars.color.surfaceRaised : `color-mix(in srgb, ${vars.color.primary} ${pct}%, ${vars.color.surface})`
);

/**
 * Choropleth + bubble map over caller-supplied SVG region paths (no map data is bundled).
 * Build regions from GeoJSON with `geoJsonToRegions`.
 */
export function GeoMap({
  regions,
  mapWidth,
  mapHeight,
  width,
  height = Math.round((width * mapHeight) / mapWidth),
  markers = [],
  colors = defaultColors,
  domain,
  noDataColor = vars.color.surfaceRaised,
  markerRadius = [4, 18],
  selectedKey,
  zoomable = true,
  minZoom = 1,
  maxZoom = 8,
  showLegend = true,
  showLabels = false,
  formatValue = String,
  children,
  onRegionClick,
  onMarkerClick,
  className
}: GeoMapProps): ReactElement {
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const drag = useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const clampView = (zoom: number, x: number, y: number) => {
    const z = Math.min(maxZoom, Math.max(minZoom, zoom));
    const minX = width - width * z;
    const minY = height - height * z;
    return { zoom: z, x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  };
  const zoomAt = (factor: number, cx = width / 2, cy = height / 2) => {
    const v = viewRef.current;
    const z = Math.min(maxZoom, Math.max(minZoom, v.zoom * factor));
    const k = z / v.zoom;
    setView(clampView(z, cx - (cx - v.x) * k, cy - (cy - v.y) * k));
  };
  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const el = ref.current;
    if (!el || !zoomable) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAtRef.current(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomable]);

  if (regions.length === 0) {
    return (
      <div className={[root, className].filter(Boolean).join(" ")} style={{ width, height }}>
        <div className={emptyState} style={{ width, height }}>
          No map data
        </div>
      </div>
    );
  }

  const vals = regions.map((r) => r.value).filter((v): v is number => v !== undefined);
  const [min, max] = domain ?? [vals.length ? Math.min(...vals) : 0, vals.length ? Math.max(...vals) : 0];
  const mvals = markers.map((m) => m.value).filter((v): v is number => v !== undefined);
  const mMin = mvals.length ? Math.min(...mvals) : 0;
  const mMax = mvals.length ? Math.max(...mvals) : 0;
  const radius = (m: GeoMarker) =>
    m.value === undefined
      ? markerRadius[0]
      : markerRadius[0] + (mMax === mMin ? 0.5 : Math.sqrt((m.value - mMin) / (mMax - mMin))) * (markerRadius[1] - markerRadius[0]);
  const fit = width / mapWidth;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!zoomable || (e.target as Element).closest("button")) return;
    e.preventDefault();
    e.currentTarget.focus();
    drag.current = { px: e.clientX, py: e.clientY, x: view.x, y: view.y, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not implemented in every DOM env */
    }
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    setView(clampView(view.zoom, d.x + dx, d.y + dy));
  };
  const onPointerUp = () => {
    suppressClick.current = !!drag.current?.moved;
    drag.current = null;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!zoomable) return;
    const step = 40;
    if (e.key === "+" || e.key === "=") zoomAt(1.25);
    else if (e.key === "-") zoomAt(1 / 1.25);
    else if (e.key === "ArrowLeft") setView(clampView(view.zoom, view.x + step, view.y));
    else if (e.key === "ArrowRight") setView(clampView(view.zoom, view.x - step, view.y));
    else if (e.key === "ArrowUp") setView(clampView(view.zoom, view.x, view.y + step));
    else if (e.key === "ArrowDown") setView(clampView(view.zoom, view.x, view.y - step));
    else if (e.key === "0") setView({ zoom: 1, x: 0, y: 0 });
    else return;
    e.preventDefault();
  };
  const guardClick = <T,>(fn: (arg: T) => void, arg: T) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    fn(arg);
  };

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width }}>
      <div
        ref={ref}
        className={surface}
        style={{ width, height, cursor: zoomable ? undefined : "default" }}
        tabIndex={zoomable ? 0 : undefined}
        role="group"
        aria-label="Map. Arrow keys pan, plus and minus zoom."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <svg width={width} height={height} data-testid="geomap-svg">
          <g data-testid="geomap-viewport" transform={`translate(${view.x},${view.y}) scale(${view.zoom * fit})`}>
            {regions.map((r) => {
              const level = colorLevel(r.value, min, max, colors.length);
              const fill = r.value === undefined ? noDataColor : colors[level];
              return (
                <path
                  key={r.key}
                  className={regionClass}
                  data-testid="geomap-region"
                  data-level={level}
                  data-selected={selectedKey === r.key}
                  d={r.path}
                  fill={fill}
                  vectorEffect="non-scaling-stroke"
                  opacity={selectedKey !== undefined && selectedKey !== r.key ? 0.55 : 1}
                  tabIndex={onRegionClick ? 0 : undefined}
                  role={onRegionClick ? "button" : undefined}
                  aria-label={`${r.label}${r.value !== undefined ? `: ${formatValue(r.value)}` : ""}`}
                  style={onRegionClick ? { cursor: "pointer" } : undefined}
                  onClick={onRegionClick ? () => guardClick(onRegionClick, r) : undefined}
                  onKeyDown={
                    onRegionClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRegionClick(r);
                          }
                        }
                      : undefined
                  }
                >
                  <title>{`${r.label}${r.value !== undefined ? `: ${formatValue(r.value)}` : ""}`}</title>
                </path>
              );
            })}
            {markers.map((m) => (
              <circle
                key={m.key}
                className={markerClass}
                data-testid="geomap-marker"
                cx={m.x}
                cy={m.y}
                r={radius(m) / (view.zoom * fit)}
                fill={m.color ?? vars.chart.series2}
                vectorEffect="non-scaling-stroke"
                style={onMarkerClick ? { cursor: "pointer" } : undefined}
                onClick={onMarkerClick ? () => guardClick(onMarkerClick, m) : undefined}
              >
                <title>{`${m.label ?? m.key}${m.value !== undefined ? `: ${formatValue(m.value)}` : ""}`}</title>
              </circle>
            ))}
            {showLabels
              ? regions.map((r) => (
                  <RegionLabel key={r.key} region={r} scale={view.zoom * fit} />
                ))
              : null}
            {children}
          </g>
        </svg>
        {zoomable ? (
          <div className={controls}>
            <button type="button" className={controlButton} aria-label="Zoom in" onClick={() => zoomAt(1.5)}>
              +
            </button>
            <button type="button" className={controlButton} aria-label="Zoom out" onClick={() => zoomAt(1 / 1.5)}>
              −
            </button>
            <button type="button" className={controlButton} aria-label="Reset view" onClick={() => setView({ zoom: 1, x: 0, y: 0 })}>
              ⟲
            </button>
          </div>
        ) : null}
        {showLegend && vals.length > 0 ? (
          <div className={legend}>
            <span>{formatValue(min)}</span>
            {colors.slice(1).map((c, i) => (
              <span key={i} className={legendCell} style={{ background: c }} />
            ))}
            <span>{formatValue(max)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Label at the region's path bbox center, computed from its coordinates. */
function RegionLabel({ region, scale }: { region: GeoRegion; scale: number }): ReactElement | null {
  const nums = region.path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length < 4) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    minX = Math.min(minX, nums[i]!);
    maxX = Math.max(maxX, nums[i]!);
    minY = Math.min(minY, nums[i + 1]!);
    maxY = Math.max(maxY, nums[i + 1]!);
  }
  return (
    <text
      x={(minX + maxX) / 2}
      y={(minY + maxY) / 2}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={11 / scale}
      fill={vars.color.text}
      fontFamily={vars.font.body}
      pointerEvents="none"
    >
      {region.label}
    </text>
  );
}
