import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("renders", () => {
    render(<Textarea placeholder="Message" />);
    expect(screen.getByPlaceholderText("Message")).toBeInTheDocument();
  });

  it("forwards the ref to the underlying textarea element", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("sets aria-invalid when invalid is true", () => {
    render(<Textarea invalid placeholder="Message" />);
    expect(screen.getByPlaceholderText("Message")).toHaveAttribute("aria-invalid", "true");
  });

  it("respects the disabled attribute", () => {
    render(<Textarea disabled placeholder="Message" />);
    expect(screen.getByPlaceholderText("Message")).toBeDisabled();
  });
});
