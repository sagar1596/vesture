import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RichTextEditor } from "./RichTextEditor";

const meta: Meta<typeof RichTextEditor> = {
  title: "Components/RichTextEditor",
  component: RichTextEditor,
  args: {
    placeholder: "Write something…",
    style: { width: "480px" }
  }
};

export default meta;
type Story = StoryObj<typeof RichTextEditor>;

export const Default: Story = {};

export const CustomToolbarSubset: Story = {
  args: {
    toolbar: ["bold", "italic", "link", "bulletList"]
  }
};

export const ControlledValue: Story = {
  render: (args) => {
    function ControlledDemo() {
      const [html, setHtml] = useState("<p>Edit me.</p>");
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "480px" }}>
          <RichTextEditor {...args} value={html} onChange={setHtml} />
          <pre style={{ fontSize: "12px", whiteSpace: "pre-wrap" }}>{html}</pre>
        </div>
      );
    }
    return <ControlledDemo />;
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "<p>You can't edit this.</p>"
  }
};

export const WithInitialContent: Story = {
  args: {
    defaultValue:
      "<h1>Getting started</h1><p>This editor supports <b>bold</b>, <i>italic</i>, and <a href=\"https://example.com\">links</a>.</p><ul><li>First</li><li>Second</li></ul>"
  }
};

export const WithTables: Story = {
  args: {
    defaultValue:
      "<p>Click the ⊞ toolbar button to insert a new table, or click into a cell below and use the ⋮ handle that appears at its corner for row/column actions.</p>" +
      "<table><tbody><tr><td><p>Name</p></td><td><p>Role</p></td></tr><tr><td><p>Ada</p></td><td><p>Engineer</p></td></tr></tbody></table>"
  }
};

export const WithImages: Story = {
  args: {
    defaultValue:
      "<p>Use the 🖼 toolbar button to insert an image either by URL or by uploading a file (base64-embedded, since this story doesn't pass onImageUpload).</p>"
  }
};

export const ImageResize: Story = {
  args: {
    defaultValue:
      '<p>Click the image below to select it, then drag its bottom-right handle to resize (hold Shift to resize freely instead of preserving aspect ratio).</p><img src="https://picsum.photos/seed/vesture/400/240" alt="" width="400" height="240">'
  }
};

// Storybook can't drive a real OS clipboard, so this documents how to
// exercise it manually: copy a paragraph with bold/links from an external
// rich source (a live webpage, Google Docs, Word) and paste it into the
// editor below. It should render with formatting kept, but stripped of the
// source's inline styles/classes — open devtools and inspect the resulting
// DOM, or watch the value in the ControlledValue story, to confirm.
export const PasteFromRichSource: Story = {
  args: {
    defaultValue: "<p>Click into this editor, then paste (Ctrl/Cmd+V) a rich-text selection copied from elsewhere.</p>"
  }
};

export const PlainTextPaste: Story = {
  args: {
    defaultValue:
      "<p>Copy some <b>bold</b> or <i>italic</i> text from elsewhere, then paste it here with Ctrl/Cmd+Shift+V — it should land as plain text with no formatting.</p>"
  }
};

export const TextAlignment: Story = {
  args: {
    toolbar: ["alignLeft", "alignCenter", "alignRight", "alignJustify", "undo", "redo"],
    defaultValue:
      "<p>Select this paragraph and try the alignment buttons — the active one reflects the cursor's current block alignment.</p>"
  }
};

export const ColorAndHighlight: Story = {
  args: {
    toolbar: ["bold", "italic", "textColor", "highlightColor", "undo", "redo"],
    defaultValue: "<p>Select some of this text, then apply a text color or a highlight from the swatch popover.</p>"
  }
};

export const FontSizes: Story = {
  args: {
    toolbar: ["fontSize", "undo", "redo"],
    defaultValue: "<p>Select this text and pick a size from the Font size dropdown — Small through Extra large.</p>"
  }
};
