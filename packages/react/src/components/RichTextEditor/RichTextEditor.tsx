import { useEffect, useRef, useState } from "react";
import type {
  ClipboardEvent as ReactClipboardEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactElement
} from "react";
import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import type { VirtualElement } from "@floating-ui/react";
import { Button } from "../Button";
import { DropdownMenu } from "../DropdownMenu";
import { FileUpload } from "../FileUpload";
import type { UploadFile } from "../FileUpload";
import { Input } from "../Input";
import { Popover } from "../Popover";
import { useFilterableList } from "../../utils/useFilterableList";
import { COLOR_SWATCHES } from "./colors";
import { EXEC_COMMAND, FORMAT_BLOCK_TAG, STATE_COMMAND, TOGGLE_COMMANDS, TOOLBAR_BUTTONS } from "./commands";
import { FONT_SIZE_MARKER, FONT_SIZE_OPTIONS, resolveFontSizePx } from "./fontSizes";
import { readFileAsDataUrl } from "./imageUtils";
import { matchMarkdownShortcut } from "./markdownShortcuts";
import {
  colorPopover,
  colorSwatch,
  editor,
  fontSizeOption,
  fontSizePopover,
  gridPicker,
  gridPickerCell,
  gridPickerLabel,
  gridPickerRows,
  imagePopover,
  imagePopoverDivider,
  imageResizeHandle,
  imageResizeOverlay,
  imageUrlForm,
  linkForm,
  linkInput,
  root,
  slashMenu,
  slashMenuEmpty,
  slashMenuItem,
  tableCellHandle,
  toolbar,
  toolbarButton
} from "./RichTextEditor.css";
import { sanitizeHtml } from "./sanitize";
import { SLASH_COMMANDS } from "./slashCommands";
import type { SlashCommandItem } from "./slashCommands";
import {
  deleteColumn,
  deleteRow,
  deleteTable,
  findEnclosingCell,
  findEnclosingTable,
  generateTableHtml,
  insertColumn,
  insertRow
} from "./tableCommands";
import { DEFAULT_TOOLBAR } from "./types";
import type { RichTextEditorProps, ToolbarCommand } from "./types";

const MAX_GRID_ROWS = 6;
const MAX_GRID_COLS = 8;

function isEffectivelyEmpty(editorEl: HTMLElement): boolean {
  // A contentEditable can be left with a stray <br> or empty <p></p> even
  // when nothing is visually there — checking innerHTML === "" alone misses
  // that. Text content alone doesn't capture a table/image-only document
  // though (both are visually non-empty with no text), so those count too.
  // Structural block tags (h1/h2/ul/ol/blockquote/pre) count the same way —
  // a markdown shortcut or the toolbar can produce an empty <h1></h1> the
  // instant a block converts, before the user has typed a single character
  // into it; treating that as "effectively empty" would wipe the very
  // structure the user just created out from under them.
  const hasText = (editorEl.textContent?.trim() ?? "") !== "";
  const hasStructure = editorEl.querySelector("table, img, h1, h2, ul, ol, blockquote, pre") !== null;
  return !hasText && !hasStructure;
}

const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "BLOCKQUOTE", "LI", "PRE"]);

function findEnclosingBlock(node: Node | null): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (current.nodeType === 1 && BLOCK_TAGS.has((current as Element).tagName)) {
      return current as HTMLElement;
    }
    current = current.parentNode;
  }
  return null;
}

interface LinkFormProps {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

function LinkForm({ onSubmit, onCancel }: LinkFormProps): ReactElement {
  const [url, setUrl] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    if (trimmed) onSubmit(trimmed);
    else onCancel();
  }

  return (
    <form className={linkForm} onSubmit={handleSubmit}>
      <Input
        className={linkInput}
        type="url"
        placeholder="https://example.com"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        aria-label="Link URL"
        autoFocus
      />
      <Button type="submit" variant="secondary">
        Insert
      </Button>
    </form>
  );
}

interface GridPickerProps {
  onPick: (rows: number, cols: number) => void;
}

