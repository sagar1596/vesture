import { forwardRef } from "react";
import type { ReactElement, SelectHTMLAttributes } from "react";
import { chevron, select, wrapper } from "./Select.css";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, style, children, ...rest },
  ref
): ReactElement {
  const classes = [select, className].filter(Boolean).join(" ");

  return (
    // `style` sizes the wrapper (not the inner <select>) so the chevron —
    // absolutely positioned relative to this span — stays flush against
    // whatever width the consumer sets, instead of a maxWidth on the select
    // narrowing just the control while the full-width wrapper leaves the
    // chevron stranded out to the right of it.
    <span className={wrapper} style={style}>
      <select ref={ref} className={classes} aria-invalid={invalid || undefined} {...rest}>
        {children}
      </select>
      <span className={chevron} aria-hidden="true" />
    </span>
  );
});
