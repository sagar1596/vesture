import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { Popover } from "../Popover";
import {
  formatColor,
  hexToHsl,
  hslToHex,
  parseColorString
} from "./colorMath";
import {
  gradientDot,
  gradientSquare,
  hueStrip,
  hueThumb,
  panel,
  presetRow,
  presetSwatch,
  textInput,
  trigger,
  triggerSwatch
} from "./ColorPicker.css";

export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (hex: string) => void;
  presets?: string[];
  format?: "hex" | "rgb" | "hsl";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

// Literal hex, not `vars.chart.seriesN` — those resolve to `var(--chart-seriesN...)`
// CSS custom-property references at runtime, which colorMath's hex/rgb/hsl parsing
// can't interpret (no DOM access from pure functions). Using the token refs directly
// as presets broke the picker: clicking a preset set `value` to an unparseable
// `var(...)` string, so `hexToHsl` returned null, the working `hsl` state never
// updated, and the gradient square/hue strip stayed stuck showing the previous
// color. These are the same fixed values as `chart.series1-8` in
// packages/tokens/src/default-theme.css.ts (there is only one theme variant for
// this palette, so no light/dark divergence is lost by inlining them here).
const DEFAULT_PRESETS: string[] = [
  "#2a78d6",
  "#1baf7a",
  "#eda100",
  "#008300",
  "#4a3aa7",
  "#e34948",
  "#e87ba4",
  "#eb6834"
];

