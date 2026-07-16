import { forwardRef } from "react";
import type { LabelHTMLAttributes, ReactElement } from "react";
import { label, requiredMark } from "./Label.css";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required, disabled, className, children, ...rest },
  ref
): ReactElement {
  const classes = [label, className].filter(Boolean).join(" ");

  return (
    <label ref={ref} className={classes} data-disabled={disabled || undefined} {...rest}>
      {children}
      {required ? (
        <span className={requiredMark} aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
});
