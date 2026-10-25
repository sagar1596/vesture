import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import { placeCard } from "./tour-geometry";
import type { Box, TourPlacement } from "./tour-geometry";
import { blocker, body, button, card as cardClass, close, dot, dots, footer, heading, overlay, primary, progress, spotlight } from "./ProductTour.css";

export interface TourStep {
  /** CSS selector, element, or ref of what to highlight. Omit for a centered, un-anchored step. */
  target?: string | HTMLElement | { current: HTMLElement | null } | null;
  title?: ReactNode;
  content: ReactNode;
  placement?: TourPlacement;
  /** Extra space (px) around the highlighted element. */
  padding?: number;
  /** Disable clicking through to the highlighted element for this step. */
  blockInteraction?: boolean;
}

export interface ProductTourProps {
  steps: TourStep[];
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled current step. */
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Fires after the last step's Done button. */
  onFinish?: () => void;
  /** Fires on Skip / Escape / close. */
  onSkip?: (step: number) => void;
  /** Dim the page behind the spotlight. Default true. */
  showOverlay?: boolean;
  /** Corner radius of the spotlight cut-out. */
  spotlightRadius?: number;
  showProgress?: boolean;
  showDots?: boolean;
  labels?: { next?: string; back?: string; skip?: string; done?: string };
  /** Replaces the whole card body. */
  renderCard?: (ctx: { step: TourStep; index: number; count: number; next: () => void; back: () => void; skip: () => void }) => ReactNode;
  /** Close when the dimmed backdrop is clicked. */
  closeOnBackdropClick?: boolean;
  /** Where the tour renders. Default `document.body`. */
  container?: HTMLElement | null;
  className?: string;
}

function resolveTarget(target: TourStep["target"]): HTMLElement | null {
  if (!target) return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  if (target instanceof HTMLElement) return target;
  return target.current;
}

/** Spotlight-style onboarding tour: highlights elements one step at a time with a floating card. */
export function ProductTour({
  steps,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  step: controlledStep,
  defaultStep = 0,
  onStepChange,
  onFinish,
  onSkip,
  showOverlay = true,
  spotlightRadius = 8,
  showProgress = true,
  showDots = false,
  labels,
  renderCard,
  closeOnBackdropClick = false,
  container,
  className
}: ProductTourProps): ReactElement | null {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [uncontrolledStep, setUncontrolledStep] = useState(defaultStep);
  const open = controlledOpen ?? uncontrolledOpen;
  const index = Math.min(steps.length - 1, Math.max(0, controlledStep ?? uncontrolledStep));
  const current = steps[index];
  const [box, setBox] = useState<Box | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);

  const L = { next: "Next", back: "Back", skip: "Skip", done: "Done", ...labels };

  const setOpen = (o: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(o);
    onOpenChange?.(o);
  };
  const go = (i: number) => {
    const c = Math.min(steps.length - 1, Math.max(0, i));
    if (controlledStep === undefined) setUncontrolledStep(c);
    onStepChange?.(c);
  };
  const next = () => {
    if (index >= steps.length - 1) {
      setOpen(false);
      go(0);
      onFinish?.();
    } else go(index + 1);
  };
  const back = () => go(index - 1);
  const skip = () => {
    setOpen(false);
    onSkip?.(index);
    go(0);
  };

  // Remember where focus was so we can hand it back when the tour closes.
  useEffect(() => {
    if (open) returnFocus.current = document.activeElement;
    else if (returnFocus.current instanceof HTMLElement) returnFocus.current.focus();
  }, [open]);

  // Track the target element: scroll it into view, then follow it through scroll/resize.
  useLayoutEffect(() => {
    if (!open || !current) return;
    const el = resolveTarget(current.target);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "center", inline: "nearest" });
    const measure = () => {
      const target = resolveTarget(current.target);
      if (!target) {
        setBox(null);
        return;
      }
      const r = target.getBoundingClientRect();
      const pad = current.padding ?? 6;
      setBox({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, current, index]);

  // Position the card once both the target box and the card size are known.
  useLayoutEffect(() => {
    if (!open || !current || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const pos = placeCard(
      box ?? { top: 0, left: 0, width: 0, height: 0 },
      { width: rect.width || 320, height: rect.height || 160 },
      { width: window.innerWidth, height: window.innerHeight },
      box ? (current.placement ?? "bottom") : "center"
    );
    setCardPos({ top: pos.top, left: pos.left });
  }, [open, current, box, index]);

  useEffect(() => {
    if (open) cardRef.current?.focus();
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // handlers close over the latest step/index each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, steps.length]);

  if (!open || !current || typeof document === "undefined") return null;

  const isLast = index === steps.length - 1;
  const content = renderCard ? (
    renderCard({ step: current, index, count: steps.length, next, back, skip })
  ) : (
    <>
      <button type="button" className={close} aria-label="Close tour" onClick={skip}>
        ×
      </button>
      {current.title ? <h2 className={heading}>{current.title}</h2> : null}
      <p className={body}>{current.content}</p>
      <div className={footer}>
        {showProgress ? (
          <span className={progress}>
            {showDots ? (
              <span className={dots} aria-hidden>
                {steps.map((_, i) => (
                  <span key={i} className={dot} data-active={i === index} />
                ))}
              </span>
            ) : null}
            {showDots ? " " : null}
            <span>
              {index + 1} / {steps.length}
            </span>
          </span>
        ) : (
          <span className={progress} />
        )}
        {!isLast ? (
          <button type="button" className={button} onClick={skip}>
            {L.skip}
          </button>
        ) : null}
        {index > 0 ? (
          <button type="button" className={button} onClick={back}>
            {L.back}
          </button>
        ) : null}
        <button type="button" className={`${button} ${primary}`} onClick={next}>
          {isLast ? L.done : L.next}
        </button>
      </div>
    </>
  );

  return createPortal(
    <div className={[overlay, className].filter(Boolean).join(" ")} data-testid="product-tour">
      {(closeOnBackdropClick || current.blockInteraction) && showOverlay ? (
        <div className={blocker} onClick={closeOnBackdropClick ? skip : undefined} data-testid="tour-blocker" />
      ) : null}
      {showOverlay && box ? (
        <div
          className={spotlight}
          data-testid="tour-spotlight"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height, borderRadius: spotlightRadius }}
        />
      ) : null}
      {showOverlay && !box ? <div className={blocker} style={{ background: "rgba(0,0,0,0.55)" }} /> : null}
      <div
        ref={cardRef}
        className={cardClass}
        role="dialog"
        aria-modal="false"
        aria-label={typeof current.title === "string" ? current.title : `Step ${index + 1} of ${steps.length}`}
        tabIndex={-1}
        style={{ top: cardPos?.top ?? -9999, left: cardPos?.left ?? -9999 }}
      >
        {content}
      </div>
    </div>,
    container ?? document.body
  );
}
