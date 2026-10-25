import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DashboardGrid } from "./DashboardGrid";
import type { GridItem } from "./grid-layout";

const initial: GridItem[] = [
  { id: "revenue", x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
  { id: "users", x: 6, y: 0, w: 3, h: 2 },
  { id: "churn", x: 9, y: 0, w: 3, h: 2 },
  { id: "activity", x: 6, y: 2, w: 6, h: 2 },
  { id: "pinned", x: 0, y: 3, w: 12, h: 1, static: true }
];

const Tile = ({ item }: { item: GridItem }) => (
  <div
    style={{
      height: "100%",
      boxSizing: "border-box",
      padding: 12,
      borderRadius: 8,
      border: "1px solid var(--border, #ccc)",
      background: item.static ? "#eef" : "#fff",
      fontFamily: "system-ui"
    }}
  >
    <strong>{item.id}</strong>
    <div style={{ fontSize: 12, opacity: 0.7 }}>
      {item.w}×{item.h} at ({item.x},{item.y})
    </div>
  </div>
);

const meta: Meta<typeof DashboardGrid> = { title: "Components/DashboardGrid", component: DashboardGrid };
export default meta;
type Story = StoryObj<typeof DashboardGrid>;

export const Editable: Story = {
  render: () => {
    const [layout, setLayout] = useState(initial);
    return <DashboardGrid layout={layout} onLayoutChange={setLayout} editable rowHeight={70} renderItem={(i) => <Tile item={i} />} />;
  }
};
export const ReadOnly: Story = {
  render: () => <DashboardGrid defaultLayout={initial} rowHeight={70} renderItem={(i) => <Tile item={i} />} />
};
export const FreePlacementNoCompact: Story = {
  render: () => <DashboardGrid defaultLayout={initial} editable compactVertically={false} cols={8} gap={4} renderItem={(i) => <Tile item={i} />} />
};
