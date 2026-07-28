import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RichTextEditor } from "./RichTextEditor";
import { sanitizeHtml } from "./sanitize";

// jsdom has no layout engine, so Range.getBoundingClientRect() doesn't exist
// at all (real browsers implement it fully — this is what the slash menu
// uses to anchor itself at the text cursor). Stubbed with a fixed rect so
// the wiring (does the menu open, does it show the right items) is testable
// here; real on-screen positioning was verified manually in a browser.
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

// jsdom doesn't implement document.execCommand / queryCommandState /
// queryCommandValue at all — real browsers do (that's the whole reason the
// component uses them), but calling them here throws "not a function". We
// install real, DOM-mutating stand-ins (not just spies) so the tests
// genuinely exercise the wiring — Range-based wrap/insert, and a
// queryCommandState that actually walks the DOM from the current selection
// — rather than only asserting "execCommand was called with X".
function installExecCommandShim() {
  const TAG_FOR_STATE_COMMAND: Record<string, string> = {
    bold: "B",
    italic: "I",
    underline: "U",
    strikeThrough: "S",
    insertUnorderedList: "UL",
    insertOrderedList: "OL"
  };

  function wrapSelectionWith(build: () => HTMLElement) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const contents = range.extractContents();
    const wrapper = build();
    wrapper.appendChild(contents);
    range.insertNode(wrapper);
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  function wrapSelection(tagName: string) {
    wrapSelectionWith(() => document.createElement(tagName));
  }

  function findEnclosingBlock(node: Node | null): HTMLElement | null {
    let current: Node | null = node;
    while (current && current.nodeType !== 1) current = current.parentNode;
    while (current) {
      const tag = (current as Element).tagName;
      if (["P", "DIV", "H1", "H2", "BLOCKQUOTE", "LI"].includes(tag)) return current as HTMLElement;
      current = current.parentNode;
    }
    return null;
  }

  const ALIGN_FOR_STATE: Record<string, string> = {
    justifyLeft: "left",
    justifyCenter: "center",
    justifyRight: "right",
    justifyFull: "justify"
  };

  (document as unknown as { execCommand: typeof document.execCommand }).execCommand = vi.fn(
    (command: string, _ui?: boolean, value?: string) => {
      switch (command) {
        case "bold":
          wrapSelection("b");
          return true;
        case "italic":
          wrapSelection("i");
          return true;
        case "createLink": {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0 || !value) return true;
          const range = selection.getRangeAt(0);
          if (range.collapsed) return true;
          const contents = range.extractContents();
          const a = document.createElement("a");
          a.setAttribute("href", value);
          a.appendChild(contents);
          range.insertNode(a);
          return true;
        }
        case "insertHTML": {
          const target = document.activeElement as HTMLElement | null;
          if (target && value !== undefined) target.innerHTML += value;
          return true;
        }
        case "formatBlock": {
          const target = document.activeElement as HTMLElement | null;
          if (target && value) {
            const tag = value.replace(/[<>]/g, "");
            const selection = window.getSelection();
            const block = findEnclosingBlock(selection?.anchorNode ?? null);
            if (block && target.contains(block)) {
              // Real formatBlock *replaces* the current block's tag,
              // preserving its children — not "wrap everything in the
              // editor," which the earlier version of this shim did.
              const replacement = document.createElement(tag);
              while (block.firstChild) replacement.appendChild(block.firstChild);
              block.replaceWith(replacement);
              const range = document.createRange();
              range.selectNodeContents(replacement);
              range.collapse(false);
              selection?.removeAllRanges();
              selection?.addRange(range);
            } else {
              target.innerHTML = `<${tag}>${target.innerHTML}</${tag}>`;
            }
          }
          return true;
        }
        case "insertUnorderedList":
        case "insertOrderedList": {
          const selection = window.getSelection();
          const block = findEnclosingBlock(selection?.anchorNode ?? null);
          if (block) {
            const listTag = command === "insertUnorderedList" ? "ul" : "ol";
            const listEl = document.createElement(listTag);
            const li = document.createElement("li");
            while (block.firstChild) li.appendChild(block.firstChild);
            listEl.appendChild(li);
            block.replaceWith(listEl);
            const range = document.createRange();
            range.selectNodeContents(li);
            range.collapse(false);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
          return true;
        }
        case "foreColor":
          wrapSelectionWith(() => {
            const el = document.createElement("span");
            el.style.color = value ?? "";
            return el;
          });
          return true;
        case "hiliteColor":
          wrapSelectionWith(() => {
            const el = document.createElement("span");
            el.style.backgroundColor = value ?? "";
            return el;
          });
          return true;
        case "fontSize":
          wrapSelectionWith(() => {
            const el = document.createElement("font");
            el.setAttribute("size", value ?? "7");
            return el;
          });
          return true;
        case "justifyLeft":
        case "justifyCenter":
        case "justifyRight":
        case "justifyFull": {
          const selection = window.getSelection();
          const block = findEnclosingBlock(selection?.anchorNode ?? null);
          if (block) block.style.textAlign = ALIGN_FOR_STATE[command]!;
          return true;
        }
        case "insertText": {
          const target = document.activeElement as HTMLElement | null;
          if (target && value !== undefined) {
            target.appendChild(document.createTextNode(value));
          }
          return true;
        }
        case "styleWithCSS":
          return true;
        default:
          return true;
      }
    }
  ) as typeof document.execCommand;

  (document as unknown as { queryCommandState: typeof document.queryCommandState }).queryCommandState =
    vi.fn((command: string) => {
      if (ALIGN_FOR_STATE[command]) {
        const selection = window.getSelection();
        const block = findEnclosingBlock(selection?.anchorNode ?? null);
        const align = block?.style.textAlign || "left";
        return align === ALIGN_FOR_STATE[command];
      }
      const tag = TAG_FOR_STATE_COMMAND[command];
      if (!tag) return false;
      const selection = window.getSelection();
      let node: Node | null = selection?.anchorNode ?? null;
      while (node) {
        if (node.nodeType === 1 && (node as Element).tagName === tag) return true;
        node = node.parentNode;
      }
      return false;
    }) as typeof document.queryCommandState;

  (document as unknown as { queryCommandValue: typeof document.queryCommandValue }).queryCommandValue = vi.fn(
    () => ""
  ) as typeof document.queryCommandValue;
}

