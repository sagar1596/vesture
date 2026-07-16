import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { accent, alert, body, closeButton, description, title } from "./Alert.css";

export type AlertVariant = keyof typeof accent;

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  title?: ReactNode;
  onDismiss?: () => void;
}

export function Alert({
  variant = "info",
  title: titleText,
  onDismiss,
  children,
  className,
  ...rest
}: AlertProps): ReactElement {
  return (
    <div
      role="alert"
      className={[alert, accent[variant], className].filter(Boolean).join(" ")}
      {...rest}
    >
      <div className={body}>
        {titleText ? <p className={title}>{titleText}</p> : null}
        {children ? <p className={description}>{children}</p> : null}
      </div>
      {onDismiss ? (
        <button type="button" className={closeButton} aria-label="Dismiss" onClick={onDismiss}>
          ✕
        </button>
      ) : null}
    </div>
  );
}
