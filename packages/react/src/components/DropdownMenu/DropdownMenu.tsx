import { Fragment, cloneElement, isValidElement, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useMergeRefs,
  useRole
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";
import { menu } from "./DropdownMenu.css";
import { MenuContext } from "./MenuContext";

// Flattens Fragment children (e.g. a consumer grouping DropdownMenu.Item
// elements in a <>...</> to build `content` conditionally) so each real item
// gets its own index/elementsRef props below — cloneElement-ing those props
// directly onto a Fragment throws "Invalid prop supplied to React.Fragment"
// and never reaches the items inside, silently breaking their roving-index
// keyboard registration.
function flattenMenuChildren(nodes: ReactNode): ReactElement[] {
  const list = Array.isArray(nodes) ? nodes : [nodes];
  const result: ReactElement[] = [];
  for (const node of list) {
    if (!isValidElement(node)) continue;
    if (node.type === Fragment) {
      result.push(...flattenMenuChildren((node.props as { children?: ReactNode }).children));
    } else {
      result.push(node);
    }
  }
  return result;
}

export interface DropdownMenuProps {
  trigger: ReactElement<Record<string, unknown>>;
  placement?: Placement;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Opt-in escape hatch for a composing parent (e.g. Menubar) that needs the
   * trigger's own DOM node for its own bookkeeping — roving focus across
   * several triggers, for instance. DropdownMenu deliberately does not try
   * to introspect and merge whatever ref the passed-in trigger element
   * already carries (element.ref/element.props.ref): that pattern relies on
   * a deprecated React API being removed with no working replacement for
   * "merge into a ref I don't own," and every current caller either has no
   * ref of its own or can use this prop instead. Pass a stable (memoized or
   * cached, not freshly-created-per-render) callback.
   */
  onReferenceRef?: (node: Element | null) => void;
}

export function DropdownMenu({
  trigger,
  placement = "bottom-start",
  children,
  open: controlledOpen,
  onOpenChange,
  onReferenceRef
}: DropdownMenuProps): ReactElement {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  };
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const elementsRef = useRef<Array<HTMLElement | null>>([]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })]
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role: "menu" }),
    useListNavigation(context, {
      listRef: elementsRef,
      activeIndex,
      onNavigate: setActiveIndex,
      loop: true
    })
  ]);

  const closeMenu = () => setOpen(false);

  // getReferenceProps({ ...trigger.props, ref: triggerRef }) below spreads
  // the trigger's own props first so `ref` is assigned last and wins —
  // getting that order backwards means any trigger prop object that happens
  // to carry a `ref` key silently overwrites the merged ref, leaving
  // floating-ui with no reference element to measure against, so it pins
  // the menu at (0, 0) instead of anchoring it to the trigger. Hit this
  // exact bug composing DropdownMenu inside Menubar.
  const triggerRef = useMergeRefs([refs.setReference, onReferenceRef ?? null]);

  return (
    <>
      {cloneElement(trigger, getReferenceProps({ ...trigger.props, ref: triggerRef }))}
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div ref={refs.setFloating} className={menu} style={floatingStyles} {...getFloatingProps()}>
              <MenuContext.Provider value={{ activeIndex, getItemProps, closeMenu }}>
                {flattenMenuChildren(children).map((child, index) =>
                  cloneElement(
                    child as ReactElement<{ index?: number; elementsRef?: typeof elementsRef }>,
                    { key: index, index, elementsRef }
                  )
                )}
              </MenuContext.Provider>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
}
