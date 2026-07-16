import type { ReactElement, ReactNode } from "react";
import { item } from "./Accordion.css";
import { AccordionItemContext } from "./AccordionContext";

export interface AccordionItemProps {
  value: string;
  children?: ReactNode;
}

export function AccordionItem({ value, children }: AccordionItemProps): ReactElement {
  return (
    <div className={item}>
      <AccordionItemContext.Provider value={value}>{children}</AccordionItemContext.Provider>
    </div>
  );
}
