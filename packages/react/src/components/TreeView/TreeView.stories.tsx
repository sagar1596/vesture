import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TreeView } from "./TreeView";
import type { TreeNode } from "./types";

const meta: Meta<typeof TreeView> = {
  title: "Components/TreeView",
  component: TreeView,
};

export default meta;
type Story = StoryObj<typeof TreeView>;

const staticNodes: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "components",
        label: "components",
        children: [
          { id: "button", label: "Button.tsx" },
          { id: "input", label: "Input.tsx" },
          {
            id: "treeview",
            label: "TreeView",
            children: [
              { id: "treeview-tsx", label: "TreeView.tsx" },
              { id: "treeview-css", label: "TreeView.css.ts" },
            ],
          },
        ],
      },
      { id: "index", label: "index.ts" },
    ],
  },
  {
    id: "package",
    label: "package.json",
  },
];

export const Default: Story = {
  render: () => (
    <TreeView
      nodes={staticNodes}
      defaultExpanded={new Set(["src", "components"])}
    />
  ),
};

export const WithCheckboxSelection: Story = {
  render: () => (
    <TreeView
      nodes={staticNodes}
      selectable="multi"
      defaultExpanded={new Set(["src", "components", "treeview"])}
      defaultSelected={new Set(["button", "input"])}
    />
  ),
};

function fakeFetchChildren(node: TreeNode): Promise<TreeNode[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: `${node.id}-a`, label: `${String(node.label)} / Child A` },
        { id: `${node.id}-b`, label: `${String(node.label)} / Child B` },
        {
          id: `${node.id}-c`,
          label: `${String(node.label)} / Child C`,
          hasChildren: true,
        },
      ]);
    }, 800);
  });
}

const lazyNodes: TreeNode[] = [
  { id: "lazy-1", label: "Folder One", hasChildren: true },
  { id: "lazy-2", label: "Folder Two", hasChildren: true },
  { id: "lazy-3", label: "Folder Three", hasChildren: true },
];

export const LazyLoading: Story = {
  render: () => {
    function LazyLoadingDemo() {
      const [selected, setSelected] = useState<Set<string>>(new Set());
      return (
        <TreeView
          nodes={lazyNodes}
          selectable="multi"
          selected={selected}
          onSelectedChange={setSelected}
          onLoadChildren={fakeFetchChildren}
        />
      );
    }
    return <LazyLoadingDemo />;
  },
};

function buildLargeDataset(): TreeNode[] {
  function buildBranch(prefix: string, depth: number, breadth: number): TreeNode[] {
    return Array.from({ length: breadth }, (_, i) => {
      const id = `${prefix}-${i}`;
      return {
        id,
        label: `Node ${id}`,
        children: depth > 0 ? buildBranch(id, depth - 1, breadth) : undefined,
      };
    });
  }
  return buildBranch("n", 3, 8);
}

const largeNodes = buildLargeDataset();
const largeExpanded = new Set(
  largeNodes.flatMap((node) => [
    node.id,
    ...(node.children ?? []).map((child) => child.id),
  ])
);

export const LargeDataset: Story = {
  render: () => (
    <TreeView nodes={largeNodes} defaultExpanded={largeExpanded} height={400} />
  ),
};
