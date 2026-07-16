import { createContext, useContext } from "react";

export interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs.List, Tabs.Trigger, and Tabs.Panel must be used within a Tabs component");
  }
  return context;
}
