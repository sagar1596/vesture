import { forwardRef } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { badge, variant } from "./Badge.css";

export type BadgeVariant = keyof typeof variant;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant: variantProp = "default", className, ...rest },
  ref
): ReactElement {
  const classes = [badge, variant[variantProp], className].filter(Boolean).join(" ");

  return <span ref={ref} className={classes} {...rest} />;
});
