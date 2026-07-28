import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { vars } from "@vesture/tokens";
import { Button } from "../Button";
import { canvas, canvasWrapper, root } from "./SignaturePad.css";
import type { SignaturePadHandle, SignaturePadProps } from "./types";

interface Point {
  x: number;
  y: number;
}

function getPoint(canvasEl: HTMLCanvasElement, event: { clientX: number; clientY: number }): Point {
  const rect = canvasEl.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  {
    onChange,
    penColor = vars.color.text,
    penWidth = 2.5,
    backgroundColor,
    width = 400,
    height = 160,
    disabled = false,
    showClearButton = true,
    className,
    ...rest
  },
  ref
): ReactElement {
  const ariaLabel = rest["aria-label"] ?? "Signature pad";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasContentRef = useRef(false);
  const pointsRef = useRef<Point[]>([]);
  const activePointerIdRef = useRef<number | null>(null);

  const paintBackground = (ctx: CanvasRenderingContext2D) => {
    if (!backgroundColor) return;
    ctx.save();
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  // Canvas dimensions are set in device pixels (accounting for DPR) and then
  // scaled back down via ctx.scale so every other drawing call below can
  // keep working in plain CSS-pixel coordinates — otherwise the pad renders
  // blurry on high-DPI displays. Resizing (width/height prop change) is
  // structurally destructive to canvas content by nature of the <canvas>
  // API itself, so this intentionally wipes and repaints on that dependency.
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    paintBackground(ctx);
    hasContentRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- backgroundColor intentionally excluded: it's only ever read at reset time, not worth wiping the pad for
  }, [width, height]);

  const emitChange = () => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    onChange?.(hasContentRef.current ? canvasEl.toDataURL() : null);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    event.preventDefault();
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    try {
      canvasEl.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture isn't implemented in every test/DOM environment; drawing
      // still works without it as long as the pointer stays over the canvas.
    }
    activePointerIdRef.current = event.pointerId;
    const point = getPoint(canvasEl, event);
    pointsRef.current = [point];

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.fillStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  // Standard "smooth freehand stroke" technique: each new raw point extends
  // the curve to the midpoint between it and the previous point, using the
  // previous point as the quadratic control point. This rounds off the
  // jagged corners you'd get from just connecting raw pointer samples with
  // straight lines. The segment from the last midpoint to the true final
  // point is closed out explicitly on pointerup below.
  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled || event.pointerId !== activePointerIdRef.current) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const point = getPoint(canvasEl, event);
    pointsRef.current.push(point);
    const points = pointsRef.current;

    if (points.length >= 3) {
      const [prev, current] = points.slice(-2) as [Point, Point];
      const mid = { x: (prev.x + current.x) / 2, y: (prev.y + current.y) / 2 };
      ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
      ctx.stroke();
      hasContentRef.current = true;
    }
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerId !== activePointerIdRef.current) return;
    const canvasEl = canvasRef.current;
    activePointerIdRef.current = null;
    try {
      canvasEl?.releasePointerCapture(event.pointerId);
    } catch {
      // See handlePointerDown.
    }
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const points = pointsRef.current;
    if (points.length === 1) {
      // A tap with no movement — draw a dot so a completed stroke is never
      // silently invisible while still being counted as "content".
      const p = points[0]!;
      ctx.beginPath();
      ctx.arc(p.x, p.y, penWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      hasContentRef.current = true;
    } else if (points.length > 1) {
      const last = points[points.length - 1]!;
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      hasContentRef.current = true;
    }
    pointsRef.current = [];
    emitChange();
  };

  const clearCanvas = () => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    paintBackground(ctx);
    hasContentRef.current = false;
    onChange?.(null);
  };

  useImperativeHandle(
    ref,
    () => ({
      clear: clearCanvas,
      toDataURL: (type?: string) => canvasRef.current?.toDataURL(type ?? "image/png") ?? "",
      isEmpty: () => !hasContentRef.current
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paintBackground closes over backgroundColor/width/height already tracked below
    [onChange, width, height, backgroundColor]
  );

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      <div className={canvasWrapper} data-disabled={disabled || undefined}>
        <canvas
          ref={canvasRef}
          className={canvas}
          role="img"
          aria-label={ariaLabel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
      </div>
      {showClearButton ? (
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={clearCanvas}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
});
