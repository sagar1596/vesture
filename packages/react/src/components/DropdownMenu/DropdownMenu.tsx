import { cloneElement, isValidElement, useRef, useState } from "react";
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
  useListNavigation,
  useMergeRefs,
  useRole
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";
import { menu } from "./DropdownMenu.css";
import { MenuContext } from "./MenuContext";

export interface DropdownMenuProps {
  trigger: ReactElement<Record<string, unknown>>;
  placement?: Placement;
  children?: ReactNode;
}

export function DropdownMenu({
  trigger,
  placement = "bottom-start",
  children
}: DropdownMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
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

  const triggerRef = useMergeRefs([
    refs.setReference,
    (trigger as unknown as { ref?: Ref<unknown> }).ref ?? null
  ]);

  return (
    <>
      {cloneElement(trigger, getReferenceProps({ ref: triggerRef, ...trigger.props }))}
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div ref={refs.setFloating} className={menu} style={floatingStyles} {...getFloatingProps()}>
              <MenuContext.Provider value={{ activeIndex, getItemProps, closeMenu }}>
                {(children ? (Array.isArray(children) ? children : [children]) : []).map((child, index) =>
                  isValidElement(child)
                    ? cloneElement(
                        child as ReactElement<{ index?: number; elementsRef?: typeof elementsRef }>,
                        { key: index, index, elementsRef }
                      )
                    : child
                )}
              </MenuContext.Provider>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </>
  );
}
