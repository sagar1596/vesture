import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { CommandPalette } from "./CommandPalette";
import { useCommandPaletteShortcut } from "./useCommandPaletteShortcut";
import type { CommandItem } from "./types";

const meta: Meta<typeof CommandPalette> = {
  title: "Components/CommandPalette",
  component: CommandPalette
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

function makeFlatCommands(onRun: (label: string) => void): CommandItem[] {
  return [
    { id: "new-file", label: "New File", shortcut: "⌘N", keywords: ["create"], onSelect: () => onRun("New File") },
    { id: "open-file", label: "Open File", shortcut: "⌘O", onSelect: () => onRun("Open File") },
    { id: "save-file", label: "Save File", shortcut: "⌘S", onSelect: () => onRun("Save File") },
    {
      id: "close-tab",
      label: "Close Tab",
      description: "Not available right now",
      disabled: true,
      onSelect: () => onRun("Close Tab")
    },
    { id: "toggle-theme", label: "Toggle Theme", keywords: ["dark", "light", "appearance"], onSelect: () => onRun("Toggle Theme") }
  ];
}

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [lastRun, setLastRun] = useState<string | null>(null);
    const commands = makeFlatCommands(setLastRun);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open command palette</Button>
        <p>Last run: {lastRun ?? "none"}</p>
        <CommandPalette open={open} onOpenChange={setOpen} commands={commands} />
      </div>
    );
  }
};

function makeGroupedCommands(onRun: (label: string) => void): CommandItem[] {
  return [
    { id: "new-file", label: "New File", group: "File", shortcut: "⌘N", onSelect: () => onRun("New File") },
    { id: "open-file", label: "Open File", group: "File", shortcut: "⌘O", onSelect: () => onRun("Open File") },
    { id: "save-file", label: "Save File", group: "File", shortcut: "⌘S", onSelect: () => onRun("Save File") },
    { id: "undo", label: "Undo", group: "Edit", shortcut: "⌘Z", onSelect: () => onRun("Undo") },
    { id: "redo", label: "Redo", group: "Edit", shortcut: "⇧⌘Z", onSelect: () => onRun("Redo") },
    { id: "find", label: "Find", group: "Edit", shortcut: "⌘F", onSelect: () => onRun("Find") },
    {
      id: "toggle-theme",
      label: "Toggle Theme",
      group: "View",
      description: "Switch between light and dark",
      onSelect: () => onRun("Toggle Theme")
    },
    { id: "zoom-in", label: "Zoom In", group: "View", onSelect: () => onRun("Zoom In") }
  ];
}

export const WithGroups: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [lastRun, setLastRun] = useState<string | null>(null);
    const commands = makeGroupedCommands(setLastRun);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open command palette</Button>
        <p>Last run: {lastRun ?? "none"}</p>
        <CommandPalette open={open} onOpenChange={setOpen} commands={commands} />
      </div>
    );
  }
};

export const WithShortcutHook: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [lastRun, setLastRun] = useState<string | null>(null);
    const commands = makeFlatCommands(setLastRun);
    useCommandPaletteShortcut(setOpen);
    return (
      <div>
        <p>Press ⌘K (Mac) or Ctrl+K (elsewhere), or use the button below.</p>
        <Button onClick={() => setOpen(true)}>Open command palette</Button>
        <p>Last run: {lastRun ?? "none"}</p>
        <CommandPalette open={open} onOpenChange={setOpen} commands={commands} />
      </div>
    );
  }
};

const manyCommands: CommandItem[] = Array.from({ length: 500 }, (_, i) => ({
  id: `command-${i}`,
  label: `Command ${i}`,
  group: `Group ${Math.floor(i / 25)}`,
  onSelect: () => {}
}));

// Above the default virtualizationThreshold (50), so the list windows its
// rendering — open devtools and inspect the listbox: only a small bounded
// number of [role="option"] elements exist in the DOM at once, not 500+.
export const LargeCommandList: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open command palette</Button>
        <CommandPalette open={open} onOpenChange={setOpen} commands={manyCommands} />
      </div>
    );
  }
};
