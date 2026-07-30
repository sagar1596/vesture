export interface MentionOption {
  id: string;
  label: string;
  avatarUrl?: string;
}

export interface MentionsInputProps {
  value?: string;
  defaultValue?: string;
  /** Fires with the sanitized HTML content (plain text plus non-editable mention chip spans) on every edit. */
  onChange?: (value: string) => void;
  /** Static list of mentionable options, or an async search keyed by the text typed after the trigger character. */
  options: MentionOption[] | ((query: string) => Promise<MentionOption[]>);
  /** Character that opens the mention dropdown. Defaults to "@". */
  trigger?: string;
  /**
   * Fires with the current set of entities actually mentioned in the text,
   * deduplicated by id in document order. Recomputed after every edit, so it
   * correctly drops an entity the moment its chip is deleted from the text —
   * not just when a new mention is inserted.
   */
  onMentionsChange?: (mentions: MentionOption[]) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}
