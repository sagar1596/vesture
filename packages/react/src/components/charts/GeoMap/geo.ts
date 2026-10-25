export type Position = [number, number];

export interface GeoFeature {
  properties?: Record<string, unknown> | null;
  geometry: { type: "Polygon"; coordinates: Position[][] } | { type: "MultiPolygon"; coordinates: Position[][][] } | { type: string; coordinates?: unknown };
}
export interface GeoFeatureCollection {
  features: GeoFeature[];
}

export interface GeoRegion {
  key: string;
  label: string;
  /** SVG path `d` in the map's own coordinate space (see `geoJsonToRegions`). */
  path: string;
  value?: number;
}

export interface GeoProjectionOptions {
  /** Map coordinate space size. */
  width: number;
  height: number;
  padding?: number;
  /** Feature property used for `key` / `label`. */
  keyProp?: string;
  labelProp?: string;
}

export type Projector = (lon: number, lat: number) => Position;

function polygonsOf(f: GeoFeature): Position[][][] {
  if (f.geometry.type === "Polygon") return [f.geometry.coordinates as Position[][]];
  if (f.geometry.type === "MultiPolygon") return f.geometry.coordinates as Position[][][];
  return [];
}

/**
 * Fits GeoJSON polygons into a `width` × `height` box with an equirectangular projection
 * (x = lon, y = -lat, uniform scale). Returns ready-to-render regions plus the `project`
 * function, so you can place markers with the same transform.
 */
export function geoJsonToRegions(
  geo: GeoFeatureCollection,
  { width, height, padding = 8, keyProp = "id", labelProp = "name" }: GeoProjectionOptions
): { regions: GeoRegion[]; project: Projector } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const f of geo.features) {
    for (const poly of polygonsOf(f)) {
      for (const ring of poly) {
        for (const [lon, lat] of ring) {
          minX = Math.min(minX, lon);
          maxX = Math.max(maxX, lon);
          minY = Math.min(minY, -lat);
          maxY = Math.max(maxY, -lat);
        }
      }
    }
  }
  if (!Number.isFinite(minX)) return { regions: [], project: () => [0, 0] };
  const scale = Math.min((width - padding * 2) / (maxX - minX || 1), (height - padding * 2) / (maxY - minY || 1));
  const offX = (width - (maxX - minX) * scale) / 2;
  const offY = (height - (maxY - minY) * scale) / 2;
  const project: Projector = (lon, lat) => [offX + (lon - minX) * scale, offY + (-lat - minY) * scale];
  const fmt = (n: number) => Math.round(n * 100) / 100;

  const regions = geo.features.map((f, i) => {
    const props = f.properties ?? {};
    const d = polygonsOf(f)
      .map((poly) =>
        poly
          .map((ring) => ring.map(([lon, lat], k) => {
            const [x, y] = project(lon, lat);
            return `${k ? "L" : "M"}${fmt(x)},${fmt(y)}`;
          }).join("") + "Z")
          .join("")
      )
      .join("");
    return {
      key: String(props[keyProp] ?? i),
      label: String(props[labelProp] ?? props[keyProp] ?? i),
      path: d
    };
  });
  return { regions, project };
}

/** Level 0 = no data; 1..levels-1 spread across [min, max]. */
export function colorLevel(value: number | undefined, min: number, max: number, levels: number): number {
  if (value === undefined || Number.isNaN(value) || levels < 2) return 0;
  if (max <= min) return levels - 1;
  const frac = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return 1 + Math.min(levels - 2, Math.floor(frac * (levels - 1)));
}
