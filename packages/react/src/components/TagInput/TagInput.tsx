import { useId, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent, ReactElement, ReactNode } from "react";
import { field, hint, input as inputClass, list, option, root, tag, tagRemove } from "./TagInput.css";

export interface TagInputProps {
  value?: string[];
  defaultValue?: string[];
  onChange?: (tags: string[]) => void;
  /** Autocomplete candidates, filtered by the current text. */
  suggestions?: string[];
  /** Allow tags that aren't in `suggestions`. Default true. */
  allowCustom?: boolean;
  allowDuplicates?: boolean;
  maxTags?: number;
  /** Keys that commit the current text. Default `["Enter", ","]`. Use `"Tab"` or `" "` to add more. */
  delimiters?: string[];
  /** Returns an error message to reject a tag, or null/undefined to accept. */
  validate?: (tag: string, current: string[]) => string | null | undefined;
  /** Transform a tag before it's stored (e.g. lowercase). */
  normalize?: (tag: string) => string;
  /** Called when a tag is rejected, with the reason. */
  onReject?: (tag: string, reason: string) => void;
  renderTag?: (tag: string, index: number) => ReactNode;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Remove the last tag on Backspace in an empty input. Default true. */
  backspaceRemoves?: boolean;
  "aria-label"?: string;
  className?: string;
}

/** Chip/tag input with typeahead suggestions, paste-splitting, validation and keyboard editing. */
export function TagInput({
  value: controlledValue,
  defaultValue = [],
  onChange,
  suggestions = [],
  allowCustom = true,
  allowDuplicates = false,
  maxTags,
  delimiters = ["Enter", ","],
  validate,
  normalize = (t) => t.trim(),
  onReject,
  renderTag,
  placeholder = "Add a tag…",
  disabled = false,
  invalid = false,
  backspaceRemoves = true,
  "aria-label": ariaLabel = "Tags",
  className
}: TagInputProps): ReactElement {
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultValue);
  const tags = controlledValue !== undefined ? controlledValue : uncontrolled;
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const set = (next: string[]) => {
    if (controlledValue === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(text.trim().toLowerCase()) && (allowDuplicates || !tags.includes(s))
  );
  const showList = open && filtered.length > 0 && !disabled;

  /** Tries to add several raw strings; returns the tags that were accepted. */
  const addMany = (raws: string[]): boolean => {
    let next = tags;
    let rejected: string | null = null;
    for (const raw of raws) {
      const t = normalize(raw);
      if (!t) continue;
      let reason: string | null | undefined = null;
      if (maxTags !== undefined && next.length >= maxTags) reason = `At most ${maxTags} tags`;
      else if (!allowDuplicates && next.includes(t)) reason = "Already added";
      else if (!allowCustom && !suggestions.includes(t)) reason = "Pick one of the suggestions";
      else reason = validate?.(t, next);
      if (reason) {
        rejected = reason;
        onReject?.(t, reason);
      } else {
        next = [...next, t];
      }
    }
    if (next !== tags) set(next);
    setError(rejected);
    return rejected === null;
  };

  const commitText = () => {
    if (text.trim() === "") return;
    if (addMany([text])) setText("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showList && e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % filtered.length);
    } else if (showList && e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && showList && text.trim() !== "" && filtered[active]) {
      e.preventDefault();
      if (addMany([filtered[active]!])) setText("");
    } else if (delimiters.includes(e.key)) {
      if (text.trim() !== "" || e.key === "Enter") e.preventDefault();
      commitText();
    } else if (e.key === "Backspace" && text === "" && backspaceRemoves && tags.length > 0) {
      set(tags.slice(0, -1));
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData("text");
    const splitter = new RegExp(`[${delimiters.filter((d) => d.length === 1).map((d) => (d === " " ? "\\s" : d.replace(/[\]\\^-]/g, "\\$&"))).join("")}\\n\\t]+`);
    const parts = raw.split(splitter);
    if (parts.length > 1) {
      e.preventDefault();
      addMany(parts);
      setText("");
    }
  };

  const remove = (i: number) => {
    set(tags.filter((_, k) => k !== i));
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      <div
        className={field}
        data-invalid={invalid || error !== null}
        data-disabled={disabled}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((t, i) => (
          <span key={`${t}-${i}`} className={tag} data-testid="tag">
            {renderTag ? renderTag(t, i) : t}
            {!disabled ? (
              <button type="button" className={tagRemove} aria-label={`Remove ${t}`} onClick={() => remove(i)}>
                ×
              </button>
            ) : null}
          </span>
        ))}
        <input
          ref={inputRef}
          className={inputClass}
          value={text}
          disabled={disabled}
          placeholder={tags.length === 0 ? placeholder : undefined}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || error !== null || undefined}
          aria-autocomplete="list"
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
            setError(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            commitText();
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
      </div>
      {showList ? (
        <ul id={listId} className={list} role="listbox">
          {filtered.map((s, i) => (
            <li
              key={s}
              id={`${listId}-${i}`}
              className={option}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              // mousedown (not click) so the input's blur doesn't commit the half-typed text first
              onMouseDown={(e) => {
                e.preventDefault();
                if (addMany([s])) setText("");
                inputRef.current?.focus();
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <div className={hint} role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
