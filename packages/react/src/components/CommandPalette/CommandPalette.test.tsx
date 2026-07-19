import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette } from "./CommandPalette";
import { useCommandPaletteShortcut } from "./useCommandPaletteShortcut";
import type { CommandItem } from "./types";

function makeCommands(onSelect: (id: string) => void): CommandItem[] {
  return [
    { id: "new-file", label: "New File", keywords: ["create"], onSelect: () => onSelect("new-file") },
    { id: "open-file", label: "Open File", onSelect: () => onSelect("open-file") },
    { id: "close-tab", label: "Close Tab", disabled: true, onSelect: () => onSelect("close-tab") },
    { id: "toggle-theme", label: "Toggle Theme", keywords: ["dark", "light"], onSelect: () => onSelect("toggle-theme") }
  ];
}

function renderPalette(props: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  const onSelect = vi.fn();
  const onOpenChange = vi.fn();
  const commands = props.commands ?? makeCommands(onSelect);
  const utils = render(
    <CommandPalette open commands={commands} onOpenChange={onOpenChange} {...props} />
  );
  return { ...utils, onSelect, onOpenChange, commands };
}

describe("CommandPalette", () => {
  it("shows all commands when open", () => {
    renderPalette();
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(4);
  });

  it("filters the visible list by label as the user types", () => {
    renderPalette();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "open" } });
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Open File");
  });

  it("filters by keyword, not just label", () => {
    renderPalette();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "dark" } });
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Toggle Theme");
  });

  it("calls onSelect and closes on Enter for the active item", () => {
    const { onSelect, onOpenChange } = renderPalette();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("new-file");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes on Escape without selecting", () => {
    const { onSelect, onOpenChange } = renderPalette();
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("skips disabled commands during arrow-key navigation", () => {
    const { onSelect } = renderPalette();
    const input = screen.getByRole("combobox");
    // New File, Open File, Close Tab (disabled, skipped), Toggle Theme
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("toggle-theme");
  });

  it("does not select a disabled command via click", () => {
    const { onSelect, onOpenChange } = renderPalette();
    fireEvent.mouseDown(screen.getByRole("option", { name: "Close Tab" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("selects on click and closes the palette", () => {
    const { onSelect, onOpenChange } = renderPalette();
    fireEvent.mouseDown(screen.getByRole("option", { name: "Open File" }));
    expect(onSelect).toHaveBeenCalledWith("open-file");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  describe("grouping", () => {
    function groupedCommands(onSelect: (id: string) => void): CommandItem[] {
      return [
        { id: "a", label: "Alpha", group: "File", onSelect: () => onSelect("a") },
        { id: "b", label: "Bravo", group: "File", onSelect: () => onSelect("b") },
        { id: "c", label: "Charlie", group: "Edit", onSelect: () => onSelect("c") }
      ];
    }

    it("renders group headers only for groups with post-filter matches", () => {
      const onSelect = vi.fn();
      renderPalette({ commands: groupedCommands(onSelect) });
      expect(screen.getAllByRole("presentation")).toHaveLength(2);
      expect(screen.getByText("File")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();

      const input = screen.getByRole("combobox");
      fireEvent.change(input, { target: { value: "charlie" } });

      expect(screen.getAllByRole("presentation")).toHaveLength(1);
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.queryByText("File")).not.toBeInTheDocument();
    });
  });

  describe("virtualization", () => {
    function manyCommands(onSelect: (id: string) => void): CommandItem[] {
      return Array.from({ length: 500 }, (_, i) => ({
        id: `command-${i}`,
        label: `Command ${i}`,
        onSelect: () => onSelect(`command-${i}`)
      }));
    }

    it("renders only a bounded subset of rows at/above the threshold", () => {
      const onSelect = vi.fn();
      renderPalette({ commands: manyCommands(onSelect) });
      const rendered = within(screen.getByRole("listbox")).getAllByRole("option");
      expect(rendered.length).toBeGreaterThan(0);
      expect(rendered.length).toBeLessThan(200);
    });
  });

  it("does not render when closed", () => {
    renderPalette({ open: false });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

describe("useCommandPaletteShortcut", () => {
  it("fires onOpenChange(true) on the configured key combo", () => {
    const onOpenChange = vi.fn();
    function Probe() {
      useCommandPaletteShortcut(onOpenChange, { metaKey: true, ctrlKey: false });
      return null;
    }
    render(<Probe />);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("does not fire on unrelated key presses", () => {
    const onOpenChange = vi.fn();
    function Probe() {
      useCommandPaletteShortcut(onOpenChange, { metaKey: true, ctrlKey: false });
      return null;
    }
    render(<Probe />);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "j", metaKey: true }));
    });
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: false }));
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("cleans up its listener on unmount", () => {
    const onOpenChange = vi.fn();
    function Probe() {
      useCommandPaletteShortcut(onOpenChange, { metaKey: true, ctrlKey: false });
      return null;
    }
    const { unmount } = render(<Probe />);
    unmount();

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
