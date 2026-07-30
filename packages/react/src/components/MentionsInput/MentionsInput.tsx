import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from "react";
import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import type { VirtualElement } from "@floating-ui/react";
import { defaultFilterItems } from "../../utils/useFilterableList";
import { editor, emptyState, listbox, option as optionClass, optionAvatar, optionAvatarFallback, wrapper } from "./MentionsInput.css";
import { sanitizeHtml } from "./sanitize";
import type { MentionOption, MentionsInputProps } from "./types";

const DEFAULT_TRIGGER = "@";

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A contentEditable can be left with a stray <br> even when nothing is
// visually there (e.g. right after deleting the last character) — matches
// RichTextEditor's isEffectivelyEmpty reasoning, narrowed to this
// component's much smaller tag set.
function isEffectivelyEmpty(editorEl: HTMLElement): boolean {
  if (editorEl.textContent && editorEl.textContent.trim() !== "") return false;
  if (editorEl.querySelector("span[data-mention-id]")) return false;
  return true;
}

// Deduplicated, in document order, so a chip that got typed/pasted/inserted
// twice for the same entity still counts once — and re-derived fresh from
// the live DOM on every edit (not from a separately tracked React list), so
// deleting a chip out of the text is automatically reflected: there's no
// separate "mentions" state that could drift from what's actually still in
// the content.
function collectMentions(editorEl: HTMLElement): MentionOption[] {
  const nodes = editorEl.querySelectorAll<HTMLElement>("span[data-mention-id]");
  const seen = new Set<string>();
  const mentions: MentionOption[] = [];
  nodes.forEach((node) => {
    const id = node.dataset.mentionId;
    if (!id || seen.has(id)) return;
    seen.add(id);
    mentions.push({
      id,
      label: node.dataset.mentionLabel ?? "",
      avatarUrl: node.dataset.mentionAvatar || undefined
    });
  });
  return mentions;
}

interface MentionDropdownProps {
  anchorRect: DOMRect;
  loading: boolean;
  options: MentionOption[];
  activeIndex: number | null;
  onHover: (index: number) => void;
  onSelect: (option: MentionOption) => void;
  listboxId: string;
}

// Anchored to the text cursor rather than a real DOM trigger element, via a
// virtual floating-ui reference (an object satisfying getBoundingClientRect())
// — the same technique RichTextEditor's SlashMenu uses for its inline "/"
// command menu, since the "trigger" here is a caret position inside
// contentEditable, not an element Popover.tsx could anchor to. Re-implemented
// locally rather than imported: this repo has no shared hooks/component
// directory (see CLAUDE.md), and RichTextEditor doesn't export SlashMenu.
function MentionDropdown({
  anchorRect,
  loading,
  options,
  activeIndex,
  onHover,
  onSelect,
  listboxId
}: MentionDropdownProps): ReactElement {
  const { refs, floatingStyles } = useFloating({
    open: true,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })]
  });

  useEffect(() => {
    const virtualElement: VirtualElement = { getBoundingClientRect: () => anchorRect };
    refs.setReference(virtualElement);
  }, [anchorRect, refs]);

  return (
    <FloatingPortal>
      <div ref={refs.setFloating} id={listboxId} style={floatingStyles} className={listbox} role="listbox" aria-label="Mention suggestions">
        {loading ? (
          <div className={emptyState}>Loading…</div>
        ) : options.length === 0 ? (
          <div className={emptyState}>No matches</div>
        ) : (
          options.map((opt, index) => (
            <div
              key={opt.id}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              data-active={index === activeIndex || undefined}
              className={optionClass}
              onMouseEnter={() => onHover(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(opt);
              }}
            >
              {opt.avatarUrl ? (
                <img src={opt.avatarUrl} alt="" className={optionAvatar} />
              ) : (
                <span className={optionAvatarFallback} aria-hidden="true">
                  {opt.label.charAt(0).toUpperCase()}
                </span>
              )}
              {opt.label}
            </div>
          ))
        )}
      </div>
    </FloatingPortal>
  );
}