// jsdom collapses any active Selection the moment an element receives focus
// for the *first* time, but not on a redundant refocus of an already-focused
// element — unlike real browsers, where focusing an element that already
// contains the selection never touches it. RichTextEditor's toolbar click
// handler calls editorEl.focus() defensively before running a command; to
// match realistic usage (user already clicked into the editor and selected
// text, *then* clicks a toolbar button) and avoid tripping this jsdom-only
// quirk, focus the editor before creating the selection, never after.
function selectAllTextIn(el: HTMLElement) {
  el.focus();
  // Select the *text*, not the wrapping block element — selecting
  // el's own contents when el's only child is a <p> selects the <p> node
  // itself, so a wrap ends up as <b><p>...</p></b> instead of the realistic
  // <p><b>...</b></p> a user selecting text (not the whole block) would get.
  const target = el.firstElementChild ?? el;
  const range = document.createRange();
  range.selectNodeContents(target);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

describe("RichTextEditor", () => {
  beforeEach(() => {
    installExecCommandShim();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applying bold via the toolbar to selected text produces correctly sanitized HTML in onChange", () => {
    const onChange = vi.fn();
    render(<RichTextEditor defaultValue="<p>hello</p>" onChange={onChange} />);
    const editorEl = screen.getByRole("textbox");

    selectAllTextIn(editorEl);
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));

    expect(onChange).toHaveBeenCalled();
    const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
    expect(lastHtml).toContain("<b>hello</b>");
  });

  it("reflects active formatting state at the current cursor position", () => {
    render(<RichTextEditor defaultValue="<p>hello</p>" />);
    const editorEl = screen.getByRole("textbox");
    const boldButton = screen.getByRole("button", { name: "Bold" });

    expect(boldButton).toHaveAttribute("aria-pressed", "false");

    selectAllTextIn(editorEl);
    fireEvent.click(boldButton);

    // The shim's wrapSelection re-selects the newly-created <b> contents
    // after inserting it, and runCommand's emitChange -> updateActiveFormats
    // reads queryCommandState immediately after — no selectionchange event
    // needed for this path specifically, since it's driven by the click.
    expect(boldButton).toHaveAttribute("aria-pressed", "true");
  });

  it("inserts a sanitized anchor tag via the link popover form", () => {
    const onChange = vi.fn();
    render(<RichTextEditor defaultValue="<p>click here</p>" onChange={onChange} />);
    const editorEl = screen.getByRole("textbox");

    selectAllTextIn(editorEl);
    fireEvent.click(screen.getByRole("button", { name: "Link" }));

    const urlInput = screen.getByLabelText("Link URL");
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));

    const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
    expect(lastHtml).toContain('<a href="https://example.com">click here</a>');
  });

  it("strips a script tag pasted into the editor from the sanitized onChange output", () => {
    const onChange = vi.fn();
    render(<RichTextEditor defaultValue="" onChange={onChange} />);
    const editorEl = screen.getByRole("textbox");
    editorEl.focus();

    fireEvent.paste(editorEl, {
      clipboardData: {
        getData: (type: string) =>
          type === "text/html" ? "<p>hi</p><script>window.__pwned = true;<\/script>" : "hi"
      }
    });

    const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
    expect(lastHtml).not.toContain("<script");
    expect(lastHtml).not.toContain("__pwned");
  });

  it("strips an onerror/onclick attribute pasted into the editor from the sanitized onChange output — the real XSS vector, not just formatting", () => {
    const onChange = vi.fn();
    render(<RichTextEditor defaultValue="" onChange={onChange} />);
    const editorEl = screen.getByRole("textbox");
    editorEl.focus();

    fireEvent.paste(editorEl, {
      clipboardData: {
        getData: (type: string) =>
          type === "text/html"
            ? '<img src=x onerror="window.__pwned = true"><a href="javascript:window.__pwned=true" onclick="window.__pwned=true">click</a>'
            : "click"
      }
    });

    const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
    expect(lastHtml).not.toContain("onerror");
    expect(lastHtml).not.toContain("onclick");
    expect(lastHtml).not.toContain("javascript:");
    // img itself is legitimate as of phase 2 (with src/alt only) — only the
    // event-handler attribute must be gone, not the tag.
    expect(lastHtml).toContain('<img src="x"');
  });

  it("disabled prevents editing", () => {
    render(<RichTextEditor defaultValue="<p>locked</p>" disabled />);
    const editorEl = screen.getByRole("textbox");
    expect(editorEl).toHaveAttribute("contenteditable", "false");
    expect(screen.getByRole("button", { name: "Bold" })).toBeDisabled();
  });

  it("renders only the toolbar commands passed via the toolbar prop", () => {
    render(<RichTextEditor toolbar={["bold", "italic"]} />);
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Link" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("sets the placeholder as a data attribute for the empty-state CSS", () => {
    render(<RichTextEditor placeholder="Write something…" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-placeholder", "Write something…");
  });

  describe("tables", () => {
    function selectInCell(editorEl: HTMLElement, cell: HTMLElement) {
      editorEl.focus();
      const range = document.createRange();
      range.selectNodeContents(cell);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      // The component's activeCell state updates via a real
      // "selectionchange" listener, outside React's synthetic event system —
      // dispatching it needs an explicit act() so the resulting setState
      // flushes before the next assertion/interaction reads the DOM.
      act(() => {
        document.dispatchEvent(new Event("selectionchange"));
      });
    }

    it("inserting via the grid picker produces the correct NxM table structure", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);

      fireEvent.click(screen.getByRole("button", { name: "Table" }));
      fireEvent.click(screen.getByRole("button", { name: "Insert 2 by 3 table" }));

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      const container = document.createElement("div");
      container.innerHTML = lastHtml;
      const table = container.querySelector("table")!;
      expect(table).toBeTruthy();
      const rows = table.querySelectorAll("tr");
      expect(rows).toHaveLength(2);
      rows.forEach((row) => expect(row.querySelectorAll("td")).toHaveLength(3));
    });

    it("insert row below adds a row to an existing table", () => {
      const onChange = vi.fn();
      render(
        <RichTextEditor
          defaultValue="<table><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr></tbody></table>"
          onChange={onChange}
        />
      );
      const editorEl = screen.getByRole("textbox");
      const firstCell = editorEl.querySelector("td")!;

      selectInCell(editorEl, firstCell);
      fireEvent.click(screen.getByRole("button", { name: "Table cell options" }));
      fireEvent.click(screen.getByRole("menuitem", { name: "Insert row below" }));

      const table = editorEl.querySelector("table")!;
      expect(table.querySelectorAll("tr")).toHaveLength(2);
      expect(table.rows[1]!.cells).toHaveLength(2);
    });

    it("insert column right adds a column to every row of an existing table", () => {
      const onChange = vi.fn();
      render(
        <RichTextEditor
          defaultValue="<table><tbody><tr><td><p>a</p></td></tr><tr><td><p>b</p></td></tr></tbody></table>"
          onChange={onChange}
        />
      );
      const editorEl = screen.getByRole("textbox");
      const firstCell = editorEl.querySelector("td")!;

      selectInCell(editorEl, firstCell);
      fireEvent.click(screen.getByRole("button", { name: "Table cell options" }));
      fireEvent.click(screen.getByRole("menuitem", { name: "Insert column right" }));

      const table = editorEl.querySelector("table")!;
      table.querySelectorAll("tr").forEach((row) => expect(row.cells).toHaveLength(2));
    });

    it("delete row removes the correct row and leaves the others intact", () => {
      render(
        <RichTextEditor defaultValue="<table><tbody><tr><td><p>a</p></td></tr><tr><td><p>b</p></td></tr></tbody></table>" />
      );
      const editorEl = screen.getByRole("textbox");
      const secondRowCell = editorEl.querySelectorAll("td")[1]!;

      selectInCell(editorEl, secondRowCell);
      fireEvent.click(screen.getByRole("button", { name: "Table cell options" }));
      fireEvent.click(screen.getByRole("menuitem", { name: "Delete row" }));

      const table = editorEl.querySelector("table")!;
      expect(table.querySelectorAll("tr")).toHaveLength(1);
      expect(table.textContent).toContain("a");
      expect(table.textContent).not.toContain("b");
    });

    it("delete table removes the whole table from the document", () => {
      render(<RichTextEditor defaultValue="<table><tbody><tr><td><p>a</p></td></tr></tbody></table>" />);
      const editorEl = screen.getByRole("textbox");
      const cell = editorEl.querySelector("td")!;

      selectInCell(editorEl, cell);
      fireEvent.click(screen.getByRole("button", { name: "Table cell options" }));
      fireEvent.click(screen.getByRole("menuitem", { name: "Delete table" }));

      expect(editorEl.querySelector("table")).toBeNull();
    });
  });

  describe("images", () => {
    it("inserting an image via URL produces a sanitized img tag", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);

      fireEvent.click(screen.getByRole("button", { name: "Image" }));
      fireEvent.change(screen.getByLabelText("Image URL"), {
        target: { value: "https://example.com/cat.png" }
      });
      fireEvent.click(screen.getByRole("button", { name: "Insert" }));

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).toContain('<img src="https://example.com/cat.png"');
    });

    it("rejects a javascript: URL attempted via the image URL field — not inserted as-is", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);

      fireEvent.click(screen.getByRole("button", { name: "Image" }));
      fireEvent.change(screen.getByLabelText("Image URL"), {
        target: { value: "javascript:alert(1)" }
      });
      fireEvent.click(screen.getByRole("button", { name: "Insert" }));

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as string | undefined;
      if (lastHtml !== undefined) {
        expect(lastHtml).not.toContain("javascript:");
      }
    });

    it("calls onImageUpload and uses its returned URL instead of a base64 data URL when provided", async () => {
      const onChange = vi.fn();
      const onImageUpload = vi.fn().mockResolvedValue("https://cdn.example.com/uploaded.png");
      render(<RichTextEditor defaultValue="" onChange={onChange} onImageUpload={onImageUpload} />);

      fireEvent.click(screen.getByRole("button", { name: "Image" }));
      const file = new File(["fake-image-bytes"], "photo.png", { type: "image/png" });
      const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(onImageUpload).toHaveBeenCalledWith(file);
      });
      await waitFor(() => {
        const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
        expect(lastHtml).toContain('<img src="https://cdn.example.com/uploaded.png"');
      });
    });
  });

  describe("paste sanitization consistency", () => {
    it("sanitizes pasted HTML through the exact same allowlist as onChange, not a looser one", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");
      editorEl.focus();

      const wordLikeHtml =
        '<p class="MsoNormal" style="margin:0in;font-family:Calibri;position:fixed">Hello <b onclick="alert(1)">world</b></p>';

      fireEvent.paste(editorEl, {
        clipboardData: { getData: (type: string) => (type === "text/html" ? wordLikeHtml : "Hello world") }
      });

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      // Directly comparing against sanitizeHtml() run on the same input proves
      // paste didn't take a separate, looser path — it's the identical function.
      expect(sanitizeHtml(wordLikeHtml)).toBe(lastHtml);
      expect(lastHtml).not.toContain("onclick");
      expect(lastHtml).not.toContain("position");
      expect(lastHtml).not.toContain("MsoNormal");
    });

    // Ctrl+Shift+V doesn't trigger a native 'paste' event in Chrome (verified
    // manually — unlike plain Ctrl+V), so it reads the clipboard directly via
    // the async Clipboard API instead of piggybacking on a paste event. jsdom
    // has no Clipboard API at all, so it's stubbed here.
    it("Ctrl+Shift+V reads the clipboard directly and inserts plain text with no formatting", async () => {
      const onChange = vi.fn();
      const readText = vi.fn().mockResolvedValue("bold and italic");
      Object.assign(navigator, { clipboard: { readText } });

      render(<RichTextEditor defaultValue="<p></p>" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");
      editorEl.focus();

      fireEvent.keyDown(editorEl, { key: "v", ctrlKey: true, shiftKey: true });

      await waitFor(() => expect(readText).toHaveBeenCalled());
      await waitFor(() => {
        const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0] as string | undefined;
        expect(lastHtml).toContain("bold and italic");
      });
      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).not.toContain("<b>");
      expect(lastHtml).not.toContain("<i>");
    });

    it("a plain Ctrl+V paste is unaffected — still sanitizes and keeps HTML formatting", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");
      editorEl.focus();

      fireEvent.paste(editorEl, {
        clipboardData: { getData: (type: string) => (type === "text/html" ? "<p><b>two</b></p>" : "two") }
      });

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).toContain("<b>two</b>");
    });
  });

  describe("alignment", () => {
    it("applies justifyCenter and reflects it in the button's active state", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="<p>hello</p>" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");
      const centerButton = screen.getByRole("button", { name: "Align center" });

      expect(centerButton).toHaveAttribute("aria-pressed", "false");

      selectAllTextIn(editorEl);
      fireEvent.click(centerButton);

      expect(centerButton).toHaveAttribute("aria-pressed", "true");
      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).toContain("text-align: center");
    });
  });

  describe("color and font size", () => {
    it("applying a text color produces a style attribute containing only color", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="<p>hello</p>" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      selectAllTextIn(editorEl);
      fireEvent.click(screen.getByRole("button", { name: "Text color" }));
      fireEvent.click(screen.getByRole("button", { name: "Danger" }));

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      const container = document.createElement("div");
      container.innerHTML = lastHtml;
      const span = container.querySelector("span[style]")!;
      expect(span).toBeTruthy();
      expect(span.getAttribute("style")).toMatch(/^color:\s*[^;]+$/);
    });

    it("applying a highlight color produces a style attribute containing only background-color", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="<p>hello</p>" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      selectAllTextIn(editorEl);
      fireEvent.click(screen.getByRole("button", { name: "Highlight color" }));
      fireEvent.click(screen.getByRole("button", { name: "Series 1" }));

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      const container = document.createElement("div");
      container.innerHTML = lastHtml;
      const span = container.querySelector("span[style]")!;
      expect(span).toBeTruthy();
      expect(span.getAttribute("style")).toMatch(/^background-color:\s*[^;]+$/);
    });

    it("CRITICAL: a disallowed CSS property injected via a style attribute is stripped, only color/background-color/font-size survive", () => {
      const malicious =
        '<span style="color: red; position: fixed; top: 0; left: 0; background-image: url(javascript:alert(1)); z-index: 9999">gotcha</span>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain("position");
      expect(sanitized).not.toContain("z-index");
      expect(sanitized).not.toContain("background-image");
      expect(sanitized).not.toContain("javascript:");
      // the one allowed declaration survives untouched
      expect(sanitized).toContain("color: red");
      expect(sanitized).toContain("gotcha");
    });

    it("CRITICAL: an expression()/behavior-style legacy CSS attack in a style attribute is stripped", () => {
      const malicious = '<span style="color: expression(alert(1)); width: expression(alert(2))">x</span>';
      const sanitized = sanitizeHtml(malicious);
      expect(sanitized).not.toContain("width");
      expect(sanitized).not.toContain("expression");
    });

    it("font size mapping produces a resolved token-based pixel value, not a raw execCommand size", () => {
      const realGetComputedStyle = window.getComputedStyle;
      const computedStyleSpy = vi
        .spyOn(window, "getComputedStyle")
        .mockImplementation((el: Element, pseudo?: string | null) => {
          if (el.tagName === "SPAN" && (el as HTMLElement).style.visibility === "hidden") {
            return { fontSize: "24px" } as CSSStyleDeclaration;
          }
          return realGetComputedStyle(el, pseudo);
        });

      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="<p>hello</p>" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      selectAllTextIn(editorEl);
      fireEvent.click(screen.getByRole("button", { name: "Font size" }));
      fireEvent.click(screen.getByRole("button", { name: "Large" }));

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).toContain("font-size: 24px");
      expect(lastHtml).not.toContain("font size=");
      expect(lastHtml).not.toContain("<font");

      computedStyleSpy.mockRestore();
    });
  });

  describe("markdown shortcuts", () => {
    // Simulates what a real contentEditable looks like right after the user
    // typed `text` into a fresh empty block: a single text node, cursor at
    // the end of it — matching what applyMarkdownShortcut/checkSlashTrigger
    // assume (a single text node holding the whole trigger).
    function setBlockTextWithCursorAtEnd(editorEl: HTMLElement, text: string) {
      editorEl.focus();
      editorEl.innerHTML = `<p>${text}</p>`;
      const p = editorEl.querySelector("p")!;
      const textNode = p.firstChild!;
      const range = document.createRange();
      range.setStart(textNode, text.length);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    }

    it('"# " converts the block to heading1 and removes the trigger text', () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "# ");
      fireEvent.input(editorEl);

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).toContain("<h1>");
      expect(lastHtml).not.toContain("# ");
    });

    it('"## " converts the block to heading2', () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "## ");
      fireEvent.input(editorEl);

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).toContain("<h2>");
    });

    it('"- " converts the block to a bullet list', () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "- ");
      fireEvent.input(editorEl);

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).toContain("<ul>");
    });

    it('"1. " converts the block to an ordered list', () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "1. ");
      fireEvent.input(editorEl);

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).toContain("<ol>");
    });

    it('"> " converts the block to a blockquote', () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "> ");
      fireEvent.input(editorEl);

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).toContain("<blockquote>");
    });

    it("does not trigger mid-sentence — only at the very start of an otherwise-empty block", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "well # actually ");
      fireEvent.input(editorEl);

      const lastHtml = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as string;
      expect(lastHtml).not.toContain("<h1>");
      expect(lastHtml).toContain("well # actually");
    });
  });

  describe("slash command menu", () => {
    function setBlockTextWithCursorAtEnd(editorEl: HTMLElement, text: string) {
      editorEl.focus();
      editorEl.innerHTML = `<p>${text}</p>`;
      const p = editorEl.querySelector("p")!;
      const textNode = p.firstChild!;
      const range = document.createRange();
      range.setStart(textNode, text.length);
      range.collapse(true);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    }

    it('typing "/" at the start of an empty block opens the menu with all commands', () => {
      render(<RichTextEditor defaultValue="" />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "/");
      fireEvent.input(editorEl);

      expect(screen.getByRole("option", { name: "Heading 1" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Table" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Image" })).toBeInTheDocument();
    });

    it('continuing to type narrows the menu — "/tab" matches only Table', () => {
      render(<RichTextEditor defaultValue="" />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "/tab");
      fireEvent.input(editorEl);

      expect(screen.getByRole("option", { name: "Table" })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Heading 1" })).not.toBeInTheDocument();
      expect(screen.queryByRole("option", { name: "Image" })).not.toBeInTheDocument();
    });

    it("Escape closes the menu without applying anything", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "/tab");
      fireEvent.input(editorEl);
      expect(screen.getByRole("option", { name: "Table" })).toBeInTheDocument();

      fireEvent.keyDown(editorEl, { key: "Escape" });

      expect(screen.queryByRole("option", { name: "Table" })).not.toBeInTheDocument();
    });

    it("Enter applies the active command and removes the /query text", () => {
      const onChange = vi.fn();
      render(<RichTextEditor defaultValue="" onChange={onChange} />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "/tab");
      fireEvent.input(editorEl);
      expect(screen.getByRole("option", { name: "Table" })).toBeInTheDocument();

      // Matches CommandPalette's own convention: activeIndex starts at
      // null, so a result needs an explicit arrow-key move before Enter
      // selects anything — even with a single match.
      fireEvent.keyDown(editorEl, { key: "ArrowDown" });
      fireEvent.keyDown(editorEl, { key: "Enter" });

      // Selecting "Table" calls runCommand("table"), which opens the grid
      // picker popover rather than inserting anything itself.
      expect(screen.getByRole("button", { name: "Insert 1 by 1 table" })).toBeInTheDocument();
      expect(editorEl.textContent).not.toContain("/tab");
    });

    it("clicking a menu item applies that command", () => {
      render(<RichTextEditor defaultValue="" />);
      const editorEl = screen.getByRole("textbox");

      setBlockTextWithCursorAtEnd(editorEl, "/blockquote");
      fireEvent.input(editorEl);
      const option = screen.getByRole("option", { name: "Blockquote" });

      fireEvent.mouseDown(option);

      expect(editorEl.textContent).not.toContain("/blockquote");
      expect(screen.queryByRole("option", { name: "Blockquote" })).not.toBeInTheDocument();
    });
  });
});
