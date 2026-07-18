import { forwardRef, useEffect, useRef } from "react";
import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { box, hiddenInput, wrapper } from "./Checkbox.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, indeterminate = false, ...rest },
  ref
): ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className={[wrapper, className].filter(Boolean).join(" ")}>
      <input
        ref={(el) => {
          inputRef.current = el;
          if (typeof ref === "function") {
            ref(el);
          } else if (ref) {
            ref.current = el;
          }
        }}
        type="checkbox"
        className={hiddenInput}
        {...rest}
      />
      <span className={box} aria-hidden="true" />
      {label}
    </label>
  );
});
