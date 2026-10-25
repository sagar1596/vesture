import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardGrid } from "./DashboardGrid";
import { collides, compact, moveItem, normalizeLayout, resizeItem } from "./grid-layout";
import type { GridItem } from "./grid-layout";

const base: GridItem[] = [
  { id: "a", x: 0, y: 0, w: 4, h: 2 },
  { id: "b", x: 4, y: 0, w: 4, h: 2 },
  { id: "c", x: 0, y: 2, w: 4, h: 2 }
];
const pos = (l: GridItem[], id: string) => {
  const i = l.find((x) => x.id === id)!;
  return [i.x, i.y];
};

describe("grid-layout", () => {
  it("detects overlap but not touching edges or self", () => {
    expect(collides(base[0]!, base[1]!)).toBe(false);
    expect(collides(base[0]!, { id: "z", x: 3, y: 1, w: 2, h: 2 })).toBe(true);
    expect(collides(base[0]!, base[0]!)).toBe(false);
  });
  it("pushes colliding tiles down", () => {
    const out = moveItem(base, "b", 0, 0, 12, false);
    expect(pos(out, "b")).toEqual([0, 0]);
    expect(pos(out, "a")).toEqual([0, 2]);
    expect(out.some((i, k) => out.some((j, m) => k !== m && collides(i, j)))).toBe(false);
  });
  it("compacts upward after a move", () => {
    const out = moveItem(base, "a", 8, 0, 12);
    expect(pos(out, "a")).toEqual([8, 0]);
    expect(pos(out, "c")).toEqual([0, 0]);
  });
  it("clamps to the grid and to size limits", () => {
    expect(pos(moveItem(base, "b", 20, -4, 12), "b")).toEqual([8, 0]);
    const r = resizeItem([{ id: "a", x: 10, y: 0, w: 2, h: 2, minW: 2, maxH: 3 }], "a", 9, 9, 12);
    expect(r[0]).toMatchObject({ w: 2, h: 3 });
    const small = resizeItem(base, "a", 0, 0, 12);
    expect(small.find((i) => i.id === "a")).toMatchObject({ w: 1, h: 1 });
  });
  it("never moves static tiles", () => {
    const withStatic = [{ id: "s", x: 0, y: 0, w: 4, h: 2, static: true }, { id: "m", x: 4, y: 0, w: 4, h: 2 }];
    expect(moveItem(withStatic, "s", 5, 5, 12)).toBe(withStatic);
    const out = moveItem(withStatic, "m", 0, 0, 12);
    expect(pos(out, "s")).toEqual([0, 0]);
    expect(pos(out, "m")).toEqual([0, 2]);
  });
  it("compact and normalize fix gaps and overlaps", () => {
    expect(pos(compact([{ id: "a", x: 0, y: 7, w: 2, h: 1 }]), "a")).toEqual([0, 0]);
    const out = normalizeLayout([{ id: "a", x: 0, y: 0, w: 4, h: 2 }, { id: "b", x: 1, y: 1, w: 4, h: 2 }], 12);
    expect(collides(out[0]!, out[1]!)).toBe(false);
  });
});

describe("DashboardGrid", () => {
  const renderItem = (i: GridItem) => <div>tile {i.id}</div>;

  it("positions tiles from the layout using the given width", () => {
    render(<DashboardGrid width={1200} cols={12} gap={0} rowHeight={50} defaultLayout={base} renderItem={renderItem} />);
    const b = screen.getAllByTestId("dashboard-item").find((n) => n.dataset.id === "b")!;
    expect(b.style.left).toBe("400px");
    expect(b.style.width).toBe("400px");
    expect(b.style.height).toBe("100px");
  });
  it("is not interactive unless editable", () => {
    render(<DashboardGrid width={1200} defaultLayout={base} renderItem={renderItem} />);
    expect(screen.queryByLabelText("Resize a")).toBeNull();
    expect(screen.getAllByTestId("dashboard-item")[0]!.getAttribute("tabindex")).toBeNull();
  });
  it("moves with arrow keys and reports the layout", () => {
    const onLayoutChange = vi.fn();
    render(<DashboardGrid width={1200} editable defaultLayout={base} onLayoutChange={onLayoutChange} renderItem={renderItem} />);
    const a = screen.getAllByTestId("dashboard-item")[0]!;
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    const next = onLayoutChange.mock.calls[0]![0] as GridItem[];
    expect(next.find((i) => i.id === "a")).toMatchObject({ x: 1, y: 0 });
    expect(screen.getByRole("status")).toHaveTextContent("a moved to column 2, row 1");
  });
  it("resizes with shift+arrows and via the handle's keys", () => {
    const onLayoutChange = vi.fn();
    render(<DashboardGrid width={1200} editable defaultLayout={base} onLayoutChange={onLayoutChange} renderItem={renderItem} />);
    fireEvent.keyDown(screen.getAllByTestId("dashboard-item")[0]!, { key: "ArrowDown", shiftKey: true });
    expect((onLayoutChange.mock.calls[0]![0] as GridItem[]).find((i) => i.id === "a")).toMatchObject({ h: 3 });
    fireEvent.keyDown(screen.getByLabelText("Resize c"), { key: "ArrowRight" });
    expect((onLayoutChange.mock.calls[1]![0] as GridItem[]).find((i) => i.id === "c")).toMatchObject({ w: 5 });
  });
  it("drags with pointer events and commits on release", () => {
    const onLayoutChange = vi.fn();
    render(
      <DashboardGrid width={1200} cols={12} gap={0} rowHeight={50} editable defaultLayout={base} onLayoutChange={onLayoutChange} renderItem={renderItem} />
    );
    const c = screen.getAllByTestId("dashboard-item").find((n) => n.dataset.id === "c")!;
    fireEvent.pointerDown(c, { clientX: 10, clientY: 10, pointerId: 1 });
    expect(c.dataset.dragging).toBe("true");
    fireEvent.pointerMove(c, { clientX: 810, clientY: 10, pointerId: 1 });
    expect(screen.getByTestId("dashboard-placeholder")).toBeInTheDocument();
    fireEvent.pointerUp(c, { pointerId: 1 });
    const next = onLayoutChange.mock.calls[0]![0] as GridItem[];
    expect(next.find((i) => i.id === "c")).toMatchObject({ x: 8, y: 0 });
    expect(screen.queryByTestId("dashboard-placeholder")).toBeNull();
  });
  it("does not start a drag from inside data-no-drag content", () => {
    render(
      <DashboardGrid
        width={1200}
        editable
        defaultLayout={base}
        renderItem={(i) => <span data-no-drag data-testid={`inner-${i.id}`}>x</span>}
      />
    );
    fireEvent.pointerDown(screen.getByTestId("inner-a"), { clientX: 0, clientY: 0, pointerId: 1 });
    expect(screen.getAllByTestId("dashboard-item")[0]!.dataset.dragging).toBe("false");
  });
  it("respects a controlled layout", () => {
    render(<DashboardGrid width={1200} editable layout={base} renderItem={renderItem} />);
    const a = screen.getAllByTestId("dashboard-item")[0]!;
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(a.style.left).toBe("0px");
  });
});
