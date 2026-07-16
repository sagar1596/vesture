import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Radio } from "./Radio";

describe("Radio", () => {
  it("renders its label", () => {
    render(<Radio label="Option A" />);
    expect(screen.getByLabelText("Option A")).toBeInTheDocument();
  });

  it("forwards the ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Radio label="Option A" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("only allows one radio in a group to be checked", () => {
    render(
      <div>
        <Radio label="Option A" name="group" value="a" />
        <Radio label="Option B" name="group" value="b" />
      </div>
    );
    const a = screen.getByLabelText("Option A") as HTMLInputElement;
    const b = screen.getByLabelText("Option B") as HTMLInputElement;
    fireEvent.click(a);
    expect(a.checked).toBe(true);
    fireEvent.click(b);
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
  });

  it("respects the disabled attribute", () => {
    render(<Radio label="Option A" disabled />);
    expect(screen.getByLabelText("Option A")).toBeDisabled();
  });
});
