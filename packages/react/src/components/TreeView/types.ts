import type { ReactNode } from "react";

export interface TreeNode<T = unknown> {
  id: string;
  label: ReactNode;
  children?: TreeNode<T>[];
  /** Supports lazy-loaded nodes where `children` is undefined until loaded. */
  hasChildren?: boolean;
  data?: T;
}

export type TreeViewSelectable = "none" | "single" | "multi";

export interface TreeViewProps<T = unknown> {
  nodes: TreeNode<T>[];
  expanded?: Set<string>;
  defaultExpanded?: Set<string>;
  onExpandedChange?: (expanded: Set<string>) => void;
  selected?: Set<string>;
  defaultSelected?: Set<string>;
  onSelectedChange?: (selected: Set<string>) => void;
  selectable?: TreeViewSelectable;
  /** Called when a node with hasChildren: true and children: undefined is expanded. */
  onLoadChildren?: (node: TreeNode<T>) => Promise<TreeNode<T>[]>;
  height?: number;
  rowHeight?: number;
}
