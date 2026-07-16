import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";
import { button, variant } from "./Button.css";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies the primary variant class by default", () => {
    render(<Button>Primary</Button>);
    const el = screen.getByRole("button", { name: "Primary" });
    expect(el.className).toContain(button);
    expect(el.className).toContain(variant.primary);
  });

  it("applies the requested variant class", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const el = screen.getByRole("button", { name: "Ghost" });
    expect(el.className).toContain(variant.ghost);
    expect(el.className).not.toContain(variant.primary);
  });

  it("forwards the ref to the underlying button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe("Ref");
  });

  it("respects the disabled attribute", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });
});
