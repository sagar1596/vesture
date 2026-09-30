import { cloneElement, isValidElement, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode, Ref } from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  hide,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useMergeRefs,
  useRole
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";
import { popover } from "./Popover.css";

export interface PopoverProps {
  content: ReactNode;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * What happens when the anchor scrolls out of its scroll container: "follow" (default)
   * keeps the popover pinned to the anchor, hiding it gracefully (opacity, no unmount, so
   * position tracking doesn't reset) once the anchor is fully clipped from view. "close"
   * dismisses the popover on the first scroll of any ancestor instead of tracking it.
   */
  onAnchorScroll?: "follow" | "close";
  children: ReactElement<Record<string, unknown>>;
}

export function Popover({
  content,
  placement = "bottom-start",
  open: controlledOpen,
  onOpenChange,
  onAnchorScroll = "follow",
  children
}: PopoverProps): ReactElement {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 }), hide({ padding: 8 })]
  });

  const referenceHidden = middlewareData.hide?.referenceHidden ?? false;

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context, { ancestorScroll: onAnchorScroll === "close" }),
    useRole(context, { role: "dialog" })
  ]);

  const childRef = useMergeRefs([
    refs.setReference,
    (children as unknown as { ref?: Ref<unknown> }).ref ?? null
  ]);

  if (!isValidElement(children)) {
    return children;
  }

  const hiddenStyle: CSSProperties = referenceHidden
    ? { pointerEvents: "none", opacity: 0 }
    : { opacity: 1 };

  return (
    <>
      {cloneElement(children, getReferenceProps({ ref: childRef, ...children.props }))}
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              className={popover}
              style={{ ...floatingStyles, ...hiddenStyle, transition: "opacity 0.1s ease" }}
              {...getFloatingProps()}
            >
              {content}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
}
