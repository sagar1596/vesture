import { DropdownMenu as DropdownMenuBase } from "./DropdownMenu";
import { DropdownMenuItem } from "./DropdownMenuItem";

export const DropdownMenu = Object.assign(DropdownMenuBase, { Item: DropdownMenuItem });
export type { DropdownMenuProps } from "./DropdownMenu";
export { DropdownMenuItem } from "./DropdownMenuItem";
export type { DropdownMenuItemProps } from "./DropdownMenuItem";
