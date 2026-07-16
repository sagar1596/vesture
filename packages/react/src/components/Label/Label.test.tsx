import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./Label";

describe("Label", () => {
  it("renders its children", () => {
    render(<Label htmlFor="field">Email</Label>);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("associates with a form field via htmlFor", () => {
    render(<Label htmlFor="field">Email</Label>);
    expect(screen.getByText("Email").closest("label")).toHaveAttribute("for", "field");
  });

  it("shows a required marker when required", () => {
    render(<Label required>Email</Label>);
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});
