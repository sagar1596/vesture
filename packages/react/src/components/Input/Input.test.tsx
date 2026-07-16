import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("renders and accepts typed text", async () => {
    render(<Input placeholder="Email" />);
    const el = screen.getByPlaceholderText("Email") as HTMLInputElement;
    expect(el).toBeInTheDocument();
  });

  it("forwards the ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("sets aria-invalid when invalid is true", () => {
    render(<Input invalid placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("respects the disabled attribute", () => {
    render(<Input disabled placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toBeDisabled();
  });
});
