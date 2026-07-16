import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../Button";
import { Popover } from "./Popover";

describe("Popover", () => {
  it("opens on trigger click and shows content", async () => {
    render(
      <Popover content="Popover body">
        <Button>Open</Button>
      </Popover>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("Popover body"));
  });

  it("closes on Escape", async () => {
    render(
      <Popover content="Popover body">
        <Button>Open</Button>
      </Popover>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
