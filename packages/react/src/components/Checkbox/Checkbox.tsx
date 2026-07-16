import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { box, hiddenInput, wrapper } from "./Checkbox.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...rest },
  ref
): ReactElement {
  return (
    <label className={[wrapper, className].filter(Boolean).join(" ")}>
      <input ref={ref} type="checkbox" className={hiddenInput} {...rest} />
      <span className={box} aria-hidden="true" />
      {label}
    </label>
  );
});
