import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MentionsInput } from "./MentionsInput";
import type { MentionOption } from "./types";

// jsdom has no layout engine, so Range.getBoundingClientRect() doesn't exist
// at all (real browsers implement it fully — this is what the mention
// dropdown uses to anchor itself at the text cursor, mirroring
// RichTextEditor's SlashMenu). Stubbed with a fixed rect so the wiring (does
// the dropdown open, does it show the right options) is testable here; real
// on-screen positioning was verified against RichTextEditor's identical
// technique, not re-verified manually in a browser for this component.
if (!Range.prototype.getBoundingClientRect || typeof Range.prototype.getBoundingClientRect !== "function") {
  Range.prototype.getBoundingClientRect = function (this: Range) {
    return {
      top: 100,
      left: 100,
      right: 100,
      bottom: 100,
      width: 0,
      height: 16,
      x: 100,
      y: 100,
      toJSON: () => ({})
    } as DOMRect;
  };
}

const TEAM: MentionOption[] = [
  { id: "u1", label: "Ada Lovelace" },
  { id: "u2", label: "Alan Turing" },
  { id: "u3", label: "Grace Hopper" }
];

// Directly manipulates the contentEditable's text content and places the
// caret at the end of it, then the caller fires a synthetic `input` event —
// jsdom doesn't implement real contentEditable typing, so this is the same
// technique RichTextEditor's own tests use (see its
// setBlockTextWithCursorAtEnd) to get a real Selection/Range in place before
// the component's input handler reads window.getSelection().
function setTextWithCursorAtEnd(editorEl: HTMLElement, text: string) {
  editorEl.focus();
  editorEl.textContent = text;
  const textNode = editorEl.firstChild!;
  const range = document.createRange();
  range.setStart(textNode, text.length);
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

// Inserts `text` at the current caret position without touching any other
// DOM node — used after a mention chip has already been inserted, where
// `setTextWithCursorAtEnd` (which replaces the whole editor's textContent)
// would destroy the chip element instead of typing alongside it.
function typeAtCursor(text: string) {
  const selection = window.getSelection()!;
  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) return;
  const offset = range.startOffset;
  const original = node.textContent ?? "";
  node.textContent = original.slice(0, offset) + text + original.slice(offset);
  const newRange = document.createRange();
  newRange.setStart(node, offset + text.length);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);
}

