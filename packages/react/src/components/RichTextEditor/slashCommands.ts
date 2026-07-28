import type { FilterableItem } from "../../utils/useFilterableList";
import type { ToolbarCommand } from "./types";

export interface SlashCommandItem extends FilterableItem {
  id: ToolbarCommand;
}

// Reuses the exact same ToolbarCommand ids runCommand() already knows how to
// execute — selecting a slash command is just "remove the /query text, then
// call runCommand with this id," no separate execution path to maintain.
export const SLASH_COMMANDS: SlashCommandItem[] = [
  { id: "heading1", label: "Heading 1" },
  { id: "heading2", label: "Heading 2" },
  { id: "bulletList", label: "Bullet List", keywords: ["list", "ul", "bullet"] },
  { id: "orderedList", label: "Ordered List", keywords: ["list", "ol", "numbered"] },
  { id: "blockquote", label: "Blockquote", keywords: ["quote"] },
  { id: "table", label: "Table" },
  { id: "image", label: "Image", keywords: ["picture", "photo"] }
];
