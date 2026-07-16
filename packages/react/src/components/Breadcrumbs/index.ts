import { Breadcrumbs as BreadcrumbsBase } from "./Breadcrumbs";
import { BreadcrumbsItem } from "./BreadcrumbsItem";

export const Breadcrumbs = Object.assign(BreadcrumbsBase, { Item: BreadcrumbsItem });
export type { BreadcrumbsProps } from "./Breadcrumbs";
export { BreadcrumbsItem } from "./BreadcrumbsItem";
export type { BreadcrumbsItemProps } from "./BreadcrumbsItem";
