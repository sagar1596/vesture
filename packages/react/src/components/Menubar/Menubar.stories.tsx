import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropdownMenu } from "../DropdownMenu";
import { Menubar } from "./index";
import type { MenubarItem } from "./index";

const meta: Meta<typeof Menubar> = {
  title: "Components/Menubar",
  component: Menubar
};

export default meta;
type Story = StoryObj<typeof Menubar>;

const defaultItems: MenubarItem[] = [
  {
    id: "file",
    label: "File",
    content: (
      <>
        <DropdownMenu.Item onSelect={() => console.log("New")}>New</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => console.log("Open")}>Open</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => console.log("Save")}>Save</DropdownMenu.Item>
      </>
    )
  },
  {
    id: "edit",
    label: "Edit",
    content: (
      <>
        <DropdownMenu.Item onSelect={() => console.log("Undo")}>Undo</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => console.log("Redo")}>Redo</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Cut (disabled)</DropdownMenu.Item>
      </>
    )
  },
  {
    id: "view",
    label: "View",
    content: (
      <>
        <DropdownMenu.Item onSelect={() => console.log("Zoom In")}>Zoom In</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => console.log("Zoom Out")}>Zoom Out</DropdownMenu.Item>
      </>
    )
  }
];

export const Default3Items: Story = {
  render: () => (
    <div style={{ padding: "80px" }}>
      <Menubar items={defaultItems} />
    </div>
  )
};

export const KeyboardNavigationAcrossMenus: Story = {
  render: () => (
    <div style={{ padding: "80px" }}>
      <p style={{ marginBottom: "12px", fontFamily: "sans-serif", fontSize: "13px" }}>
        Click a trigger (or focus it and press ArrowDown) to open its menu, then use
        ArrowLeft/ArrowRight to switch between File/Edit/View without re-clicking. Escape closes
        the open menu and returns focus to its trigger.
      </p>
      <Menubar items={defaultItems} />
    </div>
  )
};
