import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders its label", () => {
    render(<Checkbox label="Subscribe" />);
    expect(screen.getByLabelText("Subscribe")).toBeInTheDocument();
  });

  it("forwards the ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox label="Subscribe" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("toggles checked state on click", () => {
    render(<Checkbox label="Subscribe" />);
    const el = screen.getByLabelText("Subscribe") as HTMLInputElement;
    expect(el.checked).toBe(false);
    fireEvent.click(el);
    expect(el.checked).toBe(true);
  });

  it("respects the disabled attribute", () => {
    render(<Checkbox label="Subscribe" disabled />);
    expect(screen.getByLabelText("Subscribe")).toBeDisabled();
  });

  it("sets the indeterminate DOM property when indeterminate is true", () => {
    render(<Checkbox label="Select all" indeterminate />);
    const el = screen.getByLabelText("Select all") as HTMLInputElement;
    expect(el.indeterminate).toBe(true);
    expect(el.hasAttribute("indeterminate")).toBe(false);
  });

  it("clears the indeterminate DOM property when the prop changes to false", () => {
    const { rerender } = render(<Checkbox label="Select all" indeterminate />);
    const el = screen.getByLabelText("Select all") as HTMLInputElement;
    expect(el.indeterminate).toBe(true);
    rerender(<Checkbox label="Select all" indeterminate={false} />);
    expect(el.indeterminate).toBe(false);
  });

  it("still reflects unchecked/checked visual state when indeterminate", () => {
    render(<Checkbox label="Select all" indeterminate />);
    const el = screen.getByLabelText("Select all") as HTMLInputElement;
    expect(el.checked).toBe(false);
    fireEvent.click(el);
    expect(el.checked).toBe(true);
  });
});
