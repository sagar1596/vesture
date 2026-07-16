import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactElement } from "react";
import { input } from "./Input.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...rest },
  ref
): ReactElement {
  const classes = [input, className].filter(Boolean).join(" ");

  return <input ref={ref} className={classes} aria-invalid={invalid || undefined} {...rest} />;
});
