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
});
