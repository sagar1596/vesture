import type { AnchorHTMLAttributes, ReactElement, ReactNode } from "react";
import { current, item, link } from "./Breadcrumbs.css";

export interface BreadcrumbsItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

interface InternalProps {
  isLast?: boolean;
}

export function BreadcrumbsItem({
  href,
  children,
  isLast,
  className,
  ...rest
}: BreadcrumbsItemProps & InternalProps): ReactElement {
  return (
    <li className={item}>
      {isLast || !href ? (
        <span className={[current, className].filter(Boolean).join(" ")} aria-current={isLast ? "page" : undefined}>
          {children}
        </span>
      ) : (
        <a href={href} className={[link, className].filter(Boolean).join(" ")} {...rest}>
          {children}
        </a>
      )}
    </li>
  );
}
