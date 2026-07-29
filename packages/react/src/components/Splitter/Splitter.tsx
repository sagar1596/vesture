import { Fragment, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactElement, ReactNode } from "react";
import { container, divider, panel } from "./Splitter.css";

export interface SplitterProps {
  direction?: "horizontal" | "vertical";
  children: ReactNode[];
  defaultSizes?: number[];
  minSize?: number;
  onSizesChange?: (sizes: number[]) => void;
  className?: string;
}

interface DragState {
  dividerIndex: number;
  pointerId: number;
  startClientPos: number;
  containerSize: number;
  startSizeA: number;
  startSizeB: number;
}

const KEYBOARD_STEP = 2;

function evenSizes(count: number): number[] {
  const size = 100 / count;
  return Array.from({ length: count }, () => size);
}

function computeAdjacentSizes(
  startSizeA: number,
  startSizeB: number,
  deltaPercent: number,
  minSize: number
): [number, number] {
  const total = startSizeA + startSizeB;
  let sizeA = startSizeA + deltaPercent;
  let sizeB = startSizeB - deltaPercent;
  if (sizeA < minSize) {
    sizeA = minSize;
    sizeB = total - minSize;
  } else if (sizeB < minSize) {
    sizeB = minSize;
    sizeA = total - minSize;
  }
  return [sizeA, sizeB];
}

export function Splitter({
  direction = "horizontal",
  children,
  defaultSizes,
  minSize = 10,
  onSizesChange,
  className,
}: SplitterProps): ReactElement {
  const panelCount = children.length;
  if (panelCount < 2 && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error("Splitter requires at least 2 children.");
  }

  const [sizes, setSizes] = useState<number[]>(() => defaultSizes ?? evenSizes(panelCount));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const isHorizontal = direction === "horizontal";

  function commit(next: number[]) {
    setSizes(next);
    onSizesChange?.(next);
  }

  function handlePointerDown(dividerIndex: number) {
    return (event: ReactPointerEvent<HTMLDivElement>) => {
      const containerEl = containerRef.current;
      if (!containerEl) return;
      const rect = containerEl.getBoundingClientRect();
      const containerSize = isHorizontal ? rect.width : rect.height;
      if (containerSize <= 0) return;

      const target = event.currentTarget;
      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture isn't implemented in every test/DOM environment.
      }
      target.focus();

      dragRef.current = {
        dividerIndex,
        pointerId: event.pointerId,
        startClientPos: isHorizontal ? event.clientX : event.clientY,
        containerSize,
        startSizeA: sizes[dividerIndex]!,
        startSizeB: sizes[dividerIndex + 1]!,
      };
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    const clientPos = isHorizontal ? event.clientX : event.clientY;
    const deltaPercent = ((clientPos - drag.startClientPos) / drag.containerSize) * 100;
    const [sizeA, sizeB] = computeAdjacentSizes(drag.startSizeA, drag.startSizeB, deltaPercent, minSize);

    const next = [...sizes];
    next[drag.dividerIndex] = sizeA;
    next[drag.dividerIndex + 1] = sizeB;
    setSizes(next);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    onSizesChange?.(sizes);
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
  }

  function handleKeyDown(dividerIndex: number) {
    return (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const increaseKey = isHorizontal ? "ArrowRight" : "ArrowDown";
      const decreaseKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
      if (event.key !== increaseKey && event.key !== decreaseKey) return;

      event.preventDefault();
      const direction = event.key === increaseKey ? 1 : -1;
      const [sizeA, sizeB] = computeAdjacentSizes(
        sizes[dividerIndex]!,
        sizes[dividerIndex + 1]!,
        direction * KEYBOARD_STEP,
        minSize
      );
      const next = [...sizes];
      next[dividerIndex] = sizeA;
      next[dividerIndex + 1] = sizeB;
      commit(next);
    };
  }

  return (
    <div
      ref={containerRef}
      className={[container, className].filter(Boolean).join(" ")}
      data-direction={direction}
    >
      {children.map((child, index) => (
        <Fragment key={index}>
          <div
            className={panel}
            style={{ flexBasis: `${sizes[index] ?? 100 / panelCount}%` }}
          >
            {child}
          </div>
          {index < panelCount - 1 ? (
            <div
              role="separator"
              aria-orientation={isHorizontal ? "vertical" : "horizontal"}
              aria-valuenow={Math.round(sizes[index] ?? 0)}
              tabIndex={0}
              className={divider}
              data-direction={direction}
              onPointerDown={handlePointerDown(index)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onKeyDown={handleKeyDown(index)}
            />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
