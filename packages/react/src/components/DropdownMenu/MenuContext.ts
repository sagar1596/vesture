import { createContext, useContext } from "react";
import type { useInteractions } from "@floating-ui/react";

export interface MenuContextValue {
  activeIndex: number | null;
  getItemProps: ReturnType<typeof useInteractions>["getItemProps"];
  closeMenu: () => void;
}

export const MenuContext = createContext<MenuContextValue | null>(null);

export function useMenuContext(): MenuContextValue {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("DropdownMenu.Item must be used within a DropdownMenu");
  }
  return context;
}
