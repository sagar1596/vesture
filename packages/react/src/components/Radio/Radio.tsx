import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";
import { circle, hiddenInput, wrapper } from "./Radio.css";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, className, ...rest },
  ref
): ReactElement {
  return (
    <label className={[wrapper, className].filter(Boolean).join(" ")}>
      <input ref={ref} type="radio" className={hiddenInput} {...rest} />
      <span className={circle} aria-hidden="true" />
      {label}
    </label>
  );
});
