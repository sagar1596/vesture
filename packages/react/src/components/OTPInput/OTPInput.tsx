import { useRef, useState } from "react";
import type {
  ChangeEvent as ReactChangeEvent,
  ClipboardEvent as ReactClipboardEvent,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactElement,
} from "react";
import { box, group } from "./OTPInput.css";

export interface OTPInputProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  type?: "numeric" | "alphanumeric";
  disabled?: boolean;
  className?: string;
}

function isValidChar(char: string, type: "numeric" | "alphanumeric"): boolean {
  if (char.length !== 1) return false;
  return type === "numeric" ? /[0-9]/.test(char) : /[a-zA-Z0-9]/.test(char);
}

export function OTPInput({
  length = 6,
  value: controlledValue,
  defaultValue,
  onChange,
  onComplete,
  type = "numeric",
  disabled = false,
  className,
}: OTPInputProps): ReactElement {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasFiredCompleteRef = useRef(false);

  function commit(nextChars: string[]) {
    const nextValue = nextChars.join("");
    if (controlledValue === undefined) setUncontrolledValue(nextValue);
    onChange?.(nextValue);

    const isComplete = nextChars.every((c) => c !== "");
    if (isComplete) {
      if (!hasFiredCompleteRef.current) {
        hasFiredCompleteRef.current = true;
        onComplete?.(nextValue);
      }
    } else {
      hasFiredCompleteRef.current = false;
    }
  }

  function handleChange(index: number) {
    return (event: ReactChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;

      if (raw === "") {
        const next = [...chars];
        next[index] = "";
        commit(next);
        return;
      }

      const lastChar = raw.slice(-1);
      if (!isValidChar(lastChar, type)) {
        event.target.value = chars[index] ?? "";
        return;
      }

      const next = [...chars];
      next[index] = lastChar;
      commit(next);

      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };
  }

  function handleKeyDown(index: number) {
    return (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace") {
        if (chars[index] === "" && index > 0) {
          event.preventDefault();
          const next = [...chars];
          next[index - 1] = "";
          commit(next);
          inputRefs.current[index - 1]?.focus();
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        if (index > 0) {
          event.preventDefault();
          inputRefs.current[index - 1]?.focus();
        }
        return;
      }

      if (event.key === "ArrowRight") {
        if (index < length - 1) {
          event.preventDefault();
          inputRefs.current[index + 1]?.focus();
        }
      }
    };
  }

  function handlePaste(event: ReactClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    const filtered = pasted
      .split("")
      .filter((char) => isValidChar(char, type))
      .slice(0, length);
    if (filtered.length === 0) return;

    const next = Array.from({ length }, (_, i) => filtered[i] ?? "");
    commit(next);

    const focusIndex = Math.min(filtered.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  function handleFocus(event: ReactFocusEvent<HTMLInputElement>) {
    event.target.select();
  }

  return (
    <div className={[group, className].filter(Boolean).join(" ")} role="group" aria-label="One-time code">
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode={type === "numeric" ? "numeric" : "text"}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          className={box}
          value={char}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste}
          onFocus={handleFocus}
        />
      ))}
    </div>
  );
}
