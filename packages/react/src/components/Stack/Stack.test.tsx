import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stack } from "./Stack";

describe("Stack", () => {
  it("renders its children", () => {
    render(
      <Stack>
        <span>Child</span>
      </Stack>
    );
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("forwards the ref to the underlying div element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stack ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
