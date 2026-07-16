import { createContext, useContext } from "react";

export interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
}

export const AccordionContext = createContext<AccordionContextValue | null>(null);

export function useAccordionContext(): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion.Item must be used within an Accordion");
  }
  return context;
}

export const AccordionItemContext = createContext<string | null>(null);

export function useAccordionItemContext(): string {
  const context = useContext(AccordionItemContext);
  if (context === null) {
    throw new Error("Accordion.Trigger and Accordion.Content must be used within an Accordion.Item");
  }
  return context;
}
