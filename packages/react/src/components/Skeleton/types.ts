import type { HTMLAttributes, ReactNode } from "react";

export type SkeletonVariant = "text" | "circular" | "rectangular";
export type SkeletonAnimation = "shimmer" | "pulse" | "none";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  /** Only meaningful for variant "text" — renders this many stacked lines. */
  lines?: number;
  animation?: SkeletonAnimation;
}

export interface SkeletonWrapperProps {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}
