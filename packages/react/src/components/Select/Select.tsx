import { forwardRef } from "react";
import type { ReactElement, SelectHTMLAttributes } from "react";
import { chevron, select, wrapper } from "./Select.css";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...rest },
  ref
): ReactElement {
  const classes = [select, className].filter(Boolean).join(" ");

  return (
    <span className={wrapper}>
      <select ref={ref} className={classes} aria-invalid={invalid || undefined} {...rest}>
        {children}
      </select>
      <span className={chevron} aria-hidden="true" />
    </span>
  );
});
