import { forwardRef } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { card, elevation } from "./Card.css";

export type CardElevation = keyof typeof elevation;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: CardElevation;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevation: elevationProp = "flat", className, ...rest },
  ref
): ReactElement {
  const classes = [card, elevation[elevationProp], className].filter(Boolean).join(" ");

  return <div ref={ref} className={classes} {...rest} />;
});
