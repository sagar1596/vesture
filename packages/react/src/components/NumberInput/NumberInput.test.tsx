import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NumberInput } from "./NumberInput";

describe("NumberInput", () => {
  it("renders with an initial value", () => {
    render(<NumberInput aria-label="Quantity" defaultValue={3} />);
    expect(screen.getByRole("spinbutton", { name: "Quantity" })).toHaveValue("3");
  });

  it("increments and decrements via the stepper buttons", () => {
    const onChange = vi.fn();
    render(<NumberInput aria-label="Quantity" value={3} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Increment" }));
    expect(onChange).toHaveBeenLastCalledWith(4);
    fireEvent.click(screen.getByRole("button", { name: "Decrement" }));
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("clamps to min and max", () => {
    const onChange = vi.fn();
    render(<NumberInput aria-label="Quantity" value={5} min={0} max={5} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Increment" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Increment" })).toBeDisabled();
  });

  it("supports arrow key increment/decrement", () => {
    const onChange = vi.fn();
    render(<NumberInput aria-label="Quantity" value={3} step={2} onChange={onChange} />);
    const inputEl = screen.getByRole("spinbutton", { name: "Quantity" });
    fireEvent.keyDown(inputEl, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(inputEl, { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("commits typed text on blur, reverting invalid input", () => {
    const onChange = vi.fn();
    render(<NumberInput aria-label="Quantity" value={3} onChange={onChange} />);
    const inputEl = screen.getByRole("spinbutton", { name: "Quantity" });
    fireEvent.change(inputEl, { target: { value: "abc" } });
    fireEvent.blur(inputEl);
    expect(onChange).not.toHaveBeenCalled();
    expect(inputEl).toHaveValue("3");
  });

  it("commits a valid typed value on Enter", () => {
    const onChange = vi.fn();
    render(<NumberInput aria-label="Quantity" value={3} onChange={onChange} />);
    const inputEl = screen.getByRole("spinbutton", { name: "Quantity" });
    fireEvent.change(inputEl, { target: { value: "7" } });
    fireEvent.keyDown(inputEl, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(7);
  });

  it("forwards the ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<NumberInput aria-label="Quantity" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("respects the disabled attribute", () => {
    render(<NumberInput aria-label="Quantity" disabled />);
    expect(screen.getByRole("spinbutton", { name: "Quantity" })).toBeDisabled();
  });
});
