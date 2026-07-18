import { forwardRef, useEffect, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent as ReactKeyboardEvent, ReactElement } from "react";
import { useMergeRefs } from "@floating-ui/react";
import { input, stepButton, stepperGroup, wrapper } from "./NumberInput.css";

export interface NumberInputProps {
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  let result = value;
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);
  return result;
}

function formatValue(value: number | null): string {
  return value === null ? "" : String(value);
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    value: controlledValue,
    defaultValue = null,
    onChange,
    min,
    max,
    step = 1,
    disabled = false,
    invalid,
    placeholder,
    id,
    name,
    className,
    style,
    ...rest
  },
  ref
): ReactElement {
  const [uncontrolledValue, setUncontrolledValue] = useState<number | null>(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const setValue = (next: number | null) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  };

  const [inputText, setInputText] = useState(() => formatValue(value));

  useEffect(() => {
    setInputText(formatValue(value));
  }, [value]);

  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergeRefs([inputRef, ref]);

  const commitTypedValue = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      if (value !== null) setValue(null);
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setInputText(formatValue(value));
      return;
    }

    const clamped = clamp(parsed, min, max);
    setValue(clamped);
    setInputText(formatValue(clamped));
  };

  const step2 = (direction: 1 | -1) => {
    if (disabled) return;
    const base = value ?? min ?? 0;
    const next = clamp(base + direction * step, min, max);
    setValue(next);
    setInputText(formatValue(next));
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTypedValue();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      step2(1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      step2(-1);
      return;
    }
    if (event.key === "Home" && min !== undefined) {
      event.preventDefault();
      setValue(min);
      setInputText(formatValue(min));
      return;
    }
    if (event.key === "End" && max !== undefined) {
      event.preventDefault();
      setValue(max);
      setInputText(formatValue(max));
    }
  };

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    commitTypedValue();
  };

  const classes = [wrapper, className].filter(Boolean).join(" ");

  return (
    <span className={classes} style={style} data-disabled={disabled || undefined}>
      <input
        ref={mergedRef}
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        className={input}
        value={inputText}
        placeholder={placeholder}
        disabled={disabled}
        role="spinbutton"
        aria-valuenow={value ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-invalid={invalid || undefined}
        onChange={(e) => setInputText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...rest}
      />
      <span className={stepperGroup}>
        <button
          type="button"
          tabIndex={-1}
          className={stepButton}
          disabled={disabled || (max !== undefined && value !== null && value >= max)}
          aria-label="Increment"
          onClick={() => step2(1)}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          tabIndex={-1}
          className={stepButton}
          disabled={disabled || (min !== undefined && value !== null && value <= min)}
          aria-label="Decrement"
          onClick={() => step2(-1)}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </span>
    </span>
  );
});
