import { Children, Fragment, cloneElement, isValidElement } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { list, separator } from "./Breadcrumbs.css";

export interface BreadcrumbsProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  separator?: ReactNode;
  children?: ReactNode;
}

export function Breadcrumbs({
  separator: separatorNode = "/",
  children,
  ...rest
}: BreadcrumbsProps): ReactElement {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <nav aria-label="Breadcrumb" {...rest}>
      <ol className={list}>
        {items.map((child, index) => (
          <Fragment key={index}>
            {cloneElement(child as ReactElement<{ isLast?: boolean }>, {
              isLast: index === items.length - 1
            })}
            {index < items.length - 1 ? (
              <li className={separator} aria-hidden="true">
                {separatorNode}
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
