import { forwardRef } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { base, orientation } from "./Divider.css";

export type DividerOrientation = keyof typeof orientation;

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: DividerOrientation;
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { orientation: orientationProp = "horizontal", className, ...rest },
  ref
): ReactElement {
  const classes = [base, orientation[orientationProp], className].filter(Boolean).join(" ");

  return (
    <hr
      ref={ref}
      className={classes}
      aria-orientation={orientationProp}
      {...rest}
    />
  );
});
