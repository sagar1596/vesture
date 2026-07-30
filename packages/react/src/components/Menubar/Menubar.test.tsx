import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DropdownMenu } from "../DropdownMenu";
import { Menubar } from "./index";
import type { MenubarItem } from "./index";

const items: MenubarItem[] = [
  {
    id: "file",
    label: "File",
    content: (
      <>
        <DropdownMenu.Item>New</DropdownMenu.Item>
        <DropdownMenu.Item>Open</DropdownMenu.Item>
      </>
    )
  },
  {
    id: "edit",
    label: "Edit",
    content: (
      <>
        <DropdownMenu.Item>Undo</DropdownMenu.Item>
        <DropdownMenu.Item>Redo</DropdownMenu.Item>
      </>
    )
  },
  {
    id: "view",
    label: "View",
    content: (
      <>
        <DropdownMenu.Item>Zoom In</DropdownMenu.Item>
        <DropdownMenu.Item>Zoom Out</DropdownMenu.Item>
      </>
    )
  }
];

function renderMenubar() {
  render(<Menubar items={items} />);
}

describe("Menubar", () => {
  it("opens a menu when its trigger is clicked", async () => {
    renderMenubar();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "File" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(screen.getByRole("menuitem", { name: "New" })).toBeInTheDocument();
  });

  it("switches which menu is open when arrowing across triggers while one is open", async () => {
    renderMenubar();

    fireEvent.click(screen.getByRole("button", { name: "File" }));
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "New" })).toBeInTheDocument());

    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowRight" });

    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Undo" })).toBeInTheDocument());
    expect(screen.queryByRole("menuitem", { name: "New" })).not.toBeInTheDocument();
    // Only one menu should be open at a time.
    expect(screen.getAllByRole("menu")).toHaveLength(1);

    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowRight" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Zoom In" })).toBeInTheDocument());

    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowLeft" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Undo" })).toBeInTheDocument());
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    renderMenubar();

    const fileTrigger = screen.getByRole("button", { name: "File" });
    fireEvent.click(fileTrigger);
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());

    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(fileTrigger).toHaveFocus());
  });
});
