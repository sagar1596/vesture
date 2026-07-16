import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("renders as an alert role with title and description", () => {
    render(<Alert title="Heads up">Something happened.</Alert>);
    const alertEl = screen.getByRole("alert");
    expect(alertEl).toHaveTextContent("Heads up");
    expect(alertEl).toHaveTextContent("Something happened.");
  });

  it("does not render a close button by default", () => {
    render(<Alert title="Heads up">Body</Alert>);
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });

  it("calls onDismiss when the close button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <Alert title="Heads up" onDismiss={onDismiss}>
        Body
      </Alert>
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
