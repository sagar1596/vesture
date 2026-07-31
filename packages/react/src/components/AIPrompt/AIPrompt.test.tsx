import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AIPrompt } from "./AIPrompt";

describe("AIPrompt", () => {
  it("submits the trimmed prompt via the Send button and clears the input", () => {
    const onSubmit = vi.fn();
    render(<AIPrompt onSubmit={onSubmit} />);
    const input = screen.getByRole("combobox", { name: "Prompt" });
    fireEvent.change(input, { target: { value: "  hello world  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenCalledWith("hello world");
    expect(input).toHaveValue("");
  });

  it("submits on Enter and inserts a newline on Shift+Enter", () => {
    const onSubmit = vi.fn();
    render(<AIPrompt onSubmit={onSubmit} />);
    const input = screen.getByRole("combobox", { name: "Prompt" });

    fireEvent.change(input, { target: { value: "line" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("line");
  });

  it("disables the Send button when the input is empty or disabled", () => {
    const { rerender } = render(<AIPrompt onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    const input = screen.getByRole("combobox", { name: "Prompt" });
    fireEvent.change(input, { target: { value: "hi" } });
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();

    rerender(<AIPrompt onSubmit={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("renders suggestion cards and auto-submits on click by default", () => {
    const onSubmit = vi.fn();
    render(
      <AIPrompt
        onSubmit={onSubmit}
        suggestions={[{ id: "1", title: "Summarize", description: "Summarize this", prompt: "Summarize this page" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Summarize/ }));
    expect(onSubmit).toHaveBeenCalledWith("Summarize this page");
    expect(screen.getByRole("combobox", { name: "Prompt" })).toHaveValue("");
  });

  it("only fills the input on suggestion click when autoSubmitOnSuggestionClick is false", () => {
    const onSubmit = vi.fn();
    render(
      <AIPrompt
        onSubmit={onSubmit}
        autoSubmitOnSuggestionClick={false}
        suggestions={[{ id: "1", title: "Explain", prompt: "Explain this code" }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Explain" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "Prompt" })).toHaveValue("Explain this code");
  });

  it("does not open a command menu when '/' is typed without a commands prop", () => {
    render(<AIPrompt onSubmit={vi.fn()} />);
    const input = screen.getByRole("combobox", { name: "Prompt" });
    fireEvent.change(input, { target: { value: "/" } });
    expect(screen.queryByRole("listbox", { name: "Prompt commands" })).not.toBeInTheDocument();
  });

  it("opens the command menu only when '/' is the first character, filters by query, and inserts the template on selection", async () => {
    render(
      <AIPrompt
        onSubmit={vi.fn()}
        commands={[
          { id: "1", label: "/summarize", template: "Summarize: " },
          { id: "2", label: "/translate", template: "Translate: " }
        ]}
      />
    );
    const input = screen.getByRole("combobox", { name: "Prompt" });

    fireEvent.change(input, { target: { value: "not a slash /summarize" } });
    expect(screen.queryByRole("listbox", { name: "Prompt commands" })).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "/" } });
    await waitFor(() => expect(screen.getByRole("listbox", { name: "Prompt commands" })).toBeInTheDocument());
    expect(screen.getByRole("option", { name: "/summarize" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "/translate" })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "/trans" } });
    await waitFor(() => expect(screen.queryByRole("option", { name: "/summarize" })).not.toBeInTheDocument());
    expect(screen.getByRole("option", { name: "/translate" })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("option", { name: "/translate" }));
    expect(input).toHaveValue("Translate: ");
    expect(screen.queryByRole("listbox", { name: "Prompt commands" })).not.toBeInTheDocument();
  });

  it("navigates the command menu with arrow keys and selects the active item with Enter", async () => {
    render(
      <AIPrompt
        onSubmit={vi.fn()}
        commands={[
          { id: "1", label: "/summarize", template: "Summarize: " },
          { id: "2", label: "/translate", template: "Translate: " }
        ]}
      />
    );
    const input = screen.getByRole("combobox", { name: "Prompt" });
    fireEvent.change(input, { target: { value: "/" } });
    await waitFor(() => expect(screen.getByRole("listbox", { name: "Prompt commands" })).toBeInTheDocument());

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input).toHaveValue("Summarize: ");
  });
});
