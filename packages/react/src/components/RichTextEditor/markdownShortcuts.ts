export type MarkdownShortcutAction =
  | "heading1"
  | "heading2"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "codeBlock";

// Order matters: "## " must be checked before "# " since "#" is a prefix of "##".
const TRIGGERS: { regex: RegExp; action: MarkdownShortcutAction }[] = [
  { regex: /^##\s$/, action: "heading2" },
  { regex: /^#\s$/, action: "heading1" },
  { regex: /^[*-]\s$/, action: "bulletList" },
  { regex: /^1\.\s$/, action: "orderedList" },
  { regex: /^>\s$/, action: "blockquote" },
  { regex: /^```$/, action: "codeBlock" }
];

/**
 * Checks whether `textBeforeCursor` (the current block's full text content,
 * since the trigger is only recognized in an otherwise-empty block) matches
 * one of the Notion-style markdown trigger patterns.
 */
export function matchMarkdownShortcut(textBeforeCursor: string): MarkdownShortcutAction | null {
  for (const { regex, action } of TRIGGERS) {
    if (regex.test(textBeforeCursor)) return action;
  }
  return null;
}
