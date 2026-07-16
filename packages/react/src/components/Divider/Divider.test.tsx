import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Divider } from "./Divider";

describe("Divider", () => {
  it("renders as an hr with a separator role", () => {
    render(<Divider data-testid="divider" />);
    expect(screen.getByTestId("divider").tagName).toBe("HR");
  });

  it("forwards the ref to the underlying hr element", () => {
    const ref = createRef<HTMLHRElement>();
    render(<Divider ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLHRElement);
  });

  it("sets aria-orientation to match the orientation prop", () => {
    render(<Divider orientation="vertical" data-testid="divider" />);
    expect(screen.getByTestId("divider")).toHaveAttribute("aria-orientation", "vertical");
  });
});
