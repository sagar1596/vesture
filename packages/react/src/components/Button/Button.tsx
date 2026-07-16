import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactElement } from "react";
import { button, variant } from "./Button.css";

export type ButtonVariant = keyof typeof variant;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant: variantProp = "primary", className, ...rest }, ref): ReactElement {
    const classes = [button, variant[variantProp], className].filter(Boolean).join(" ");

    return <button ref={ref} className={classes} {...rest} />;
  }
);
