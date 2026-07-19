import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";
import type { ComboboxOption } from "./types";

const fruitOptions: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry", disabled: true },
  { value: "durian", label: "Durian" }
];

function renderCombobox(props: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  return render(<Combobox aria-label="Fruit" options={fruitOptions} {...props} />);
}

describe("Combobox", () => {
  it("opens the listbox on focus and shows all options", async () => {
    renderCombobox();
    fireEvent.focus(screen.getByRole("combobox", { name: "Fruit" }));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(4);
  });

  it("filters options as the user types", async () => {
    renderCombobox();
    const inputEl = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.focus(inputEl);
    fireEvent.change(inputEl, { target: { value: "ban" } });
    await waitFor(() => {
      expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
    });
    expect(within(screen.getByRole("listbox")).getByRole("option", { name: "Banana" })).toBeInTheDocument();
  });

  it("selects an option on click and closes the listbox", async () => {
    const onChange = vi.fn();
    renderCombobox({ onChange });
    const inputEl = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.focus(inputEl);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.mouseDown(screen.getByRole("option", { name: "Apple" }));
    expect(onChange).toHaveBeenCalledWith("apple");
    expect(inputEl).toHaveValue("Apple");
  });

  it("selects the active option with the keyboard", async () => {
    const onChange = vi.fn();
    renderCombobox({ onChange });
    const inputEl = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.focus(inputEl);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.keyDown(inputEl, { key: "ArrowDown" });
    fireEvent.keyDown(inputEl, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("apple");
  });

  it("skips disabled options during keyboard navigation", async () => {
    const onChange = vi.fn();
    renderCombobox({ onChange });
    const inputEl = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.focus(inputEl);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.keyDown(inputEl, { key: "ArrowDown" });
    fireEvent.keyDown(inputEl, { key: "ArrowDown" });
    fireEvent.keyDown(inputEl, { key: "ArrowDown" });
    fireEvent.keyDown(inputEl, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("durian");
  });

  it("supports multi-select with chips and backspace removal", async () => {
    const onChange = vi.fn();
    renderCombobox({ multiple: true, defaultValue: ["apple"], onChange });
    expect(screen.getByText("Apple")).toBeInTheDocument();

    const inputEl = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.focus(inputEl);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.mouseDown(screen.getByRole("option", { name: "Banana" }));
    expect(onChange).toHaveBeenLastCalledWith(["apple", "banana"]);

    fireEvent.keyDown(inputEl, { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith(["apple"]);
  });

  it("shows the empty state message when no options match", async () => {
    renderCombobox({ noOptionsMessage: "Nothing found" });
    const inputEl = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.focus(inputEl);
    fireEvent.change(inputEl, { target: { value: "zzz" } });
    await waitFor(() => expect(screen.getByText("Nothing found")).toBeInTheDocument());
  });

  it("respects the disabled attribute", () => {
    renderCombobox({ disabled: true });
    expect(screen.getByRole("combobox", { name: "Fruit" })).toBeDisabled();
  });

  describe("virtualization", () => {
    const manyOptions: ComboboxOption[] = Array.from({ length: 5000 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i}`
    }));

    it("renders all options directly below the virtualization threshold", async () => {
      renderCombobox();
      fireEvent.focus(screen.getByRole("combobox", { name: "Fruit" }));
      await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
      expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(4);
    });

    it("renders only a bounded subset of options at/above the threshold", async () => {
      renderCombobox({ options: manyOptions });
      fireEvent.focus(screen.getByRole("combobox", { name: "Fruit" }));
      await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
      const rendered = within(screen.getByRole("listbox")).getAllByRole("option");
      expect(rendered.length).toBeGreaterThan(0);
      expect(rendered.length).toBeLessThan(200);
    });

    it("scrolls the active option into view and keeps aria-activedescendant valid when navigating past the visible window", async () => {
      renderCombobox({ options: manyOptions });
      const inputEl = screen.getByRole("combobox", { name: "Fruit" });
      fireEvent.focus(inputEl);
      await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());

      for (let i = 0; i < 60; i++) {
        fireEvent.keyDown(inputEl, { key: "ArrowDown" });
      }

      const activeId = inputEl.getAttribute("aria-activedescendant");
      expect(activeId).toMatch(/-option-59$/);
      const activeEl = document.getElementById(activeId!);
      expect(activeEl).toBeInTheDocument();
      expect(activeEl).toHaveTextContent("Option 59");
    });

    it("selects a virtualized, off-screen-until-navigated-to option via Enter", async () => {
      const onChange = vi.fn();
      renderCombobox({ options: manyOptions, onChange });
      const inputEl = screen.getByRole("combobox", { name: "Fruit" });
      fireEvent.focus(inputEl);
      await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());

      for (let i = 0; i < 60; i++) {
        fireEvent.keyDown(inputEl, { key: "ArrowDown" });
      }
      fireEvent.keyDown(inputEl, { key: "Enter" });

      expect(onChange).toHaveBeenCalledWith("option-59");
    });
  });

  it("reverts the input text on Escape without committing a value", async () => {
    const onChange = vi.fn();
    renderCombobox({ value: "apple", onChange });
    const inputEl = screen.getByRole("combobox", { name: "Fruit" });
    fireEvent.focus(inputEl);
    fireEvent.change(inputEl, { target: { value: "zzz" } });
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.keyDown(inputEl, { key: "Escape" });
    expect(inputEl).toHaveValue("Apple");
    expect(onChange).not.toHaveBeenCalled();
  });
});
