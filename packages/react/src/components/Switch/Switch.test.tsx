import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("renders its label", () => {
    render(<Switch label="Enable" />);
    expect(screen.getByLabelText("Enable")).toBeInTheDocument();
  });

  it("exposes the switch role", () => {
    render(<Switch label="Enable" />);
    expect(screen.getByRole("switch", { name: "Enable" })).toBeInTheDocument();
  });

  it("forwards the ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Switch label="Enable" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("toggles on click", () => {
    render(<Switch label="Enable" />);
    const el = screen.getByRole("switch", { name: "Enable" }) as HTMLInputElement;
    expect(el.checked).toBe(false);
    fireEvent.click(el);
    expect(el.checked).toBe(true);
  });

  it("respects the disabled attribute", () => {
    render(<Switch label="Enable" disabled />);
    expect(screen.getByRole("switch", { name: "Enable" })).toBeDisabled();
  });
});
