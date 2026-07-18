import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from "react";
import { vars } from "@vesture/tokens";
import { Checkbox } from "../Checkbox";
import { Spinner } from "../Spinner";
import {
  chevron,
  checkboxCell,
  label as labelClass,
  loadingSlot,
  root,
  row as rowClass,
  rowContent,
  scroller,
} from "./TreeView.css";
import type { TreeNode, TreeViewProps } from "./types";

interface FlatNode<T> {
  node: TreeNode<T>;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

interface NodeIndexEntry<T> {
  node: TreeNode<T>;
  parentId: string | null;
}

function getChildren<T>(
  node: TreeNode<T>,
  loadedChildren: Map<string, TreeNode<T>[]>
): TreeNode<T>[] | undefined {
  return node.children ?? loadedChildren.get(node.id);
}

function collectDescendantIds<T>(
  node: TreeNode<T>,
  loadedChildren: Map<string, TreeNode<T>[]>,
  acc: Set<string>
): void {
  const children = getChildren(node, loadedChildren);
  if (!children) return;
  for (const child of children) {
    acc.add(child.id);
    collectDescendantIds(child, loadedChildren, acc);
  }
}

function hasAnyDescendantSelected<T>(
  node: TreeNode<T>,
  loadedChildren: Map<string, TreeNode<T>[]>,
  selected: Set<string>
): boolean {
  const children = getChildren(node, loadedChildren);
  if (!children) return false;
  for (const child of children) {
    if (selected.has(child.id)) return true;
    if (hasAnyDescendantSelected(child, loadedChildren, selected)) return true;
  }
  return false;
}

function reconcileAncestors<T>(
  nodeId: string,
  next: Set<string>,
  nodeIndex: Map<string, NodeIndexEntry<T>>,
  loadedChildren: Map<string, TreeNode<T>[]>
): void {
  let parentId = nodeIndex.get(nodeId)?.parentId ?? null;
  while (parentId) {
    const entry = nodeIndex.get(parentId);
    if (!entry) break;
    const children = getChildren(entry.node, loadedChildren) ?? [];
    const allChecked = children.length > 0 && children.every((c) => next.has(c.id));
    if (allChecked) {
      next.add(parentId);
    } else {
      next.delete(parentId);
    }
    parentId = entry.parentId;
  }
}

export function TreeView<T = unknown>({
  nodes,
  expanded: controlledExpanded,
  defaultExpanded,
  onExpandedChange,
  selected: controlledSelected,
  defaultSelected,
  onSelectedChange,
  selectable = "none",
  onLoadChildren,
  height = 320,
  rowHeight = 32,
}: TreeViewProps<T>): ReactElement {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<Set<string>>(
    () => defaultExpanded ?? new Set()
  );
  const expandedSet =
    controlledExpanded !== undefined ? controlledExpanded : uncontrolledExpanded;
  const setExpandedSet = (next: Set<string>) => {
    if (controlledExpanded === undefined) {
      setUncontrolledExpanded(next);
    }
    onExpandedChange?.(next);
  };

  const [uncontrolledSelected, setUncontrolledSelected] = useState<Set<string>>(
    () => defaultSelected ?? new Set()
  );
  const selectedSet =
    controlledSelected !== undefined ? controlledSelected : uncontrolledSelected;
  const setSelectedSet = (next: Set<string>) => {
    if (controlledSelected === undefined) {
      setUncontrolledSelected(next);
    }
    onSelectedChange?.(next);
  };
  const selectedSetRef = useRef(selectedSet);
  selectedSetRef.current = selectedSet;

  const [loadedChildren, setLoadedChildren] = useState<Map<string, TreeNode<T>[]>>(
    () => new Map()
  );
  const [loadingIds, setLoadingIds] = useState<Set<string>>(() => new Set());
  const attemptedLoadRef = useRef<Set<string>>(new Set());

  const [scrollTop, setScrollTop] = useState(0);
  const [focusedId, setFocusedId] = useState<string | null>(
    () => nodes[0]?.id ?? null
  );
  const shouldFocusRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const nodeIndex = useMemo(() => {
    const map = new Map<string, NodeIndexEntry<T>>();
    function walk(list: TreeNode<T>[], parentId: string | null) {
      for (const node of list) {
        map.set(node.id, { node, parentId });
        const children = getChildren(node, loadedChildren);
        if (children) walk(children, node.id);
      }
    }
    walk(nodes, null);
    return map;
  }, [nodes, loadedChildren]);

  const flatNodes = useMemo(() => {
    const result: FlatNode<T>[] = [];
    function walk(list: TreeNode<T>[], depth: number) {
      for (const node of list) {
        const children = getChildren(node, loadedChildren);
        const nodeHasChildren = children
          ? children.length > 0
          : node.hasChildren === true;
        const isExpanded = expandedSet.has(node.id);
        result.push({ node, depth, hasChildren: nodeHasChildren, isExpanded });
        if (isExpanded && children) {
          walk(children, depth + 1);
        }
      }
    }
    walk(nodes, 0);
    return result;
  }, [nodes, expandedSet, loadedChildren]);

  useEffect(() => {
    if (focusedId !== null && flatNodes.some((f) => f.node.id === focusedId)) {
      return;
    }
    setFocusedId(flatNodes[0]?.node.id ?? null);
  }, [flatNodes, focusedId]);

  useEffect(() => {
    if (!shouldFocusRef.current || focusedId === null) return;
    shouldFocusRef.current = false;
    rowRefs.current.get(focusedId)?.focus();
  }, [focusedId, scrollTop]);

  async function loadChildrenFor(node: TreeNode<T>) {
    if (!onLoadChildren) return;
    if (attemptedLoadRef.current.has(node.id)) return;
    attemptedLoadRef.current.add(node.id);
    setLoadingIds((prev) => new Set(prev).add(node.id));
    try {
      const loaded = await onLoadChildren(node);
      setLoadedChildren((prev) => new Map(prev).set(node.id, loaded));
      if (selectable === "multi" && selectedSetRef.current.has(node.id)) {
        setSelectedSet(
          (() => {
            const next = new Set(selectedSetRef.current);
            for (const child of loaded) next.add(child.id);
            return next;
          })()
        );
      }
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(node.id);
        return next;
      });
    }
  }

  function expandNode(node: TreeNode<T>) {
    const next = new Set(expandedSet);
    next.add(node.id);
    setExpandedSet(next);
    const children = getChildren(node, loadedChildren);
    if (node.hasChildren === true && children === undefined) {
      void loadChildrenFor(node);
    }
  }

  function collapseNode(node: TreeNode<T>) {
    const next = new Set(expandedSet);
    next.delete(node.id);
    setExpandedSet(next);
  }

  function toggleExpand(flat: FlatNode<T>) {
    if (flat.isExpanded) {
      collapseNode(flat.node);
    } else {
      expandNode(flat.node);
    }
  }

  function toggleSelect(node: TreeNode<T>) {
    if (selectable === "none") return;
    if (selectable === "single") {
      const isSelected = selectedSet.has(node.id);
      setSelectedSet(isSelected ? new Set() : new Set([node.id]));
      return;
    }
    const next = new Set(selectedSet);
    const willSelect = !next.has(node.id);
    const descendants = new Set<string>();
    collectDescendantIds(node, loadedChildren, descendants);
    if (willSelect) {
      next.add(node.id);
      descendants.forEach((id) => next.add(id));
    } else {
      next.delete(node.id);
      descendants.forEach((id) => next.delete(id));
    }
    reconcileAncestors(node.id, next, nodeIndex, loadedChildren);
    setSelectedSet(next);
  }

  function moveFocusTo(id: string) {
    const index = flatNodes.findIndex((f) => f.node.id === id);
    if (index === -1) return;
    const rowTop = index * rowHeight;
    const rowBottom = rowTop + rowHeight;
    let scrolled = false;
    if (containerRef.current) {
      if (rowTop < containerRef.current.scrollTop) {
        containerRef.current.scrollTop = rowTop;
        scrolled = true;
      } else if (rowBottom > containerRef.current.scrollTop + height) {
        containerRef.current.scrollTop = rowBottom - height;
        scrolled = true;
      }
    }
    setFocusedId(id);
    // setFocusedId is a no-op re-render when `id` already equals the current
    // focusedId (e.g. re-focusing the same row), so the DOM focus effect
    // (keyed on focusedId) won't fire — focus synchronously here instead,
    // falling back to the effect only when the row isn't mounted yet
    // (freshly scrolled into view by the branch above).
    const target = rowRefs.current.get(id);
    if (target && !scrolled) {
      target.focus();
    } else {
      shouldFocusRef.current = true;
    }
  }

  function handleKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
    flat: FlatNode<T>
  ) {
    const { node, depth, hasChildren, isExpanded } = flat;
    const index = flatNodes.findIndex((f) => f.node.id === node.id);

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const next = flatNodes[index + 1];
        if (next) moveFocusTo(next.node.id);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const prev = flatNodes[index - 1];
        if (prev) moveFocusTo(prev.node.id);
        break;
      }
      case "Home": {
        event.preventDefault();
        if (flatNodes[0]) moveFocusTo(flatNodes[0].node.id);
        break;
      }
      case "End": {
        event.preventDefault();
        const last = flatNodes[flatNodes.length - 1];
        if (last) moveFocusTo(last.node.id);
        break;
      }
      case "ArrowRight": {
        if (!hasChildren) break;
        event.preventDefault();
        if (!isExpanded) {
          expandNode(node);
        } else {
          const next = flatNodes[index + 1];
          if (next && next.depth === depth + 1) moveFocusTo(next.node.id);
        }
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        if (isExpanded && hasChildren) {
          collapseNode(node);
        } else {
          const parentId = nodeIndex.get(node.id)?.parentId;
          if (parentId) moveFocusTo(parentId);
        }
        break;
      }
      case " ":
      case "Spacebar": {
        if (selectable === "none") break;
        event.preventDefault();
        toggleSelect(node);
        break;
      }
      default:
        return;
    }
  }

  const totalHeight = flatNodes.length * rowHeight;
  const overscan = 5;
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(flatNodes.length, startIndex + visibleCount);
  const visibleFlatNodes = flatNodes.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      className={scroller}
      style={{ height }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      role="tree"
    >
      <div className={root} style={{ height: totalHeight }}>
        {visibleFlatNodes.map((flat, i) => {
          const index = startIndex + i;
          const { node, depth, hasChildren, isExpanded } = flat;
          const isLoading = loadingIds.has(node.id);
          const isSelected = selectedSet.has(node.id);
          const isIndeterminate =
            selectable === "multi" &&
            !isSelected &&
            hasAnyDescendantSelected(node, loadedChildren, selectedSet);

          return (
            <div
              key={node.id}
              ref={(el) => {
                if (el) {
                  rowRefs.current.set(node.id, el);
                } else {
                  rowRefs.current.delete(node.id);
                }
              }}
              className={rowClass}
              style={{ top: index * rowHeight, height: rowHeight }}
              role="treeitem"
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-level={depth + 1}
              aria-selected={selectable !== "none" ? isSelected : undefined}
              tabIndex={node.id === focusedId ? 0 : -1}
              onFocus={() => setFocusedId(node.id)}
              onKeyDown={(e) => handleKeyDown(e, flat)}
              onClick={() => setFocusedId(node.id)}
            >
              <div
                className={rowContent}
                style={{ paddingLeft: `calc(${depth} * ${vars.space.lg})` }}
              >
                {hasChildren ? (
                  isLoading ? (
                    <span className={loadingSlot}>
                      <Spinner size="sm" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={chevron}
                      data-expanded={isExpanded || undefined}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(flat);
                      }}
                      aria-hidden="true"
                      tabIndex={-1}
                    >
                      ›
                    </button>
                  )
                ) : (
                  <span className={chevron} aria-hidden="true" />
                )}
                {selectable === "multi" ? (
                  <span
                    className={checkboxCell}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      indeterminate={isIndeterminate}
                      onChange={() => toggleSelect(node)}
                      tabIndex={-1}
                      aria-label={`Select ${typeof node.label === "string" ? node.label : node.id}`}
                    />
                  </span>
                ) : null}
                <span className={labelClass} data-selected={isSelected || undefined}>
                  {node.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
