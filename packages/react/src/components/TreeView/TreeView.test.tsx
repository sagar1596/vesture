import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TreeView } from "./TreeView";
import type { TreeNode } from "./types";

const nodes: TreeNode[] = [
  {
    id: "a",
    label: "A",
    children: [
      { id: "a-1", label: "A1" },
      { id: "a-2", label: "A2" },
    ],
  },
  { id: "b", label: "B" },
];

function getRow(text: string): HTMLElement {
  return screen.getByText(text).closest('[role="treeitem"]') as HTMLElement;
}

describe("TreeView", () => {
  it("expands and collapses a node, updating the visible set", async () => {
    render(<TreeView nodes={nodes} height={200} rowHeight={32} />);

    expect(screen.queryByText("A1")).not.toBeInTheDocument();

    fireEvent.keyDown(getRow("A"), { key: "ArrowRight" });

    expect(await screen.findByText("A1")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();

    fireEvent.keyDown(getRow("A"), { key: "ArrowLeft" });
    await waitFor(() => {
      expect(screen.queryByText("A1")).not.toBeInTheDocument();
    });
  });

  describe("cascading selection", () => {
    it("selecting a parent selects all loaded children", () => {
      const onSelectedChange = vi.fn();
      render(
        <TreeView
          nodes={nodes}
          selectable="multi"
          defaultExpanded={new Set(["a"])}
          onSelectedChange={onSelectedChange}
        />
      );

      const checkboxA = screen.getAllByRole("checkbox")[0]!;
      fireEvent.click(checkboxA);

      const calls = onSelectedChange.mock.calls;
      const lastCall = calls[calls.length - 1]![0] as Set<string>;
      expect(lastCall.has("a")).toBe(true);
      expect(lastCall.has("a-1")).toBe(true);
      expect(lastCall.has("a-2")).toBe(true);
    });

    it("selecting all children marks the parent checked, not indeterminate", () => {
      render(
        <TreeView
          nodes={nodes}
          selectable="multi"
          defaultExpanded={new Set(["a"])}
          defaultSelected={new Set(["a-2"])}
        />
      );

      const checkboxA1 = screen.getAllByRole("checkbox")[1]!;
      fireEvent.click(checkboxA1);

      const checkboxA = screen.getAllByRole("checkbox")[0]! as HTMLInputElement;
      expect(checkboxA.checked).toBe(true);
      expect(checkboxA.indeterminate).toBe(false);
    });

    it("selecting some children marks the parent indeterminate", () => {
      render(
        <TreeView
          nodes={nodes}
          selectable="multi"
          defaultExpanded={new Set(["a"])}
          defaultSelected={new Set(["a-1"])}
        />
      );

      const checkboxA = screen.getAllByRole("checkbox")[0]! as HTMLInputElement;
      expect(checkboxA.checked).toBe(false);
      expect(checkboxA.indeterminate).toBe(true);
    });
  });

  describe("lazy loading", () => {
    it("calls onLoadChildren exactly once per node even after repeated expand/collapse", async () => {
      const onLoadChildren = vi.fn().mockResolvedValue([
        { id: "lazy-1", label: "Lazy Child 1" },
      ]);
      const lazyNodes: TreeNode[] = [
        { id: "root", label: "Root", hasChildren: true },
      ];

      render(<TreeView nodes={lazyNodes} onLoadChildren={onLoadChildren} />);

      fireEvent.keyDown(getRow("Root"), { key: "ArrowRight" });
      await screen.findByText("Lazy Child 1");
      expect(onLoadChildren).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(getRow("Root"), { key: "ArrowLeft" });
      await waitFor(() => {
        expect(screen.queryByText("Lazy Child 1")).not.toBeInTheDocument();
      });

      fireEvent.keyDown(getRow("Root"), { key: "ArrowRight" });
      expect(await screen.findByText("Lazy Child 1")).toBeInTheDocument();
      expect(onLoadChildren).toHaveBeenCalledTimes(1);
    });
  });

  describe("keyboard navigation", () => {
    it("ArrowDown/ArrowUp move across visible rows only, skipping collapsed children", () => {
      render(<TreeView nodes={nodes} />);

      fireEvent.keyDown(getRow("A"), { key: "ArrowDown" });
      expect(getRow("B")).toHaveFocus();

      fireEvent.keyDown(getRow("B"), { key: "ArrowUp" });
      expect(getRow("A")).toHaveFocus();
    });

    it("ArrowRight expands a collapsed parent then descends into it", async () => {
      render(<TreeView nodes={nodes} />);

      fireEvent.keyDown(getRow("A"), { key: "ArrowRight" });
      expect(await screen.findByText("A1")).toBeInTheDocument();

      fireEvent.keyDown(getRow("A"), { key: "ArrowRight" });
      expect(getRow("A1")).toHaveFocus();
    });

    it("ArrowLeft collapses an expanded parent, or ascends to the parent from a child", async () => {
      render(<TreeView nodes={nodes} defaultExpanded={new Set(["a"])} />);

      fireEvent.keyDown(getRow("A1"), { key: "ArrowLeft" });
      expect(getRow("A")).toHaveFocus();

      fireEvent.keyDown(getRow("A"), { key: "ArrowLeft" });
      await waitFor(() => {
        expect(screen.queryByText("A1")).not.toBeInTheDocument();
      });
    });
  });
});
