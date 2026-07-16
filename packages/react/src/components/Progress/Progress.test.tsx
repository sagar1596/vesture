import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./Progress";

describe("Progress", () => {
  it("sets aria-valuenow for a determinate value", () => {
    render(<Progress value={40} label="Uploading" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  });

  it("omits aria-valuenow when indeterminate", () => {
    render(<Progress label="Loading" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });

  it("shows a percentage label for determinate values", () => {
    render(<Progress value={25} label="Uploading" />);
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("respects a custom max", () => {
    render(<Progress value={5} max={10} label="Steps" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemax", "10");
    expect(bar).toHaveAttribute("aria-valuenow", "5");
  });
});
