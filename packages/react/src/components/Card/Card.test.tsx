import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("renders its children", () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("forwards the ref to the underlying div element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>Hello</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
