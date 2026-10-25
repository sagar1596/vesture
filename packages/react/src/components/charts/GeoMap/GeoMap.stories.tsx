import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GeoMap } from "./GeoMap";
import { geoJsonToRegions } from "./geo";
import type { GeoFeatureCollection } from "./geo";

// A tiny hand-made "continent" so the story has no external data dependency.
const tile = (x: number, y: number, w: number, h: number): [number, number][][] => [
  [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]
];
const geo: GeoFeatureCollection = {
  features: [
    { properties: { id: "n", name: "North" }, geometry: { type: "Polygon", coordinates: tile(-20, 20, 40, 15) } },
    { properties: { id: "w", name: "West" }, geometry: { type: "Polygon", coordinates: tile(-40, -10, 25, 28) } },
    { properties: { id: "c", name: "Central" }, geometry: { type: "Polygon", coordinates: tile(-12, -10, 22, 28) } },
    { properties: { id: "e", name: "East" }, geometry: { type: "Polygon", coordinates: tile(12, -10, 28, 28) } },
    { properties: { id: "s", name: "South" }, geometry: { type: "Polygon", coordinates: tile(-15, -35, 40, 22) } }
  ]
};
const values: Record<string, number> = { n: 120, w: 45, c: 300, e: 210, s: 80 };

const meta: Meta<typeof GeoMap> = { title: "Components/Charts/GeoMap", component: GeoMap };
export default meta;
type Story = StoryObj<typeof GeoMap>;

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<string>();
    const { regions, project } = geoJsonToRegions(geo, { width: 800, height: 500 });
    const withValues = regions.map((r) => ({ ...r, value: values[r.key] }));
    const [cx, cy] = project(0, 5);
    const [ex, ey] = project(25, 5);
    return (
      <GeoMap
        regions={withValues}
        mapWidth={800}
        mapHeight={500}
        width={640}
        showLabels
        selectedKey={selected}
        onRegionClick={(r) => setSelected(r.key === selected ? undefined : r.key)}
        markers={[
          { key: "hq", x: cx, y: cy, value: 900, label: "HQ" },
          { key: "dc", x: ex, y: ey, value: 200, label: "Data center", color: "#d9822b" }
        ]}
      />
    );
  }
};
