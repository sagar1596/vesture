import { useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { range, root, thumb, track } from "./Slider.css";
import type { SliderProps, SliderValue } from "./types";

function isRange(value: SliderValue): value is [number, number] {
  return Array.isArray(value);
}

function clampToStep(raw: number, min: number, max: number, step: number): number {
  const stepped = Math.round((raw - min) / step) * step + min;
  return Math.min(max, Math.max(min, Math.round(stepped * 1e6) / 1e6));
}

function percentOf(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

export function Slider({
  value: controlledValue,
  defaultValue = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  id,
  className,
  style,
  formatValue = (v) => String(v),
  ...rest
}: SliderProps): ReactElement {
  const ariaLabel = rest["aria-label"];
  const [uncontrolledValue, setUncontrolledValue] = useState<SliderValue>(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const setValue = (next: SliderValue) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  };

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Record<"single" | 0 | 1, HTMLSpanElement | null>>({ single: null, 0: null, 1: null });
  const dragThumbIndex = useRef<0 | 1 | null>(null);
  const isDragging = useRef(false);

  const valueFromClientX = (clientX: number): number => {
    const trackEl = trackRef.current;
    if (!trackEl) return min;
    const rect = trackEl.getBoundingClientRect();
    const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
    return clampToStep(min + ratio * (max - min), min, max, step);
  };

  const setThumbValue = (index: 0 | 1 | null, raw: number) => {
    if (index === null) {
      setValue(clampToStep(raw, min, max, step));
      return;
    }
    if (!isRange(value)) return;
    const [start, end] = value;
    if (index === 0) {
      setValue([Math.min(raw, end), end]);
    } else {
      setValue([start, Math.max(raw, start)]);
    }
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging.current) return;
    setThumbValue(dragThumbIndex.current, valueFromClientX(event.clientX));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    dragThumbIndex.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  };

  const startDrag = (index: 0 | 1 | null) => (event: ReactPointerEvent) => {
    if (disabled) return;
    event.preventDefault();
    thumbRefs.current[index ?? "single"]?.focus();
    isDragging.current = true;
    dragThumbIndex.current = index;
    setThumbValue(index, valueFromClientX(event.clientX));
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleTrackPointerDown = (event: ReactPointerEvent) => {
    if (disabled) return;
    if (!isRange(value)) {
      startDrag(null)(event);
      return;
    }
    const target = valueFromClientX(event.clientX);
    const [start, end] = value;
    const nearestIndex: 0 | 1 = Math.abs(target - start) <= Math.abs(target - end) ? 0 : 1;
    startDrag(nearestIndex)(event);
  };

  const handleThumbKeyDown = (index: 0 | 1 | null) => (event: ReactKeyboardEvent) => {
    if (disabled) return;
    const current = index === null ? (value as number) : (value as [number, number])[index];
    let next: number | null = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = clampToStep(current + step, min, max, step);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = clampToStep(current - step, min, max, step);
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      case "PageUp":
        next = clampToStep(current + step * 10, min, max, step);
        break;
      case "PageDown":
        next = clampToStep(current - step * 10, min, max, step);
        break;
      default:
        return;
    }

    event.preventDefault();
    setThumbValue(index, next);
  };

  const renderThumb = (index: 0 | 1 | null, current: number, label: string | undefined) => (
    <span
      key={index ?? "single"}
      ref={(node) => {
        thumbRefs.current[index ?? "single"] = node;
      }}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={current}
      aria-valuetext={formatValue(current)}
      aria-disabled={disabled || undefined}
      className={thumb}
      style={{ left: `${percentOf(current, min, max)}%` }}
      onPointerDown={(event) => {
        event.stopPropagation();
        startDrag(index)(event);
      }}
      onKeyDown={handleThumbKeyDown(index)}
    />
  );

  const classes = [root, className].filter(Boolean).join(" ");

  return (
    <span id={id} className={classes} style={style} data-disabled={disabled || undefined}>
      <span ref={trackRef} className={track} onPointerDown={handleTrackPointerDown}>
        {isRange(value) ? (
          <span
            className={range}
            style={{
              left: `${percentOf(value[0], min, max)}%`,
              right: `${100 - percentOf(value[1], min, max)}%`
            }}
          />
        ) : (
          <span className={range} style={{ left: 0, right: `${100 - percentOf(value, min, max)}%` }} />
        )}
        {isRange(value)
          ? [
              renderThumb(0, value[0], Array.isArray(ariaLabel) ? ariaLabel[0] : ariaLabel),
              renderThumb(1, value[1], Array.isArray(ariaLabel) ? ariaLabel[1] : ariaLabel)
            ]
          : renderThumb(null, value, typeof ariaLabel === "string" ? ariaLabel : undefined)}
      </span>
    </span>
  );
}
