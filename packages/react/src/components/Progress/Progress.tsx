import type { HTMLAttributes, ReactElement } from "react";
import { fill, indeterminateFill, label, track } from "./Progress.css";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  label?: string;
}

export function Progress({ value, max = 100, label: labelText, className, ...rest }: ProgressProps): ReactElement {
  const isIndeterminate = value === undefined;
  const percentage = isIndeterminate ? undefined : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={className} {...rest}>
      {labelText || !isIndeterminate ? (
        <div className={label}>
          <span>{labelText}</span>
          {!isIndeterminate ? <span>{Math.round(percentage!)}%</span> : null}
        </div>
      ) : null}
      <div
        className={track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={isIndeterminate ? undefined : value}
        aria-label={labelText}
      >
        {isIndeterminate ? (
          <div className={indeterminateFill} />
        ) : (
          <div className={fill} style={{ width: `${percentage}%` }} />
        )}
      </div>
    </div>
  );
}
