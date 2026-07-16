import { cloneElement, isValidElement, useState } from "react";
import type { ReactElement, ReactNode, Ref } from "react";
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
  children: ReactElement<Record<string, unknown>>;
}

export function Popover({
  content,
  placement = "bottom-start",
  open: controlledOpen,
  onOpenChange,
  children
}: PopoverProps): ReactElement {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(context),
    useDismiss(context),
    useRole(context, { role: "dialog" })
  ]);

  const childRef = useMergeRefs([
    refs.setReference,
    (children as unknown as { ref?: Ref<unknown> }).ref ?? null
  ]);

  if (!isValidElement(children)) {
    return children;
  }

  return (
    <>
      {cloneElement(children, getReferenceProps({ ref: childRef, ...children.props }))}
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div ref={refs.setFloating} className={popover} style={floatingStyles} {...getFloatingProps()}>
              {content}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
}
