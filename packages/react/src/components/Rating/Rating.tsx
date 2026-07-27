import { useId, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, ReactElement } from "react";
import {
  group,
  hiddenInput,
  readOnlyGroup,
  starFillClip,
  starFilled,
  starFocusRing,
  starOutline,
  starShape,
  starWrapper
} from "./Rating.css";
import type { RatingProps } from "./types";

// Self-authored 5-point star polygon (24x24 viewBox) — no icon library
// dependency for a single shape this simple.
const STAR_POINTS =
  "12,2 14.35,8.76 21.51,8.91 15.8,13.24 17.88,20.09 12,16 6.12,20.09 8.2,13.24 2.49,8.91 9.65,8.76";

function StarSvg({ className }: { className: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <polygon points={STAR_POINTS} fill="currentColor" />
    </svg>
  );
}

function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function fillPercentFor(displayValue: number, starIndex: number): number {
  const raw = clampPercent((displayValue - (starIndex - 1)) * 100);
  return Math.round(raw * 100) / 100;
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

function Star({ fillPercent }: { fillPercent: number }): ReactElement {
  return (
    <span className={starShape}>
      <StarSvg className={starOutline} />
      <span className={starFillClip} style={{ width: `${fillPercent}%` }}>
        <StarSvg className={starFilled} />
      </span>
    </span>
  );
}

export function Rating({
  value: controlledValue,
  defaultValue = 0,
  onChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  disabled = false,
  name,
  className,
  ...rest
}: RatingProps): ReactElement {
  const ariaLabel = rest["aria-label"];
  const generatedName = useId();
  const groupName = name ?? generatedName;

  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function commit(next: number) {
    if (controlledValue === undefined) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  }

  if (readOnly) {
    const label = ariaLabel ?? `Rated ${value} out of ${max} stars`;
    return (
      <div role="img" aria-label={label} className={[readOnlyGroup, className].filter(Boolean).join(" ")}>
        {Array.from({ length: max }, (_, i) => i + 1).map((starIndex) => (
          <Star key={starIndex} fillPercent={fillPercentFor(value, starIndex)} />
        ))}
      </div>
    );
  }

  const displayValue = hoverValue ?? value;
  // Native radios can't represent a half-star position, so a fractional
  // value (e.g. 3.5) checks the next whole star up (4) as its nearest
  // native anchor — visual fill still reads 3.5 via fillPercentFor, this
  // only affects which radio the browser/AT reports as "checked".
  const checkedIndex = value > 0 ? Math.ceil(value) : null;

  function pointerValue(event: MouseEvent<HTMLLabelElement>, starIndex: number): number {
    if (!allowHalf) return starIndex;
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeftHalf = event.clientX - rect.left < rect.width / 2;
    return isLeftHalf ? starIndex - 0.5 : starIndex;
  }

  function handleStarClick(event: MouseEvent<HTMLLabelElement>, starIndex: number) {
    if (disabled) return;
    if (!allowHalf) return; // native label->input activation already handles whole-star clicks
    event.preventDefault();
    const next = pointerValue(event, starIndex);
    commit(next);
    // preventDefault above also suppresses the label's default click-to-focus
    // forwarding to its input (the same gotcha documented for Slider's
    // pointerdown handler) — focus the nearest whole-star input explicitly so
    // keyboard nav still has something to bubble from afterward.
    inputRefs.current[Math.ceil(next)]?.focus();
  }

  function handleStarMouseMove(event: MouseEvent<HTMLLabelElement>, starIndex: number) {
    if (disabled) return;
    setHoverValue(pointerValue(event, starIndex));
  }

  // jsdom (and, more importantly, the actual native radio-group arrow-key
  // behavior we'd otherwise be relying on) has no notion of half-star steps,
  // so arrow navigation is handled explicitly here rather than assumed —
  // verified empirically that jsdom does not move focus/checked state on its
  // own for a plain <input type="radio"> group. Plain arrows move by a whole
  // star; Shift+arrow moves by a half star when allowHalf is on, since
  // there's no native equivalent of "half a radio position" to fall back on.
  function handleGroupKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const lowerBound = allowHalf ? 0.5 : 1;
    const step = event.shiftKey && allowHalf ? 0.5 : 1;
    const increasing = event.key === "ArrowRight" || event.key === "ArrowUp";
    const decreasing = event.key === "ArrowLeft" || event.key === "ArrowDown";
    if (!increasing && !decreasing) return;

    event.preventDefault();
    const base = roundToHalf(value);
    const next = increasing
      ? Math.min(max, base + step)
      : Math.max(lowerBound, base - step);
    commit(next);
    inputRefs.current[Math.ceil(next)]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={[group, className].filter(Boolean).join(" ")}
      onMouseLeave={() => setHoverValue(null)}
      onKeyDown={handleGroupKeyDown}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((starIndex) => {
        const inputId = `${groupName}-${starIndex}`;
        return (
          <label
            key={starIndex}
            htmlFor={inputId}
            className={starWrapper}
            onClick={(event) => handleStarClick(event, starIndex)}
            onMouseEnter={() => !allowHalf && setHoverValue(starIndex)}
            onMouseMove={(event) => allowHalf && handleStarMouseMove(event, starIndex)}
          >
            <input
              ref={(el) => {
                inputRefs.current[starIndex] = el;
              }}
              id={inputId}
              type="radio"
              name={groupName}
              value={starIndex}
              checked={checkedIndex === starIndex}
              disabled={disabled}
              className={hiddenInput}
              aria-label={`${starIndex} star${starIndex === 1 ? "" : "s"}`}
              onChange={() => commit(starIndex)}
            />
            <span className={starFocusRing}>
              <Star fillPercent={fillPercentFor(displayValue, starIndex)} />
            </span>
          </label>
        );
      })}
    </div>
  );
}
