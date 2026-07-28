import type { ToolbarCommand } from "./types";

export interface ToolbarButtonConfig {
  command: ToolbarCommand;
  label: string;
  icon: string;
}

// Short text glyphs rather than an icon library — matches this repo's
// "no new dependencies for a shape this simple" convention (see Rating's
// self-authored star SVG).
export const TOOLBAR_BUTTONS: Record<ToolbarCommand, ToolbarButtonConfig> = {
  bold: { command: "bold", label: "Bold", icon: "B" },
  italic: { command: "italic", label: "Italic", icon: "I" },
  underline: { command: "underline", label: "Underline", icon: "U" },
  strikethrough: { command: "strikethrough", label: "Strikethrough", icon: "S" },
  heading1: { command: "heading1", label: "Heading 1", icon: "H1" },
  heading2: { command: "heading2", label: "Heading 2", icon: "H2" },
  bulletList: { command: "bulletList", label: "Bullet list", icon: "•" },
  orderedList: { command: "orderedList", label: "Numbered list", icon: "1." },
  blockquote: { command: "blockquote", label: "Blockquote", icon: "❝" },
  link: { command: "link", label: "Link", icon: "🔗" },
  table: { command: "table", label: "Table", icon: "⊞" },
  image: { command: "image", label: "Image", icon: "🖼" },
  alignLeft: { command: "alignLeft", label: "Align left", icon: "⇤" },
  alignCenter: { command: "alignCenter", label: "Align center", icon: "≡" },
  alignRight: { command: "alignRight", label: "Align right", icon: "⇥" },
  alignJustify: { command: "alignJustify", label: "Justify", icon: "☰" },
  textColor: { command: "textColor", label: "Text color", icon: "A" },
  highlightColor: { command: "highlightColor", label: "Highlight color", icon: "H" },
  fontSize: { command: "fontSize", label: "Font size", icon: "Aa" },
  undo: { command: "undo", label: "Undo", icon: "↺" },
  redo: { command: "redo", label: "Redo", icon: "↻" }
};

/** execCommand name + formatBlock value (for heading/blockquote) per toolbar command. */
export const EXEC_COMMAND: Partial<Record<ToolbarCommand, string>> = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikeThrough",
  bulletList: "insertUnorderedList",
  orderedList: "insertOrderedList",
  alignLeft: "justifyLeft",
  alignCenter: "justifyCenter",
  alignRight: "justifyRight",
  alignJustify: "justifyFull",
  undo: "undo",
  redo: "redo"
};

export const FORMAT_BLOCK_TAG: Partial<Record<ToolbarCommand, string>> = {
  heading1: "H1",
  heading2: "H2",
  blockquote: "BLOCKQUOTE"
};

/** queryCommandState key used to reflect a toolbar button's active/pressed state. */
export const STATE_COMMAND: Partial<Record<ToolbarCommand, string>> = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikeThrough",
  bulletList: "insertUnorderedList",
  orderedList: "insertOrderedList",
  alignLeft: "justifyLeft",
  alignCenter: "justifyCenter",
  alignRight: "justifyRight",
  alignJustify: "justifyFull"
};

/** Commands whose toolbar button toggles and should expose aria-pressed. */
export const TOGGLE_COMMANDS = new Set<ToolbarCommand>([
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "heading1",
  "heading2",
  "bulletList",
  "orderedList",
  "blockquote",
  "alignLeft",
  "alignCenter",
  "alignRight",
  "alignJustify"
]);
