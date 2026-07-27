import type { ReactNode } from "react";
import type { SkeletonWrapperProps } from "./types";

export function SkeletonWrapper({ loading, skeleton, children }: SkeletonWrapperProps): ReactNode {
  return loading ? skeleton : children;
}
