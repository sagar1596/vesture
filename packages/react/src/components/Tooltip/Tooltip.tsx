import { cloneElement, isValidElement, useRef, useState } from "react";
import type { ReactElement, ReactNode, Ref } from "react";
import {
  FloatingArrow,
  FloatingPortal,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";
import { vars } from "@vesture/tokens";
import { tooltip } from "./Tooltip.css";

export interface TooltipProps {
  content: ReactNode;
  placement?: Placement;
  children: ReactElement<Record<string, unknown>>;
}

export function Tooltip({ content, placement = "top", children }: TooltipProps): ReactElement {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 }), arrow({ element: arrowRef })]
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { move: false }),
    useFocus(context),
    useRole(context, { role: "tooltip" }),
    useDismiss(context)
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
          <div
            ref={refs.setFloating}
            className={tooltip}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {content}
            <FloatingArrow ref={arrowRef} context={context} fill={vars.color.text} />
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}
