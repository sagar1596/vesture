import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { action, description as descriptionClass, icon, root, title } from "./EmptyState.css";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: iconNode,
  title: titleText,
  description,
  action: actionNode,
  className,
  ...rest
}: EmptyStateProps): ReactElement {
  return (
    <div className={[root, className].filter(Boolean).join(" ")} {...rest}>
      {iconNode ? <div className={icon}>{iconNode}</div> : null}
      <div className={title}>{titleText}</div>
      {description ? <div className={descriptionClass}>{description}</div> : null}
      {actionNode ? <div className={action}>{actionNode}</div> : null}
    </div>
  );
}
