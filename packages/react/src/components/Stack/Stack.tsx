import { forwardRef } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { align, direction, gap, justify, stack, wrapStyle } from "./Stack.css";

export type StackDirection = keyof typeof direction;
export type StackAlign = keyof typeof align;
export type StackJustify = keyof typeof justify;
export type StackGap = keyof typeof gap;

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  align?: StackAlign;
  justify?: StackJustify;
  gap?: StackGap;
  wrap?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  {
    direction: directionProp = "column",
    align: alignProp = "stretch",
    justify: justifyProp = "start",
    gap: gapProp = "md",
    wrap = false,
    className,
    ...rest
  },
  ref
): ReactElement {
  const classes = [
    stack,
    direction[directionProp],
    align[alignProp],
    justify[justifyProp],
    gap[gapProp],
    wrap ? wrapStyle : null,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <div ref={ref} className={classes} {...rest} />;
});
