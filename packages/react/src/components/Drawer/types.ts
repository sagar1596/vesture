import type { ReactNode } from "react";

export type DrawerSide = "left" | "right" | "top" | "bottom";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  children?: ReactNode;
  /** Edge the panel is anchored to. Defaults to "right", the most common drawer placement. */
  side?: DrawerSide;
  /** Width when `side` is "left"/"right", height when `side` is "top"/"bottom". Defaults to "360px". */
  size?: string | number;
}
