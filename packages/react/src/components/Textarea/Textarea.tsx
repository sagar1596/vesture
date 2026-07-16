import { forwardRef } from "react";
import type { ReactElement, TextareaHTMLAttributes } from "react";
import { textarea } from "./Textarea.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, ...rest },
  ref
): ReactElement {
  const classes = [textarea, className].filter(Boolean).join(" ");

  return <textarea ref={ref} className={classes} aria-invalid={invalid || undefined} {...rest} />;
});
