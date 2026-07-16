import { useId } from "react";
import type { ReactElement, ReactNode } from "react";
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from "@floating-ui/react";
import { closeButton, heading, modal, overlay } from "./Modal.css";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  children?: ReactNode;
}

export function Modal({ open, onOpenChange, title, children }: ModalProps): ReactElement | null {
  const { refs, context } = useFloating({ open, onOpenChange });
  const { getFloatingProps } = useInteractions([useDismiss(context), useRole(context)]);
  const titleId = useId();

  if (!open) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingOverlay className={overlay} lockScroll>
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            className={modal}
            aria-labelledby={title ? titleId : undefined}
            {...getFloatingProps()}
          >
            <button
              type="button"
              className={closeButton}
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              ✕
            </button>
            {title ? (
              <h2 id={titleId} className={heading}>
                {title}
              </h2>
            ) : null}
            {children}
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
}
