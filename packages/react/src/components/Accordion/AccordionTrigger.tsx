import type { ButtonHTMLAttributes, ReactElement } from "react";
import { icon, trigger } from "./Accordion.css";
import { useAccordionContext, useAccordionItemContext } from "./AccordionContext";

export type AccordionTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function AccordionTrigger({ children, className, ...rest }: AccordionTriggerProps): ReactElement {
  const { isOpen, toggle } = useAccordionContext();
  const value = useAccordionItemContext();
  const open = isOpen(value);

  return (
    <h3 style={{ margin: 0 }}>
      <button
        type="button"
        id={`accordion-trigger-${value}`}
        className={[trigger, className].filter(Boolean).join(" ")}
        aria-expanded={open}
        aria-controls={`accordion-panel-${value}`}
        data-open={open}
        onClick={() => toggle(value)}
        {...rest}
      >
        {children}
        <span className={icon} aria-hidden="true">
          ▾
        </span>
      </button>
    </h3>
  );
}
