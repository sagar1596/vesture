import { forwardRef } from "react";
import type { ReactElement } from "react";
import { base, lastLine, linesContainer, pulse, shimmerOverlay, variant as variantStyles } from "./Skeleton.css";
import type { SkeletonProps } from "./types";

function toCssSize(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = "text", width, height, lines = 1, animation = "shimmer", className, style, ...rest },
  ref
): ReactElement {
  const cssWidth = toCssSize(width);
  const cssHeight = toCssSize(height);

  const classes = [base, variantStyles[variant], animation === "pulse" ? pulse : null, className]
    .filter(Boolean)
    .join(" ");

  if (variant === "text" && lines > 1) {
    return (
      <div ref={ref} className={linesContainer} aria-hidden="true" data-testid="skeleton" {...rest}>
        {Array.from({ length: lines }, (_, index) => {
          const isLastLine = index === lines - 1;
          const lineClasses = [classes, isLastLine && !cssWidth ? lastLine : null].filter(Boolean).join(" ");
          return (
            <div
              key={index}
              className={lineClasses}
              data-testid="skeleton-line"
              style={{ width: cssWidth, height: cssHeight, ...style }}
            >
              {animation === "shimmer" ? <span className={shimmerOverlay} /> : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={classes}
      aria-hidden="true"
      data-testid="skeleton"
      style={{ width: cssWidth, height: cssHeight, ...style }}
      {...rest}
    >
      {animation === "shimmer" ? <span className={shimmerOverlay} /> : null}
    </div>
  );
});
