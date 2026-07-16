import { Accordion as AccordionBase } from "./Accordion";
import { AccordionContent } from "./AccordionContent";
import { AccordionItem } from "./AccordionItem";
import { AccordionTrigger } from "./AccordionTrigger";

export const Accordion = Object.assign(AccordionBase, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent
});
export type { AccordionProps } from "./Accordion";
export { AccordionItem } from "./AccordionItem";
export type { AccordionItemProps } from "./AccordionItem";
export { AccordionTrigger } from "./AccordionTrigger";
export type { AccordionTriggerProps } from "./AccordionTrigger";
export { AccordionContent } from "./AccordionContent";
export type { AccordionContentProps } from "./AccordionContent";