export function MentionsInput({
  value,
  defaultValue,
  onChange,
  options,
  trigger = DEFAULT_TRIGGER,
  onMentionsChange,
  placeholder,
  disabled = false,
  invalid,
  id,
  className,
  ...rest
}: MentionsInputProps): ReactElement {
  const editorRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const lastEmittedRef = useRef<string | null>(null);
  const lastMentionsKeyRef = useRef<string>("");
  const mentionRangeRef = useRef<Range | null>(null);
  const requestIdRef = useRef(0);

  const isAsync = typeof options === "function";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [asyncResults, setAsyncResults] = useState<MentionOption[]>([]);
  const [loading, setLoading] = useState(false);

  const listboxId = "mentions-input-listbox";

  const displayedOptions = isAsync ? asyncResults : defaultFilterItems(options as MentionOption[], query);

  // Async search: re-fetch whenever the query typed after the trigger
  // changes, guarding against out-of-order responses with a request token
  // (the same technique Combobox's consumers are expected to apply
  // themselves for onInputChange-driven async — here it's built in since
  // MentionsInput owns the async call directly, per the dual-mode `options`
  // prop this component follows the same T[] | (query) => Promise<T[]>
  // precedent for).
  useEffect(() => {
    if (!isAsync || !open) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    (options as (q: string) => Promise<MentionOption[]>)(query)
      .then((results) => {
        if (requestIdRef.current !== requestId) return;
        setAsyncResults(results);
        setLoading(false);
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setAsyncResults([]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `options` identity churn shouldn't retrigger a fetch mid-query
  }, [isAsync, open, query]);

  // Uncontrolled: seed the editor once from defaultValue. Controlled sync
  // (below) handles the value-prop case. Mirrors RichTextEditor's exact
  // init/sync split.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const editorEl = editorRef.current;
    if (!editorEl) return;
    const initial = value ?? defaultValue;
    if (initial) editorEl.innerHTML = sanitizeHtml(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount only
  }, []);

  // Controlled sync: only write `value` into the DOM when it didn't
  // originate from our own onChange emission a moment ago — otherwise every
  // keystroke would round-trip through the parent and reset the caret.
  useEffect(() => {
    if (value === undefined) return;
    const editorEl = editorRef.current;
    if (!editorEl) return;
    const sanitized = sanitizeHtml(value);
    if (sanitized === lastEmittedRef.current) return;
    editorEl.innerHTML = sanitized;
    if (isEffectivelyEmpty(editorEl)) editorEl.innerHTML = "";
    lastEmittedRef.current = sanitized;
    const mentions = collectMentions(editorEl);
    lastMentionsKeyRef.current = mentions.map((m) => m.id).join(",");
  }, [value]);

  function closeMentionMenu() {
    setOpen(false);
    setQuery("");
    setAnchorRect(null);
    setActiveIndex(null);
    mentionRangeRef.current = null;
  }

  function emitChange() {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    if (isEffectivelyEmpty(editorEl)) editorEl.innerHTML = "";
    const sanitized = sanitizeHtml(editorEl.innerHTML);
    lastEmittedRef.current = sanitized;
    onChange?.(sanitized);

    const mentions = collectMentions(editorEl);
    const key = mentions.map((m) => m.id).join(",");
    if (key !== lastMentionsKeyRef.current) {
      lastMentionsKeyRef.current = key;
      onMentionsChange?.(mentions);
    }
  }

  // Detects `<trigger><query>` immediately before the caret, within the
  // current text node — mirrors RichTextEditor's checkSlashTrigger, but
  // without its "must be the whole block's content" restriction, since a
  // mention can start mid-sentence (`Hey @al`) rather than only at the start
  // of an empty block the way a slash command does.
  function checkMentionTrigger() {
    const editorEl = editorRef.current;
    if (!editorEl) {
      closeMentionMenu();
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
      closeMentionMenu();
      return;
    }
    const anchorNode = selection.anchorNode;
    if (!anchorNode || !editorEl.contains(anchorNode) || anchorNode.nodeType !== Node.TEXT_NODE) {
      closeMentionMenu();
      return;
    }

    const offset = selection.anchorOffset;
    const textBefore = (anchorNode.textContent ?? "").slice(0, offset);
    const escapedTrigger = escapeRegExp(trigger);
    const pattern = new RegExp(`(?:^|\\s)${escapedTrigger}([^${escapedTrigger}\\s]*)$`);
    const match = textBefore.match(pattern);
    if (!match) {
      closeMentionMenu();
      return;
    }

    const matchedQuery = match[1] ?? "";
    const matchStart = offset - matchedQuery.length - trigger.length;

    const mentionRange = document.createRange();
    mentionRange.setStart(anchorNode, matchStart);
    mentionRange.setEnd(anchorNode, offset);
    mentionRangeRef.current = mentionRange;

    const cursorRange = document.createRange();
    cursorRange.setStart(anchorNode, offset);
    cursorRange.collapse(true);

    setQuery(matchedQuery);
    setActiveIndex(null);
    setAnchorRect(cursorRange.getBoundingClientRect());
    setOpen(true);
  }

  // Inserts a non-editable mention chip in place of the `<trigger><query>`
  // text, followed by a trailing space so typing continues normally right
  // after it rather than merging into the chip's text.
  function selectMention(selected: MentionOption) {
    const editorEl = editorRef.current;
    const range = mentionRangeRef.current;
    if (editorEl && range) {
      range.deleteContents();

      const chip = document.createElement("span");
      chip.setAttribute("contenteditable", "false");
      chip.setAttribute("data-mention-id", selected.id);
      chip.setAttribute("data-mention-label", selected.label);
      if (selected.avatarUrl) chip.setAttribute("data-mention-avatar", selected.avatarUrl);
      chip.textContent = `${trigger}${selected.label}`;
      range.insertNode(chip);

      const space = document.createTextNode(" ");
      chip.after(space);

      const newRange = document.createRange();
      newRange.setStart(space, space.length);
      newRange.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    }
    closeMentionMenu();
    editorEl?.focus();
    emitChange();
  }

  function moveActiveIndex(direction: 1 | -1) {
    if (displayedOptions.length === 0) return;
    const base = activeIndex ?? (direction === 1 ? -1 : displayedOptions.length);
    const next = (base + direction + displayedOptions.length) % displayedOptions.length;
    setActiveIndex(next);
  }

  // Inserts a manual <br> and prevents the browser's default Enter behavior
  // (splitting into a new <div>/<p>), since this component's sanitize
  // allowlist only knows about <span>/<br> — matches a chat/comment box's
  // "Enter adds a line break" feel rather than RichTextEditor's block-based
  // document model.
  function insertLineBreak() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const br = document.createElement("br");
    range.insertNode(br);
    range.setStartAfter(br);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    emitChange();
  }

  function handleEditorInput() {
    checkMentionTrigger();
    emitChange();
  }

  function handleEditorKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    if (open) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          moveActiveIndex(1);
          return;
        case "ArrowUp":
          event.preventDefault();
          moveActiveIndex(-1);
          return;
        case "Enter": {
          event.preventDefault();
          const active = activeIndex !== null ? displayedOptions[activeIndex] : displayedOptions[0];
          if (active) selectMention(active);
          return;
        }
        case "Escape":
          event.preventDefault();
          closeMentionMenu();
          return;
        default:
      }
    }

    if (event.key === "Enter") {
      event.preventDefault();
      insertLineBreak();
    }
  }

  function handleBlur() {
    closeMentionMenu();
  }

  const classes = [wrapper, className].filter(Boolean).join(" ");
  const ariaLabel = rest["aria-label"];
  const ariaLabelledBy = rest["aria-labelledby"];
  const activeOptionId = activeIndex !== null ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className={classes}>
      <div
        ref={editorRef}
        id={id}
        className={editor}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? activeOptionId : undefined}
        data-placeholder={placeholder}
        onInput={handleEditorInput}
        onKeyDown={handleEditorKeyDown}
        onBlur={handleBlur}
      />
      {open && anchorRect ? (
        <MentionDropdown
          anchorRect={anchorRect}
          loading={isAsync && loading}
          options={displayedOptions}
          activeIndex={activeIndex}
          onHover={setActiveIndex}
          onSelect={selectMention}
          listboxId={listboxId}
        />
      ) : null}
    </div>
  );
}
