import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../Button";
import { DropdownMenu } from "./index";

function renderMenu(onSelect = vi.fn()) {
  render(
    <DropdownMenu trigger={<Button>Options</Button>}>
      <DropdownMenu.Item onSelect={onSelect}>Edit</DropdownMenu.Item>
      <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
      <DropdownMenu.Item disabled>Archive</DropdownMenu.Item>
    </DropdownMenu>
  );
  return onSelect;
}

describe("DropdownMenu", () => {
  it("opens on trigger click and shows items", async () => {
    renderMenu();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
  });

  it("calls onSelect and closes when an item is clicked", async () => {
    const onSelect = renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onSelect).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("closes on Escape", async () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());

    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("disables the disabled item", async () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(screen.getByRole("menuitem", { name: "Archive" })).toBeDisabled();
  });
});
