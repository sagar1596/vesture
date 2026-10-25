import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VirtualList } from "./VirtualList";
import type { VirtualListHandle } from "./VirtualList";
import { buildOffsets, findIndex, scrollTopFor, visibleRange } from "./virtual-math";

describe("virtual-math", () => {
  const offsets = buildOffsets([10, 20, 30, 40], 0);
  it("builds prefix offsets including gaps", () => {
    expect(offsets).toEqual([0, 10, 30, 60, 100]);
    expect(buildOffsets([10, 10, 10], 5)).toEqual([0, 15, 30, 40]);
  });
  it("finds the item containing a y position", () => {
    expect(findIndex(offsets, 0)).toBe(0);
    expect(findIndex(offsets, 9)).toBe(0);
    expect(findIndex(offsets, 10)).toBe(1);
    expect(findIndex(offsets, 59)).toBe(2);
    expect(findIndex(offsets, 5000)).toBe(3);
  });
  it("computes the window with overscan, clamped", () => {
    expect(visibleRange(offsets, 0, 25, 0)).toEqual([0, 2]);
    expect(visibleRange(offsets, 30, 20, 1)).toEqual([1, 4]);
  });
  it("computes scroll targets per alignment", () => {
    expect(scrollTopFor(offsets, 3, 50, "start", 0)).toBe(50);
    expect(scrollTopFor(offsets, 1, 40, "end", 0)).toBe(0);
    expect(scrollTopFor(offsets, 2, 40, "center", 0)).toBe(25);
    expect(scrollTopFor(offsets, 1, 40, "auto", 0)).toBe(0);
    expect(scrollTopFor(offsets, 3, 40, "auto", 0)).toBe(60);
  });
});

const items = Array.from({ length: 1000 }, (_, i) => `Row ${i}`);

describe("VirtualList", () => {
  it("renders only the visible window", () => {
    render(<VirtualList items={items} height={200} itemHeight={20} overscan={2} renderItem={(t) => <span>{t}</span>} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows.length).toBeLessThan(20);
    expect(screen.getByText("Row 0")).toBeInTheDocument();
    expect(screen.queryByText("Row 500")).toBeNull();
  });
  it("moves the window on scroll", () => {
    render(<VirtualList items={items} height={200} itemHeight={20} overscan={0} renderItem={(t) => <span>{t}</span>} />);
    fireEvent.scroll(screen.getByTestId("virtual-list"), { target: { scrollTop: 10_000 } });
    expect(screen.getByText("Row 500")).toBeInTheDocument();
    expect(screen.queryByText("Row 0")).toBeNull();
  });
  it("supports per-row heights", () => {
    render(<VirtualList items={items} height={100} itemHeight={(_, i) => (i === 0 ? 100 : 20)} overscan={0} renderItem={(t) => <span>{t}</span>} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Row 1").closest("[role=listitem]")).toHaveStyle({ top: "100px" });
  });
  it("exposes aria position info", () => {
    render(<VirtualList items={items} height={100} itemHeight={20} renderItem={(t) => <span>{t}</span>} />);
    const first = screen.getAllByRole("listitem")[0]!;
    expect(first).toHaveAttribute("aria-posinset", "1");
    expect(first).toHaveAttribute("aria-setsize", "1000");
  });
  it("scrolls to an index through the handle", () => {
    const ref = createRef<VirtualListHandle>();
    render(<VirtualList ref={ref} items={items} height={200} itemHeight={20} overscan={0} renderItem={(t) => <span>{t}</span>} />);
    act(() => ref.current!.scrollToIndex(300, "start"));
    expect(screen.getByText("Row 300")).toBeInTheDocument();
    act(() => ref.current!.scrollToTop());
    expect(screen.getByText("Row 0")).toBeInTheDocument();
  });
  it("fires onEndReached once near the bottom and re-arms when items grow", () => {
    const onEndReached = vi.fn();
    const small = items.slice(0, 50);
    const { rerender } = render(
      <VirtualList items={small} height={200} itemHeight={20} endReachedThreshold={50} onEndReached={onEndReached} renderItem={(t) => <span>{t}</span>} />
    );
    expect(onEndReached).not.toHaveBeenCalled();
    fireEvent.scroll(screen.getByTestId("virtual-list"), { target: { scrollTop: 800 } });
    fireEvent.scroll(screen.getByTestId("virtual-list"), { target: { scrollTop: 810 } });
    expect(onEndReached).toHaveBeenCalledTimes(1);
    rerender(<VirtualList items={items.slice(0, 100)} height={200} itemHeight={20} endReachedThreshold={50} onEndReached={onEndReached} renderItem={(t) => <span>{t}</span>} />);
    fireEvent.scroll(screen.getByTestId("virtual-list"), { target: { scrollTop: 1800 } });
    expect(onEndReached).toHaveBeenCalledTimes(2);
  });
  it("calls onEndReached right away when the list is shorter than the viewport", () => {
    const onEndReached = vi.fn();
    render(<VirtualList items={["a", "b"]} height={400} itemHeight={20} onEndReached={onEndReached} renderItem={(t) => <span>{t}</span>} />);
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });
  it("shows a loading row, suppresses onEndReached while loading, and an empty state", () => {
    const onEndReached = vi.fn();
    const { rerender } = render(
      <VirtualList items={["a"]} height={100} itemHeight={20} loading onEndReached={onEndReached} renderItem={(t) => <span>{t}</span>} />
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(onEndReached).not.toHaveBeenCalled();
    rerender(<VirtualList items={[]} height={100} itemHeight={20} emptyState="Nothing here" renderItem={() => null} />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
  it("pages with the keyboard", () => {
    render(<VirtualList items={items} height={200} itemHeight={20} overscan={0} renderItem={(t) => <span>{t}</span>} />);
    const list = screen.getByTestId("virtual-list");
    fireEvent.keyDown(list, { key: "End" });
    expect(screen.getByText("Row 999")).toBeInTheDocument();
    fireEvent.keyDown(list, { key: "Home" });
    expect(screen.getByText("Row 0")).toBeInTheDocument();
  });
});
