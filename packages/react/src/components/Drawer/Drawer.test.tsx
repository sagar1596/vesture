import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Drawer } from "./Drawer";
import { side as sideStyles } from "./Drawer.css";
import type { DrawerSide } from "./types";

function ControlledDrawer({ side }: { side?: DrawerSide }) {
  const [open, setOpen] = useState(true);
  return (
    <Drawer open={open} onOpenChange={setOpen} title="Settings" side={side}>
      <p>Drawer content</p>
      <input data-testid="drawer-input" />
    </Drawer>
  );
}

describe("Drawer", () => {
  it("renders nothing when closed", () => {
    render(
      <Drawer open={false} onOpenChange={() => {}} title="Hidden">
        <p>Content</p>
      </Drawer>
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders its title and content when open", () => {
    render(
      <Drawer open onOpenChange={() => {}} title="Settings">
        <p>Drawer content</p>
      </Drawer>
    );
    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Drawer content")).toBeInTheDocument();
  });

  it.each<DrawerSide>(["left", "right", "top", "bottom"])("renders on the %s edge", (side) => {
    render(
      <Drawer open onOpenChange={() => {}} side={side}>
        <p>Content</p>
      </Drawer>
    );
    expect(screen.getByRole("dialog")).toHaveClass(sideStyles[side]);
  });

  it("defaults to the right edge", () => {
    render(
      <Drawer open onOpenChange={() => {}}>
        <p>Content</p>
      </Drawer>
    );
    expect(screen.getByRole("dialog")).toHaveClass(sideStyles.right);
  });

  it("calls onOpenChange(false) on Escape", () => {
    let called = false;
    render(
      <Drawer
        open
        onOpenChange={() => {
          called = true;
        }}
        title="Settings"
      >
        <p>Content</p>
      </Drawer>
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(called).toBe(true);
  });

  it("closes on Escape end-to-end", async () => {
    render(<ControlledDrawer />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.transitionEnd(screen.getByRole("dialog"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes when clicking the overlay", async () => {
    render(<ControlledDrawer />);
    const dialog = screen.getByRole("dialog");
    // The overlay is the FloatingOverlay backdrop, the dialog's positioned parent.
    fireEvent.pointerDown(dialog.parentElement as Element);
    fireEvent.mouseDown(dialog.parentElement as Element);
    fireEvent.click(dialog.parentElement as Element);
    fireEvent.transitionEnd(dialog);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("traps focus within the drawer while open", () => {
    render(<ControlledDrawer />);
    const input = screen.getByTestId("drawer-input");
    input.focus();
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
  });

  it("does not unmount instantly on close — stays in the DOM until the exit transition ends", async () => {
    render(<ControlledDrawer />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    // Still present immediately after close is requested: exit animation hasn't finished.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "closed");

    fireEvent.transitionEnd(screen.getByRole("dialog"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