describe("MentionsInput", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('typing the trigger character opens the dropdown with all options', async () => {
    render(<MentionsInput aria-label="Comment" options={TEAM} />);
    const editorEl = screen.getByRole("textbox");

    setTextWithCursorAtEnd(editorEl, "@");
    fireEvent.input(editorEl);

    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("filtering narrows options as you type after the trigger", async () => {
    render(<MentionsInput aria-label="Comment" options={TEAM} />);
    const editorEl = screen.getByRole("textbox");

    setTextWithCursorAtEnd(editorEl, "@ada");
    fireEvent.input(editorEl);

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(1);
    });
    expect(screen.getByRole("option", { name: /Ada Lovelace/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Alan Turing/ })).not.toBeInTheDocument();
  });

  it("selecting an option inserts a mention chip and closes the dropdown", async () => {
    render(<MentionsInput aria-label="Comment" options={TEAM} />);
    const editorEl = screen.getByRole("textbox");

    setTextWithCursorAtEnd(editorEl, "@ada");
    fireEvent.input(editorEl);
    await waitFor(() => expect(screen.getByRole("option", { name: /Ada Lovelace/ })).toBeInTheDocument());

    fireEvent.mouseDown(screen.getByRole("option", { name: /Ada Lovelace/ }));

    const chip = editorEl.querySelector('span[data-mention-id="u1"]');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute("contenteditable", "false");
    expect(chip).toHaveTextContent("@Ada Lovelace");
    expect(editorEl.textContent).not.toContain("@ada");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports keyboard selection (arrow down + enter)", async () => {
    render(<MentionsInput aria-label="Comment" options={TEAM} />);
    const editorEl = screen.getByRole("textbox");

    setTextWithCursorAtEnd(editorEl, "@");
    fireEvent.input(editorEl);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());

    fireEvent.keyDown(editorEl, { key: "ArrowDown" });
    fireEvent.keyDown(editorEl, { key: "Enter" });

    expect(editorEl.querySelector('span[data-mention-id="u1"]')).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Escape closes the dropdown without inserting a chip", async () => {
    render(<MentionsInput aria-label="Comment" options={TEAM} />);
    const editorEl = screen.getByRole("textbox");

    setTextWithCursorAtEnd(editorEl, "@ada");
    fireEvent.input(editorEl);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());

    fireEvent.keyDown(editorEl, { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(editorEl.querySelector("span[data-mention-id]")).not.toBeInTheDocument();
  });

  it("onMentionsChange reflects mentions currently present in the text, and updates when a chip is deleted", async () => {
    const onMentionsChange = vi.fn();
    render(<MentionsInput aria-label="Comment" options={TEAM} onMentionsChange={onMentionsChange} />);
    const editorEl = screen.getByRole("textbox");

    setTextWithCursorAtEnd(editorEl, "@ada");
    fireEvent.input(editorEl);
    await waitFor(() => expect(screen.getByRole("option", { name: /Ada Lovelace/ })).toBeInTheDocument());
    fireEvent.mouseDown(screen.getByRole("option", { name: /Ada Lovelace/ }));

    expect(onMentionsChange).toHaveBeenLastCalledWith([{ id: "u1", label: "Ada Lovelace", avatarUrl: undefined }]);

    // Add a second mention, typing at the cursor left just after the first
    // chip's trailing space rather than replacing the editor's content.
    typeAtCursor("@alan");
    fireEvent.input(editorEl);
    await waitFor(() => expect(screen.getByRole("option", { name: /Alan Turing/ })).toBeInTheDocument());
    fireEvent.mouseDown(screen.getByRole("option", { name: /Alan Turing/ }));

    expect(onMentionsChange).toHaveBeenLastCalledWith([
      { id: "u1", label: "Ada Lovelace", avatarUrl: undefined },
      { id: "u2", label: "Alan Turing", avatarUrl: undefined }
    ]);

    // Delete the first chip directly out of the text (simulating a user
    // selecting and deleting it) — the reported mention set must drop it.
    editorEl.querySelector('span[data-mention-id="u1"]')!.remove();
    fireEvent.input(editorEl);

    expect(onMentionsChange).toHaveBeenLastCalledWith([{ id: "u2", label: "Alan Turing", avatarUrl: undefined }]);
  });

  it("supports a custom trigger character", async () => {
    const topics: MentionOption[] = [{ id: "t1", label: "engineering" }];
    render(<MentionsInput aria-label="Note" options={topics} trigger="#" />);
    const editorEl = screen.getByRole("textbox");

    setTextWithCursorAtEnd(editorEl, "#eng");
    fireEvent.input(editorEl);

    await waitFor(() => expect(screen.getByRole("option", { name: /engineering/ })).toBeInTheDocument());
  });

  it("supports async options as a search function", async () => {
    const search = vi.fn(
      (query: string): Promise<MentionOption[]> =>
        Promise.resolve(TEAM.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase())))
    );
    render(<MentionsInput aria-label="Comment" options={search} />);
    const editorEl = screen.getByRole("textbox");

    setTextWithCursorAtEnd(editorEl, "@grace");
    fireEvent.input(editorEl);

    await waitFor(() => expect(screen.getByRole("option", { name: /Grace Hopper/ })).toBeInTheDocument());
    expect(search).toHaveBeenCalledWith("grace");
  });

  it("respects the disabled prop", () => {
    render(<MentionsInput aria-label="Comment" options={TEAM} disabled />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-disabled", "true");
  });
});
