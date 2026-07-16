import type { HTMLAttributes, ReactElement } from "react";
import { contentBody, contentInner, contentWrapper } from "./Accordion.css";
import { useAccordionContext, useAccordionItemContext } from "./AccordionContext";

export type AccordionContentProps = HTMLAttributes<HTMLDivElement>;

export function AccordionContent({ children, className, ...rest }: AccordionContentProps): ReactElement {
  const { isOpen } = useAccordionContext();
  const value = useAccordionItemContext();
  const open = isOpen(value);

  return (
    <div
      id={`accordion-panel-${value}`}
      role="region"
      aria-labelledby={`accordion-trigger-${value}`}
      className={[contentWrapper, className].filter(Boolean).join(" ")}
      data-open={open}
      {...rest}
    >
      <div className={contentInner}>
        <div className={contentBody}>{children}</div>
      </div>
    </div>
  );
}
