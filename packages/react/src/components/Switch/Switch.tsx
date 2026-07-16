import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { hiddenInput, track, wrapper } from "./Switch.css";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, className, ...rest },
  ref
): ReactElement {
  return (
    <label className={[wrapper, className].filter(Boolean).join(" ")}>
      <input ref={ref} type="checkbox" role="switch" className={hiddenInput} {...rest} />
      <span className={track} aria-hidden="true" />
      {label}
    </label>
  );
});
