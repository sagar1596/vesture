import type { HTMLAttributes, ReactElement } from "react";
import { panel } from "./Tabs.css";
import { useTabsContext } from "./TabsContext";

export interface TabsPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsPanel({ value, children, className, ...rest }: TabsPanelProps): ReactElement | null {
  const { value: selected } = useTabsContext();
  if (selected !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={[panel, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
