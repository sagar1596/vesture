import { useEffect, useId, useState } from "react";
import type { ReactElement } from "react";
import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from "@floating-ui/react";
import { closeButton, heading, overlay } from "../Modal/Modal.css";
import { panel, side as sideStyles } from "./Drawer.css";
import type { DrawerProps } from "./types";

const DEFAULT_SIZE = "360px";

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  side = "right",
  size = DEFAULT_SIZE
}: DrawerProps): ReactElement | null {
  const { refs, context } = useFloating({ open, onOpenChange });
  const { getFloatingProps } = useInteractions([useDismiss(context), useRole(context)]);
  const titleId = useId();

  // Unlike Modal, Drawer can't unmount the instant `open` goes false — it needs to stay
  // mounted through the exit transition. `mounted` controls presence in the DOM; `entered`
  // controls the data-state (and therefore the transform) that drives the slide animation.
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (open) {
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    return undefined;
  }, [open, mounted]);

  if (!mounted) {
    return null;
  }

  const cssSize = typeof size === "number" ? `${size}px` : size;
  const isHorizontal = side === "left" || side === "right";
  const dimensionStyle = isHorizontal ? { width: cssSize } : { height: cssSize };

  return (
    <FloatingPortal>
      <FloatingOverlay className={overlay} lockScroll>
        <FloatingFocusManager context={context}>
          <div
            ref={refs.setFloating}
            className={[panel, sideStyles[side]].join(" ")}
            data-state={entered ? "open" : "closed"}
            style={dimensionStyle}
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget && !open) {
                setMounted(false);
              }
            }}
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
