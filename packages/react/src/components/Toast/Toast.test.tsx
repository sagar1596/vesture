import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";

function Demo() {
  const { toast } = useToast();
  return (
    <button onClick={() => toast({ title: "Saved", description: "All changes saved.", duration: 0 })}>
      Trigger
    </button>
  );
}

describe("Toast", () => {
  it("shows a toast when triggered", async () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Saved"));
  });

  it("dismisses a toast when its close button is clicked", async () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("throws when useToast is used outside a provider", () => {
    function Broken() {
      useToast();
      return null;
    }
    expect(() => render(<Broken />)).toThrow(/useToast must be used within a ToastProvider/);
  });
});
