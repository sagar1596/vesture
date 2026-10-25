import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GeoMap } from "./GeoMap";
import { colorLevel, geoJsonToRegions } from "./geo";
import type { GeoFeatureCollection } from "./geo";

const geo: GeoFeatureCollection = {
  features: [
    {
      properties: { id: "w", name: "West" },
      geometry: { type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] }
    },
    {
      properties: { id: "e", name: "East" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [[[20, 0], [30, 0], [30, 10], [20, 10], [20, 0]]],
          [[[40, 0], [45, 0], [45, 5], [40, 5], [40, 0]]]
        ]
      }
    },
    { properties: { id: "pt" }, geometry: { type: "Point", coordinates: [1, 1] } }
  ]
};

describe("geoJsonToRegions", () => {
  it("builds one region per feature with key/label from properties", () => {
    const { regions } = geoJsonToRegions(geo, { width: 450, height: 100, padding: 0 });
    expect(regions.map((r) => [r.key, r.label])).toEqual([
      ["w", "West"],
      ["e", "East"],
      ["pt", "pt"]
    ]);
    expect(regions[2]!.path).toBe("");
    expect((regions[1]!.path.match(/Z/g) ?? []).length).toBe(2);
  });
  it("fits the data into the box and flips latitude", () => {
    const { project } = geoJsonToRegions(geo, { width: 450, height: 100, padding: 0 });
    const [x0, yTop] = project(0, 10);
    const [x1, yBottom] = project(45, 0);
    expect(x0).toBeCloseTo(0);
    expect(yTop).toBeLessThan(yBottom);
    expect(x1).toBeCloseTo(450);
  });
  it("returns nothing for empty input", () => {
    expect(geoJsonToRegions({ features: [] }, { width: 10, height: 10 }).regions).toEqual([]);
  });
});

describe("colorLevel", () => {
  it("is 0 for missing and spans 1..levels-1", () => {
    expect(colorLevel(undefined, 0, 10, 5)).toBe(0);
    expect(colorLevel(0, 0, 10, 5)).toBe(1);
    expect(colorLevel(10, 0, 10, 5)).toBe(4);
  });
});

const regions = [
  { key: "a", label: "Alpha", path: "M0,0L10,0L10,10Z", value: 10 },
  { key: "b", label: "Beta", path: "M20,0L30,0L30,10Z", value: 90 },
  { key: "c", label: "Gamma", path: "M40,0L50,0L50,10Z" }
];

describe("GeoMap", () => {
  it("colors regions by value and leaves no-data regions on the fallback", () => {
    render(<GeoMap regions={regions} mapWidth={50} mapHeight={10} width={500} colors={["#000", "#111", "#222"]} noDataColor="#999" />);
    const els = screen.getAllByTestId("geomap-region");
    expect(els.map((e) => e.getAttribute("fill"))).toEqual(["#111", "#222", "#999"]);
  });
  it("fires region and marker clicks", () => {
    const onRegionClick = vi.fn();
    const onMarkerClick = vi.fn();
    render(
      <GeoMap
        regions={regions}
        mapWidth={50}
        mapHeight={10}
        width={500}
        markers={[{ key: "m", x: 5, y: 5, value: 3 }]}
        onRegionClick={onRegionClick}
        onMarkerClick={onMarkerClick}
      />
    );
    fireEvent.click(screen.getByLabelText("Beta: 90"));
    fireEvent.click(screen.getByTestId("geomap-marker"));
    expect(onRegionClick).toHaveBeenCalledWith(regions[1]);
    expect(onMarkerClick).toHaveBeenCalledTimes(1);
  });
  it("zooms with the buttons, keys and resets", () => {
    render(<GeoMap regions={regions} mapWidth={50} mapHeight={10} width={500} maxZoom={4} />);
    const scaleOf = () => Number(/scale\(([\d.]+)\)/.exec(screen.getByTestId("geomap-viewport").getAttribute("transform")!)![1]);
    const base = scaleOf();
    fireEvent.click(screen.getByLabelText("Zoom in"));
    expect(scaleOf()).toBeCloseTo(base * 1.5);
    fireEvent.keyDown(screen.getByRole("group"), { key: "+" });
    expect(scaleOf()).toBeGreaterThan(base * 1.5);
    fireEvent.click(screen.getByLabelText("Reset view"));
    expect(scaleOf()).toBeCloseTo(base);
  });
  it("hides controls when not zoomable and shows an empty state without regions", () => {
    const { rerender } = render(<GeoMap regions={regions} mapWidth={50} mapHeight={10} width={500} zoomable={false} />);
    expect(screen.queryByLabelText("Zoom in")).toBeNull();
    rerender(<GeoMap regions={[]} mapWidth={50} mapHeight={10} width={500} />);
    expect(screen.getByText("No map data")).toBeInTheDocument();
  });
});
