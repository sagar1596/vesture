import type { HTMLAttributes, ReactElement } from "react";
import { size, spinner, srOnly } from "./Spinner.css";

export type SpinnerSize = keyof typeof size;

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  label?: string;
}

export function Spinner({
  size: sizeProp = "md",
  label = "Loading",
  className,
  ...rest
}: SpinnerProps): ReactElement {
  return (
    <div
      role="status"
      aria-label={label}
      className={[spinner, size[sizeProp], className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className={srOnly}>{label}</span>
    </div>
  );
}
