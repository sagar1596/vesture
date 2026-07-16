import type { HTMLAttributes, KeyboardEvent, ReactElement } from "react";
import { list } from "./Tabs.css";

export type TabsListProps = HTMLAttributes<HTMLDivElement>;

export function TabsList({ children, className, onKeyDown, ...rest }: TabsListProps): ReactElement {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }

    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
    if (tabs.length === 0) {
      return;
    }

    const currentIndex = tabs.indexOf(document.activeElement as HTMLElement);

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = currentIndex < 0 ? tabs.length - 1 : (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    }
  };

  return (
    <div role="tablist" className={[list, className].filter(Boolean).join(" ")} onKeyDown={handleKeyDown} {...rest}>
      {children}
    </div>
  );
}