// Word/Google Docs-style hover grid: track the hovered cell's row/col and
// highlight everything up-and-to-the-left of it (the NxM table that
// selecting this cell would insert).
function GridPicker({ onPick }: GridPickerProps): ReactElement {
  const [hovered, setHovered] = useState<{ rows: number; cols: number }>({ rows: 1, cols: 1 });

  const cells = [];
  for (let r = 1; r <= MAX_GRID_ROWS; r++) {
    for (let c = 1; c <= MAX_GRID_COLS; c++) {
      const active = r <= hovered.rows && c <= hovered.cols;
      cells.push(
        <button
          key={`${r}-${c}`}
          type="button"
          className={gridPickerCell}
          data-active={active || undefined}
          aria-label={`Insert ${r} by ${c} table`}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => setHovered({ rows: r, cols: c })}
          onClick={() => onPick(r, c)}
        />
      );
    }
  }

  return (
    <div className={gridPicker}>
      <div className={gridPickerRows}>{cells}</div>
      <div className={gridPickerLabel}>
        {hovered.rows} × {hovered.cols}
      </div>
    </div>
  );
}

interface ImageUrlFormProps {
  onSubmit: (url: string) => void;
}

function ImageUrlForm({ onSubmit }: ImageUrlFormProps): ReactElement {
  const [url, setUrl] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = url.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <form className={imageUrlForm} onSubmit={handleSubmit}>
      <Input
        type="url"
        placeholder="https://example.com/image.png"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        aria-label="Image URL"
        autoFocus
      />
      <Button type="submit" variant="secondary">
        Insert
      </Button>
    </form>
  );
}

interface ImagePopoverContentProps {
  onInsertUrl: (url: string) => void;
  uploadFiles: UploadFile[];
  onFilesAdded: (files: File[]) => void;
  onRemoveUpload: (id: string) => void;
}

function ImagePopoverContent({
  onInsertUrl,
  uploadFiles,
  onFilesAdded,
  onRemoveUpload
}: ImagePopoverContentProps): ReactElement {
  return (
    <div className={imagePopover}>
      <ImageUrlForm onSubmit={onInsertUrl} />
      <div className={imagePopoverDivider} />
      <FileUpload files={uploadFiles} onFilesAdded={onFilesAdded} onRemove={onRemoveUpload} accept="image/*" />
    </div>
  );
}

interface ColorPopoverContentProps {
  onPick: (color: string) => void;
  label: string;
}

function ColorPopoverContent({ onPick, label }: ColorPopoverContentProps): ReactElement {
  return (
    <div className={colorPopover} role="group" aria-label={label}>
      {COLOR_SWATCHES.map((swatch) => (
        <button
          key={swatch.label}
          type="button"
          className={colorSwatch}
          style={{ background: swatch.value }}
          aria-label={swatch.label}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(swatch.value)}
        />
      ))}
    </div>
  );
}

interface FontSizePopoverContentProps {
  onPick: (tokenValue: string) => void;
}

