import type { ButtonHTMLAttributes, ReactElement } from "react";
import { trigger } from "./Tabs.css";
import { useTabsContext } from "./TabsContext";

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, children, className, onClick, ...rest }: TabsTriggerProps): ReactElement {
  const { value: selected, setValue } = useTabsContext();
  const isSelected = selected === value;

  return (
    <button
      type="button"
      role="tab"
      id={`tab-${value}`}
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
      tabIndex={isSelected ? 0 : -1}
      className={[trigger, className].filter(Boolean).join(" ")}
      onClick={(event) => {
        setValue(value);
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
