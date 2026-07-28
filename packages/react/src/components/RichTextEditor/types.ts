import type { CSSProperties } from "react";

export type ToolbarCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "heading1"
  | "heading2"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "link"
  | "table"
  | "image"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "alignJustify"
  | "textColor"
  | "highlightColor"
  | "fontSize"
  | "undo"
  | "redo";

export const DEFAULT_TOOLBAR: ToolbarCommand[] = [
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
  "alignJustify",
  "textColor",
  "highlightColor",
  "fontSize",
  "link",
  "table",
  "image",
  "undo",
  "redo"
];

export interface RichTextEditorProps {
  /** Controlled HTML value. Always sanitized before being written to the editor. */
  value?: string;
  defaultValue?: string;
  /** Fires with sanitized HTML on every meaningful edit — never the raw contentEditable innerHTML. */
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** @default DEFAULT_TOOLBAR (all commands) */
  toolbar?: ToolbarCommand[];
  /**
   * Called when an image is added via the upload option in the image
   * popover. If provided, its resolved URL is used as the <img> src instead
   * of a base64 data URL — use this to upload to your own backend/CDN.
   * Falls back to base64 embedding when omitted (see imageUtils.ts for the
   * tradeoff that implies).
   */
  onImageUpload?: (file: File) => Promise<string>;
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
}