function FontSizePopoverContent({ onPick }: FontSizePopoverContentProps): ReactElement {
  return (
    <div className={fontSizePopover} role="group" aria-label="Font size">
      {FONT_SIZE_OPTIONS.map((option) => (
        <button
          key={option.label}
          type="button"
          className={fontSizeOption}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(option.tokenValue)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SlashMenuProps {
  anchorRect: DOMRect;
  items: SlashCommandItem[];
  activeIndex: number | null;
  onHover: (index: number) => void;
  onSelect: (item: SlashCommandItem) => void;
}

// Anchored to the text cursor, not a real DOM trigger element — Popover.tsx's
// API only accepts a real ReactElement child as its reference, which doesn't
// exist here (the "trigger" is a caret position inside contentEditable), so
// this builds its own floating-ui setup instead, using a virtual element
// (an object satisfying getBoundingClientRect()) as the reference rather
// than reusing Popover.
function SlashMenu({ anchorRect, items, activeIndex, onHover, onSelect }: SlashMenuProps): ReactElement {
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
      <div ref={refs.setFloating} style={floatingStyles} className={slashMenu} role="listbox" aria-label="Insert block">
        {items.length === 0 ? (
          <div className={slashMenuEmpty}>No matching commands</div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              role="option"
              aria-selected={index === activeIndex}
              data-active={index === activeIndex || undefined}
              className={slashMenuItem}
              onMouseEnter={() => onHover(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(item);
              }}
            >
              {item.label}
            </div>
          ))
        )}
      </div>
    </FloatingPortal>
  );
}

export function RichTextEditor({
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  toolbar: toolbarCommands = DEFAULT_TOOLBAR,
  onImageUpload,
  className,
  style,
  ...rest
}: RichTextEditorProps): ReactElement {
  const ariaLabel = rest["aria-label"] ?? "Rich text editor";
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef<string | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const initializedRef = useRef(false);
  const [activeFormats, setActiveFormats] = useState<Partial<Record<ToolbarCommand, boolean>>>({});
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [imageUploadFiles, setImageUploadFiles] = useState<UploadFile[]>([]);
  const [textColorPopoverOpen, setTextColorPopoverOpen] = useState(false);
  const [highlightPopoverOpen, setHighlightPopoverOpen] = useState(false);
  const [fontSizePopoverOpen, setFontSizePopoverOpen] = useState(false);

  const [activeCell, setActiveCell] = useState<HTMLTableCellElement | null>(null);
  const [cellHandlePos, setCellHandlePos] = useState<{ top: number; left: number } | null>(null);

  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageRect, setImageRect] = useState<{ top: number; left: number; width: number; height: number } | null>(
    null
  );

  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashAnchorRect, setSlashAnchorRect] = useState<DOMRect | null>(null);
  const slashRangeRef = useRef<Range | null>(null);
  const {
    filteredItems: slashFilteredCommands,
    activeIndex: slashActiveIndex,
    setActiveIndex: setSlashActiveIndex,
    moveActiveIndex: moveSlashActiveIndex
  } = useFilterableList(SLASH_COMMANDS, slashQuery);

  // Uncontrolled: seed the editor once from defaultValue. Controlled sync
  // (below) handles the value-prop case.
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
  }, [value]);

  function updateActiveFormats() {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    const states: Partial<Record<ToolbarCommand, boolean>> = {};
    for (const [command, queryName] of Object.entries(STATE_COMMAND)) {
      try {
        states[command as ToolbarCommand] = document.queryCommandState(queryName);
      } catch {
        states[command as ToolbarCommand] = false;
      }
    }
    let blockTag = "";
    try {
      blockTag = String(document.queryCommandValue("formatBlock")).toUpperCase();
    } catch {
      blockTag = "";
    }
    states.heading1 = blockTag === "H1";
    states.heading2 = blockTag === "H2";
    states.blockquote = blockTag === "BLOCKQUOTE";
    setActiveFormats(states);
  }

  useEffect(() => {
    function handleSelectionChange() {
      const editorEl = editorRef.current;
      if (!editorEl) return;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      if (!editorEl.contains(selection.anchorNode)) {
        setActiveCell(null);
        setCellHandlePos(null);
        return;
      }
      updateActiveFormats();

      const cell = findEnclosingCell(selection.anchorNode);
      setActiveCell(cell);
      if (cell) {
        const rect = cell.getBoundingClientRect();
        setCellHandlePos({ top: rect.top - 9, left: rect.right - 9 });
      } else {
        setCellHandlePos(null);
      }
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // Track the selected image's on-screen rect so the resize overlay stays
  // aligned as the page scrolls/resizes.
  useEffect(() => {
    if (!selectedImage) {
      setImageRect(null);
      return;
    }
    function updateRect() {
      if (!selectedImage) return;
      const r = selectedImage.getBoundingClientRect();
      setImageRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [selectedImage]);

  function emitChange() {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    if (isEffectivelyEmpty(editorEl)) editorEl.innerHTML = "";
    const sanitized = sanitizeHtml(editorEl.innerHTML);
    lastEmittedRef.current = sanitized;
    onChange?.(sanitized);
    updateActiveFormats();
  }

  function closeSlashMenu() {
    setSlashMenuOpen(false);
    setSlashQuery("");
    setSlashAnchorRect(null);
    setSlashActiveIndex(null);
    slashRangeRef.current = null;
  }

  // Converts `block` to a new element with tag `tag`, keeping its children
  // (empty at this call site, since the trigger text was already deleted,
  // but written generically). Direct DOM replacement rather than
  // execCommand('formatBlock', ...): found by manual browser testing that
  // formatBlock is unreliable on a block that's *brand new and empty* right
  // when the markdown trigger fires (its target selection, positioned
  // inside a block containing only a <br> filler, silently landed on the
  // *previous* block instead — verified this happen twice, not a one-off).
  // Same reasoning tableCommands.ts already applies to table structure
  // edits, extended here to the one other place execCommand proved
  // unreliable for this component's needs.
  function replaceBlockTag(block: HTMLElement, tag: string): HTMLElement {
    const replacement = document.createElement(tag);
    while (block.firstChild) replacement.appendChild(block.firstChild);
    if (replacement.childNodes.length === 0) replacement.appendChild(document.createElement("br"));
    block.replaceWith(replacement);
    return replacement;
  }

  function wrapBlockInList(block: HTMLElement, listTag: "ul" | "ol"): HTMLElement {
    const list = document.createElement(listTag);
    const li = document.createElement("li");
    while (block.firstChild) li.appendChild(block.firstChild);
    if (li.childNodes.length === 0) li.appendChild(document.createElement("br"));
    list.appendChild(li);
    block.replaceWith(list);
    return li;
  }

  function collapseSelectionInto(el: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  // Notion-style: "# " (etc.) typed at the very start of an otherwise-empty
  // block converts that block and removes the typed trigger characters,
  // rather than leaving "# " as literal text. Only recognized when the
  // block's entire content equals the text up to the cursor — i.e. nothing
  // before the trigger and nothing after the cursor — so it never fires
  // mid-sentence.
  function applyMarkdownShortcut(): boolean {
    const editorEl = editorRef.current;
    if (!editorEl) return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return false;
    const block = findEnclosingBlock(anchorNode);
    if (!block || !editorEl.contains(block)) return false;

    const preRange = document.createRange();
    preRange.selectNodeContents(block);
    preRange.setEnd(anchorNode, selection.anchorOffset);
    const textBeforeCursor = preRange.toString();
    if (textBeforeCursor !== block.textContent) return false;

    const action = matchMarkdownShortcut(textBeforeCursor);
    if (!action) return false;

    preRange.deleteContents();

    switch (action) {
      case "heading1":
        collapseSelectionInto(replaceBlockTag(block, "h1"));
        break;
      case "heading2":
        collapseSelectionInto(replaceBlockTag(block, "h2"));
        break;
      case "bulletList":
        collapseSelectionInto(wrapBlockInList(block, "ul"));
        break;
      case "orderedList":
        collapseSelectionInto(wrapBlockInList(block, "ol"));
        break;
      case "blockquote":
        collapseSelectionInto(replaceBlockTag(block, "blockquote"));
        break;
      case "codeBlock":
        collapseSelectionInto(replaceBlockTag(block, "pre"));
        break;
    }
    return true;
  }

  // Typing "/" at the start of an empty block opens the inline menu,
  // anchored at the cursor's real screen position via a Range rect (there's
  // no DOM element to anchor to — the caret isn't one). This assumes the
  // "/query" text lives in a single text node, true for the common case of
  // typing it directly into a fresh empty block; a block whose content got
  // there through other means (e.g. a slash typed adjacent to existing
  // inline markup split across multiple text nodes) isn't handled.
  function checkSlashTrigger() {
    const editorEl = editorRef.current;
    if (!editorEl) {
      closeSlashMenu();
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
      closeSlashMenu();
      return;
    }
    const anchorNode = selection.anchorNode;
    if (!anchorNode || !editorEl.contains(anchorNode) || anchorNode.nodeType !== Node.TEXT_NODE) {
      closeSlashMenu();
      return;
    }
    const block = findEnclosingBlock(anchorNode);
    if (!block) {
      closeSlashMenu();
      return;
    }

    const preRange = document.createRange();
    preRange.selectNodeContents(block);
    preRange.setEnd(anchorNode, selection.anchorOffset);
    const textBeforeCursor = preRange.toString();
    if (textBeforeCursor !== block.textContent) {
      closeSlashMenu();
      return;
    }

    const match = textBeforeCursor.match(/^\/(\S*)$/);
    if (!match) {
      closeSlashMenu();
      return;
    }

    const query = match[1] ?? "";
    const slashRange = document.createRange();
    slashRange.setStart(anchorNode, selection.anchorOffset - (query.length + 1));
    slashRange.setEnd(anchorNode, selection.anchorOffset);
    slashRangeRef.current = slashRange;

    const cursorRange = document.createRange();
    cursorRange.setStart(anchorNode, selection.anchorOffset);
    cursorRange.collapse(true);

    setSlashQuery(query);
    setSlashAnchorRect(cursorRange.getBoundingClientRect());
    setSlashMenuOpen(true);
  }

  function selectSlashCommand(item: SlashCommandItem) {
    const range = slashRangeRef.current;
    if (range) {
      range.deleteContents();
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    closeSlashMenu();
    runCommand(item.id);
  }

  function handleEditorInput() {
    const shortcutApplied = applyMarkdownShortcut();
    if (shortcutApplied) {
      closeSlashMenu();
    } else {
      checkSlashTrigger();
    }
    emitChange();
  }

  // execCommand is deprecated but remains functionally supported across all
  // major browsers, and is the practical choice here: reimplementing
  // Selection/Range-based formatting (bold/italic/lists/block formatting)
  // from scratch is a multi-week undertaking on its own, disproportionate to
  // a phase-1 editor. Chosen deliberately, not from unawareness it's
  // deprecated. Tables/images below deliberately do NOT go through
  // execCommand for structural edits — it has no table-editing commands at
  // all, so those are direct DOM manipulation (tableCommands.ts) instead.
  function runCommand(command: ToolbarCommand) {
    if (disabled) return;
    const editorEl = editorRef.current;
    if (!editorEl) return;
    editorEl.focus();

    if (command === "link" || command === "image") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        savedRangeRef.current = selection.getRangeAt(0).cloneRange();
      }
      if (command === "link") setLinkPopoverOpen(true);
      else setImagePopoverOpen(true);
      return;
    }

    if (command === "table") {
      setTablePickerOpen(true);
      return;
    }

    if (command === "textColor" || command === "highlightColor" || command === "fontSize") {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        savedRangeRef.current = selection.getRangeAt(0).cloneRange();
      }
      if (command === "textColor") setTextColorPopoverOpen(true);
      else if (command === "highlightColor") setHighlightPopoverOpen(true);
      else setFontSizePopoverOpen(true);
      return;
    }

    const formatBlockTag = FORMAT_BLOCK_TAG[command];
    if (formatBlockTag) {
      const isActive = Boolean(activeFormats[command]);
      document.execCommand("formatBlock", false, isActive ? "<p>" : `<${formatBlockTag}>`);
      emitChange();
      return;
    }

    const execName = EXEC_COMMAND[command];
    if (execName) {
      document.execCommand(execName);
      emitChange();
    }
  }

  function handleToolbarMouseDown(event: ReactMouseEvent) {
    // Prevent the toolbar button from stealing focus away from the editor —
    // that would collapse the current selection before the click handler's
    // execCommand runs (the same "preventDefault suppresses default focus
    // behavior" family of gotcha as Slider's drag handler; here we want to
    // suppress it, since the editor must stay focused).
    event.preventDefault();
  }

  // Pasted content lands directly in the live contentEditable DOM — inline
  // event handlers (onerror, onclick) in pasted HTML execute immediately in
  // the browser the moment it's inserted, *before* our onInput/emitChange
  // sanitization pass ever runs on the resulting output. Sanitizing only the
  // emitted onChange value is not enough on its own: verified by actually
  // pasting a payload with an onerror-bearing <img> during manual testing
  // and watching it fire. Intercepting paste and inserting only pre-sanitized
  // HTML closes that gap — the DOM itself never receives the raw payload.
  //
  // Raw clipboard HTML from Word/Google Docs/websites carries enormous
  // inline-style/class cruft; rather than let the browser insert that
  // directly, the clipboard's HTML is extracted, run through the exact same
  // sanitizeHtml() used for onChange (never a second, looser path an
  // attacker could target), and the *cleaned* result is what actually gets
  // inserted.
  function handlePaste(event: ReactClipboardEvent<HTMLDivElement>) {
    if (disabled) return;
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    const html = event.clipboardData.getData("text/html");
    const sanitized = html ? sanitizeHtml(html) : sanitizeHtml(text.replace(/&/g, "&amp;").replace(/</g, "&lt;"));
    document.execCommand("insertHTML", false, sanitized);
    emitChange();
  }

  // Ctrl/Cmd+Shift+V is an app-level convention (Google Docs, Slack, etc.),
  // not something the browser recognizes as a paste trigger on its own —
  // verified manually that Chrome does NOT dispatch a 'paste' DOM event for
  // it (unlike plain Ctrl+V), so intercepting the subsequent paste event
  // doesn't work here. This has to read the clipboard directly via the async
  // Clipboard API instead.
  function handleEditorKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    if (slashMenuOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSlashActiveIndex(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSlashActiveIndex(-1);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const active = slashActiveIndex !== null ? slashFilteredCommands[slashActiveIndex] : undefined;
        if (active) selectSlashCommand(active);
        else closeSlashMenu();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeSlashMenu();
        return;
      }
    }

    const isPasteShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "v";
    if (!isPasteShortcut) return;
    event.preventDefault();
    const editorEl = editorRef.current;
    if (!editorEl) return;
    navigator.clipboard
      .readText()
      .then((text) => {
        editorEl.focus();
        document.execCommand("insertText", false, text);
        emitChange();
      })
      .catch(() => {
        // Clipboard read can be denied/unsupported (permissions, insecure
        // context) — silently no-op rather than leaving the editor in a
        // broken state; the user can still fall back to plain Ctrl+V.
      });
  }

  function handleLinkSubmit(url: string) {
    const editorEl = editorRef.current;
    if (editorEl) {
      editorEl.focus();
      const selection = window.getSelection();
      if (selection && savedRangeRef.current) {
        selection.removeAllRanges();
        selection.addRange(savedRangeRef.current);
      }
      document.execCommand("createLink", false, url);
    }
    setLinkPopoverOpen(false);
    emitChange();
  }

  function restoreSavedRange(editorEl: HTMLElement) {
    editorEl.focus();
    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
  }

  // styleWithCSS makes foreColor/hiliteColor emit <span style="color:..."> —
  // without it, browsers fall back to legacy <font color="..."> tags, which
  // aren't in sanitizeHtml's allowlist at all and would just get stripped,
  // silently discarding the color. Enabled once on mount rather than before
  // every color command; execCommand's own state, not per-call config.
  useEffect(() => {
    // The DOM lib's execCommand types require a string value, but
    // styleWithCSS's documented/expected argument is a real boolean.
    document.execCommand("styleWithCSS", false, true as unknown as string);
  }, []);

  function applyTextColor(color: string) {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    restoreSavedRange(editorEl);
    document.execCommand("foreColor", false, color);
    setTextColorPopoverOpen(false);
    emitChange();
  }

  function applyHighlightColor(color: string) {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    restoreSavedRange(editorEl);
    document.execCommand("hiliteColor", false, color);
    setHighlightPopoverOpen(false);
    emitChange();
  }

  function applyFontSize(tokenValue: string) {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    restoreSavedRange(editorEl);

    // Found by manual testing, not assumption: with styleWithCSS on (needed
    // for foreColor/hiliteColor to emit <span style="color:..."> instead of
    // <font color>), Chrome's fontSize command ALSO switches to emitting CSS
    // directly — a <span style="font-size: xxx-large"> — rather than the
    // addressable <font size="7"> this whole workaround depends on being
    // able to find and replace. Toggling styleWithCSS off just for this one
    // command restores the legacy <font> tag, which is then found and
    // swapped for a token-based <span> below; styleWithCSS is switched back
    // on immediately after so color commands keep working correctly.
    document.execCommand("styleWithCSS", false, false as unknown as string);
    document.execCommand("fontSize", false, FONT_SIZE_MARKER);
    document.execCommand("styleWithCSS", false, true as unknown as string);

    const pxValue = resolveFontSizePx(tokenValue, editorEl);
    const markers = editorEl.querySelectorAll(`font[size="${FONT_SIZE_MARKER}"]`);
    markers.forEach((markerEl) => {
      const span = document.createElement("span");
      span.style.fontSize = pxValue;
      while (markerEl.firstChild) span.appendChild(markerEl.firstChild);
      markerEl.replaceWith(span);
    });

    setFontSizePopoverOpen(false);
    emitChange();
  }

  function insertTable(rows: number, cols: number) {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    editorEl.focus();
    document.execCommand("insertHTML", false, generateTableHtml(rows, cols));
    setTablePickerOpen(false);
    emitChange();
  }

  function handleTableCommand(
    action: "insertRowAbove" | "insertRowBelow" | "insertColLeft" | "insertColRight" | "deleteRow" | "deleteCol" | "deleteTable"
  ) {
    if (!activeCell) return;
    const table = findEnclosingTable(activeCell);
    if (!table) return;
    switch (action) {
      case "insertRowAbove":
        insertRow(table, activeCell, "above");
        break;
      case "insertRowBelow":
        insertRow(table, activeCell, "below");
        break;
      case "insertColLeft":
        insertColumn(table, activeCell, "left");
        break;
      case "insertColRight":
        insertColumn(table, activeCell, "right");
        break;
      case "deleteRow":
        if (deleteRow(table, activeCell)) setActiveCell(null);
        break;
      case "deleteCol":
        if (deleteColumn(table, activeCell)) setActiveCell(null);
        break;
      case "deleteTable":
        deleteTable(table);
        setActiveCell(null);
        break;
    }
    emitChange();
  }

  // Images are inserted via direct DOM node construction (createElement +
  // setAttribute), never by string-interpolating the URL into an HTML
  // string passed to insertHTML — the latter would reopen the exact same
  // "raw HTML lands in the live DOM before sanitization" gap paste closed in
  // phase 1, this time via a URL crafted to break out of the src="..."
  // attribute. setAttribute never re-parses its value as markup, so there's
  // nothing to break out of. A javascript: scheme in img.src also isn't
  // executable by browsers for <img> specifically (that's only a risk for
  // navigation contexts like <a href>) — sanitizeHtml's URI-safety check on
  // the next emitChange strips it regardless, as defense in depth.
  function insertImageAtUrl(url: string) {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    editorEl.focus();
    const selection = window.getSelection();
    if (selection && savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorEl.appendChild(img);
    }

    setImagePopoverOpen(false);
    emitChange();
  }

  async function handleImageFilesAdded(files: File[]) {
    const entries: UploadFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "uploading",
      progress: 0
    }));
    setImageUploadFiles((prev) => [...prev, ...entries]);

    for (const entry of entries) {
      try {
        const url = onImageUpload ? await onImageUpload(entry.file) : await readFileAsDataUrl(entry.file);
        insertImageAtUrl(url);
        setImageUploadFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, status: "success", progress: 100 } : f))
        );
      } catch {
        setImageUploadFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, status: "error", progress: 0, error: "Upload failed" } : f))
        );
      }
    }
  }

  function handleEditorClick(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    setSelectedImage(target.tagName === "IMG" ? (target as HTMLImageElement) : null);
  }

  function handleResizePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!selectedImage) return;
    event.preventDefault();
    const image = selectedImage;
    const startRect = image.getBoundingClientRect();
    const startWidth = startRect.width;
    const startHeight = startRect.height;
    const aspectRatio = startWidth / startHeight || 1;
    const startX = event.clientX;
    const startY = event.clientY;

    function handleMove(moveEvent: PointerEvent) {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(20, startWidth + deltaX);
      let newHeight: number;
      if (moveEvent.shiftKey) {
        const deltaY = moveEvent.clientY - startY;
        newHeight = Math.max(20, startHeight + deltaY);
      } else {
        newHeight = newWidth / aspectRatio;
      }
      image.setAttribute("width", String(Math.round(newWidth)));
      image.setAttribute("height", String(Math.round(newHeight)));
      const r = image.getBoundingClientRect();
      setImageRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      emitChange();
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  return (
    <div
      className={[root, className].filter(Boolean).join(" ")}
      style={style}
      data-disabled={disabled || undefined}
    >
      <div className={toolbar} role="toolbar" aria-label="Formatting">
        {toolbarCommands.map((command) => {
          const config = TOOLBAR_BUTTONS[command];
          const isPressed = activeFormats[command];
          const button = (
            <button
              key={command}
              type="button"
              className={toolbarButton}
              aria-label={config.label}
              aria-pressed={TOGGLE_COMMANDS.has(command) ? Boolean(isPressed) : undefined}
              disabled={disabled}
              onMouseDown={handleToolbarMouseDown}
              onClick={() => runCommand(command)}
            >
              {config.icon}
            </button>
          );

          if (command === "link") {
            return (
              <Popover
                key="link"
                open={linkPopoverOpen}
                onOpenChange={setLinkPopoverOpen}
                content={<LinkForm onSubmit={handleLinkSubmit} onCancel={() => setLinkPopoverOpen(false)} />}
              >
                {button}
              </Popover>
            );
          }

          if (command === "table") {
            return (
              <Popover
                key="table"
                open={tablePickerOpen}
                onOpenChange={setTablePickerOpen}
                content={<GridPicker onPick={insertTable} />}
              >
                {button}
              </Popover>
            );
          }

          if (command === "image") {
            return (
              <Popover
                key="image"
                open={imagePopoverOpen}
                onOpenChange={setImagePopoverOpen}
                content={
                  <ImagePopoverContent
                    onInsertUrl={insertImageAtUrl}
                    uploadFiles={imageUploadFiles}
                    onFilesAdded={handleImageFilesAdded}
                    onRemoveUpload={(id) => setImageUploadFiles((prev) => prev.filter((f) => f.id !== id))}
                  />
                }
              >
                {button}
              </Popover>
            );
          }

          if (command === "textColor") {
            return (
              <Popover
                key="textColor"
                open={textColorPopoverOpen}
                onOpenChange={setTextColorPopoverOpen}
                content={<ColorPopoverContent label="Text color" onPick={applyTextColor} />}
              >
                {button}
              </Popover>
            );
          }

          if (command === "highlightColor") {
            return (
              <Popover
                key="highlightColor"
                open={highlightPopoverOpen}
                onOpenChange={setHighlightPopoverOpen}
                content={<ColorPopoverContent label="Highlight color" onPick={applyHighlightColor} />}
              >
                {button}
              </Popover>
            );
          }

          if (command === "fontSize") {
            return (
              <Popover
                key="fontSize"
                open={fontSizePopoverOpen}
                onOpenChange={setFontSizePopoverOpen}
                content={<FontSizePopoverContent onPick={applyFontSize} />}
              >
                {button}
              </Popover>
            );
          }

          return button;
        })}
      </div>
      <div
        ref={editorRef}
        className={editor}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        data-placeholder={placeholder}
        onInput={handleEditorInput}
        onPaste={handlePaste}
        onKeyDown={handleEditorKeyDown}
        onClick={handleEditorClick}
      />

      {slashMenuOpen && slashAnchorRect ? (
        <SlashMenu
          anchorRect={slashAnchorRect}
          items={slashFilteredCommands}
          activeIndex={slashActiveIndex}
          onHover={setSlashActiveIndex}
          onSelect={selectSlashCommand}
        />
      ) : null}

      {activeCell && cellHandlePos && !disabled ? (
        <DropdownMenu
          placement="bottom-end"
          trigger={
            <button
              type="button"
              className={tableCellHandle}
              style={{ top: cellHandlePos.top, left: cellHandlePos.left }}
              aria-label="Table cell options"
              onMouseDown={(event) => event.preventDefault()}
            >
              ⋮
            </button>
          }
        >
          <DropdownMenu.Item onSelect={() => handleTableCommand("insertRowAbove")}>Insert row above</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => handleTableCommand("insertRowBelow")}>Insert row below</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => handleTableCommand("insertColLeft")}>Insert column left</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => handleTableCommand("insertColRight")}>
            Insert column right
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => handleTableCommand("deleteRow")}>Delete row</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => handleTableCommand("deleteCol")}>Delete column</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => handleTableCommand("deleteTable")}>Delete table</DropdownMenu.Item>
        </DropdownMenu>
      ) : null}

      {selectedImage && imageRect ? (
        <>
          <div
            className={imageResizeOverlay}
            style={{ top: imageRect.top, left: imageRect.left, width: imageRect.width, height: imageRect.height }}
          />
          <div
            className={imageResizeHandle}
            style={{ top: imageRect.top + imageRect.height, left: imageRect.left + imageRect.width }}
            onPointerDown={handleResizePointerDown}
          />
        </>
      ) : null}
    </div>
  );
}
