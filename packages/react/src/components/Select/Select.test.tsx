import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "./Select";

function renderSelect(props: React.ComponentProps<typeof Select> = {}) {
  return render(
    <Select aria-label="Choice" {...props}>
      <option value="a">A</option>
      <option value="b">B</option>
    </Select>
  );
}

describe("Select", () => {
  it("renders its options", () => {
    renderSelect();
    expect(screen.getByRole("combobox", { name: "Choice" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "A" })).toBeInTheDocument();
  });

  it("forwards the ref to the underlying select element", () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <Select aria-label="Choice" ref={ref}>
        <option value="a">A</option>
      </Select>
    );
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it("sets aria-invalid when invalid is true", () => {
    renderSelect({ invalid: true });
    expect(screen.getByRole("combobox", { name: "Choice" })).toHaveAttribute("aria-invalid", "true");
  });

  it("respects the disabled attribute", () => {
    renderSelect({ disabled: true });
    expect(screen.getByRole("combobox", { name: "Choice" })).toBeDisabled();
  });
});