const FALLBACK_HEX = "#2a78d6";

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function ColorPicker({
  value: controlledValue,
  defaultValue = FALLBACK_HEX,
  onChange,
  presets = DEFAULT_PRESETS,
  format = "hex",
  disabled = false,
  className,
  "aria-label": ariaLabel = "Color"
}: ColorPickerProps): ReactElement {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const setValue = (next: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  };

  const [open, setOpen] = useState(false);

  // hsl is the picker's own working representation (drives the gradient
  // square + hue strip). Derived from `value` whenever it changes externally
  // rather than stored as the source of truth, so a controlled `value` always
  // wins; re-derived on every hex round-trip loses no information the user
  // can perceive since h is preserved even at s=0/l=0/l=100 (achromatic)
  // by only re-deriving hue when the incoming hex isn't the one we just emitted.
  const [hsl, setHsl] = useState(() => hexToHsl(value) ?? { h: 0, s: 0, l: 50 });
  const lastEmittedHex = useRef(value);

  useEffect(() => {
    if (value === lastEmittedHex.current) return;
    const parsed = hexToHsl(value);
    if (parsed) {
      setHsl(parsed);
    }
  }, [value]);

  const [inputText, setInputText] = useState(() => formatColor(value, format));
  useEffect(() => {
    setInputText(formatColor(value, format));
  }, [value, format]);

  const commitHsl = (next: { h: number; s: number; l: number }) => {
    setHsl(next);
    const hex = hslToHex(next);
    lastEmittedHex.current = hex;
    setValue(hex);
  };

  // --- Gradient square (saturation/lightness) drag ---
  const squareRef = useRef<HTMLDivElement>(null);
  const draggingSquare = useRef(false);

  const setFromSquarePoint = (clientX: number, clientY: number) => {
    const el = squareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.width === 0 ? 0 : clamp01((clientX - rect.left) / rect.width);
    const y = rect.height === 0 ? 0 : clamp01((clientY - rect.top) / rect.height);
    commitHsl({ h: hsl.h, s: x * 100, l: (1 - y) * 100 });
  };

  const handleSquarePointerMove = (event: PointerEvent) => {
    if (!draggingSquare.current) return;
    setFromSquarePoint(event.clientX, event.clientY);
  };

  const handleSquarePointerUp = () => {
    draggingSquare.current = false;
    window.removeEventListener("pointermove", handleSquarePointerMove);
    window.removeEventListener("pointerup", handleSquarePointerUp);
  };

  const handleSquarePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    // preventDefault (blocking text selection while dragging) also blocks the
    // browser's implicit focus-on-click, same gotcha documented for Slider —
    // so focus is called explicitly below rather than relied on implicitly.
    event.preventDefault();
    event.currentTarget.focus();
    draggingSquare.current = true;
    setFromSquarePoint(event.clientX, event.clientY);
    window.addEventListener("pointermove", handleSquarePointerMove);
    window.addEventListener("pointerup", handleSquarePointerUp);
  };

  const handleSquareKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const step = event.shiftKey ? 10 : 1;
    let { s, l } = hsl;
    switch (event.key) {
      case "ArrowRight":
        s = Math.min(100, s + step);
        break;
      case "ArrowLeft":
        s = Math.max(0, s - step);
        break;
      case "ArrowUp":
        l = Math.min(100, l + step);
        break;
      case "ArrowDown":
        l = Math.max(0, l - step);
        break;
      default:
        return;
    }
    event.preventDefault();
    commitHsl({ h: hsl.h, s, l });
  };

  // --- Hue strip drag ---
  // Not built on Slider: Slider's API models a single numeric range with a
  // pill-shaped thumb and no way to render this strip's rainbow-gradient
  // track or its rounder, ring-style thumb, and its value here (0-360,
  // wrapping conceptually but not clamped-wrapping in the UI) is one piece
  // of a compound hsl object rather than Slider's standalone controlled
  // number/tuple. Reusing it would mean fighting its styling more than the
  // ~25 lines of dedicated pointer/keyboard handling below cost.
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingHue = useRef(false);

  const setFromHuePoint = (clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.width === 0 ? 0 : clamp01((clientX - rect.left) / rect.width);
    commitHsl({ h: x * 360, s: hsl.s, l: hsl.l });
  };

  const handleHuePointerMove = (event: PointerEvent) => {
    if (!draggingHue.current) return;
    setFromHuePoint(event.clientX);
  };

  const handleHuePointerUp = () => {
    draggingHue.current = false;
    window.removeEventListener("pointermove", handleHuePointerMove);
    window.removeEventListener("pointerup", handleHuePointerUp);
  };

  const handleHuePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.focus();
    draggingHue.current = true;
    setFromHuePoint(event.clientX);
    window.addEventListener("pointermove", handleHuePointerMove);
    window.addEventListener("pointerup", handleHuePointerUp);
  };

  const handleHueKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const step = event.shiftKey ? 10 : 1;
    let h = hsl.h;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        h = Math.min(360, h + step);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        h = Math.max(0, h - step);
        break;
      case "Home":
        h = 0;
        break;
      case "End":
        h = 360;
        break;
      default:
        return;
    }
    event.preventDefault();
    commitHsl({ h, s: hsl.s, l: hsl.l });
  };

  // --- Text input: live-update while typing valid text, revert on invalid blur ---
  const commitTypedValue = () => {
    const parsed = parseColorString(inputText);
    if (!parsed) {
      setInputText(formatColor(value, format));
      return;
    }
    const parsedHsl = hexToHsl(parsed);
    if (parsedHsl) setHsl(parsedHsl);
    lastEmittedHex.current = parsed;
    setValue(parsed);
    setInputText(formatColor(parsed, format));
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    const parsed = parseColorString(text);
    if (parsed) {
      const parsedHsl = hexToHsl(parsed);
      if (parsedHsl) setHsl(parsedHsl);
      lastEmittedHex.current = parsed;
      setValue(parsed);
    }
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTypedValue();
    }
  };

  const isInputInvalid = parseColorString(inputText) === null;

  const hueBaseColor = hslToHex({ h: hsl.h, s: 100, l: 50 });

  const classes = [trigger, className].filter(Boolean).join(" ");

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <div className={panel} role="group" aria-label={ariaLabel}>
          <div
            ref={squareRef}
            className={gradientSquare}
            style={{
              background: `linear-gradient(to top, #000, transparent 50%, #fff), linear-gradient(to right, hsl(${hsl.h}, 0%, 50%), ${hueBaseColor})`
            }}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label="Saturation and lightness"
            aria-valuetext={`Saturation ${Math.round(hsl.s)}%, lightness ${Math.round(hsl.l)}%`}
            onPointerDown={handleSquarePointerDown}
            onKeyDown={handleSquareKeyDown}
          >
            <span
              className={gradientDot}
              style={{
                left: `${hsl.s}%`,
                top: `${100 - hsl.l}%`,
                background: value
              }}
            />
          </div>

          <div
            ref={hueRef}
            className={hueStrip}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsl.h)}
            onPointerDown={handleHuePointerDown}
            onKeyDown={handleHueKeyDown}
          >
            <span className={hueThumb} style={{ left: `${(hsl.h / 360) * 100}%`, background: hueBaseColor }} />
          </div>

          <div className={presetRow} role="group" aria-label="Preset colors">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                className={presetSwatch}
                style={{ background: preset }}
                aria-label={preset}
                aria-pressed={preset.toLowerCase() === value.toLowerCase()}
                onClick={() => {
                  lastEmittedHex.current = preset;
                  const parsedHsl = hexToHsl(preset);
                  if (parsedHsl) setHsl(parsedHsl);
                  setValue(preset);
                }}
              />
            ))}
          </div>

          <input
            type="text"
            className={textInput}
            value={inputText}
            aria-label={`Color value (${format})`}
            aria-invalid={isInputInvalid || undefined}
            onChange={(event) => handleInputChange(event.target.value)}
            onBlur={commitTypedValue}
            onKeyDown={handleInputKeyDown}
          />
        </div>
      }
    >
      <button
        type="button"
        className={classes}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
      >
        <span className={triggerSwatch} style={{ background: value }} />
      </button>
    </Popover>
  );
}
