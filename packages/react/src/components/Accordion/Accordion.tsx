import { useState } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { root } from "./Accordion.css";
import { AccordionContext } from "./AccordionContext";

type CommonDivProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">;

interface AccordionSingleProps extends CommonDivProps {
  type: "single";
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}

interface AccordionMultipleProps extends CommonDivProps {
  type: "multiple";
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

export function Accordion(props: AccordionProps): ReactElement {
  const { type, children, value, defaultValue, onValueChange, className, ...rest } = props;
  const isControlled = value !== undefined;

  const [internalValues, setInternalValues] = useState<string[]>(() => {
    if (type === "single") {
      return props.defaultValue ? [props.defaultValue] : [];
    }
    return props.defaultValue ?? [];
  });

  const currentValues: string[] = isControlled
    ? type === "single"
      ? props.value
        ? [props.value]
        : []
      : (props.value ?? [])
    : internalValues;

  const toggle = (itemValue: string) => {
    const next =
      type === "single"
        ? currentValues.includes(itemValue)
          ? []
          : [itemValue]
        : currentValues.includes(itemValue)
          ? currentValues.filter((v) => v !== itemValue)
          : [...currentValues, itemValue];

    if (!isControlled) {
      setInternalValues(next);
    }

    if (type === "single") {
      props.onValueChange?.(next[0] ?? null);
    } else {
      props.onValueChange?.(next);
    }
  };

  const isOpen = (itemValue: string) => currentValues.includes(itemValue);

  return (
    <div className={[root, className].filter(Boolean).join(" ")} {...rest}>
      <AccordionContext.Provider value={{ isOpen, toggle }}>{children}</AccordionContext.Provider>
    </div>
  );
}
