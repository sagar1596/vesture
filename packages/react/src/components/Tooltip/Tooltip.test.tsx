import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../Button";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("shows content on hover and hides on unhover", async () => {
    render(
      <Tooltip content="Helpful text">
        <Button>Trigger</Button>
      </Tooltip>
    );

    const trigger = screen.getByRole("button", { name: "Trigger" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.mouseEnter(trigger);
    await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("Helpful text"));

    fireEvent.mouseLeave(trigger);
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });

  it("shows content on focus", async () => {
    render(
      <Tooltip content="Helpful text">
        <Button>Trigger</Button>
      </Tooltip>
    );

    const trigger = screen.getByRole("button", { name: "Trigger" });
    trigger.focus();
    await waitFor(() => expect(screen.getByRole("tooltip")).toBeInTheDocument());
  });
});
