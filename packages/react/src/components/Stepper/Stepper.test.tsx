import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Stepper } from "./Stepper";
import type { StepItem } from "./types";

const steps: StepItem[] = [
  { id: "a", label: "Account" },
  { id: "b", label: "Profile" },
  { id: "c", label: "Review" }
];

describe("Stepper", () => {
  it("marks steps before activeStep as completed and activeStep as active", () => {
    render(<Stepper steps={steps} activeStep={1} />);
    expect(document.querySelectorAll('[data-state="completed"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-state="active"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-state="upcoming"]')).toHaveLength(1);
  });

  it("respects an explicit completedSteps override for non-linear completion", () => {
    render(<Stepper steps={steps} activeStep={1} completedSteps={new Set([0, 2])} />);
    expect(document.querySelectorAll('[data-state="completed"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-state="upcoming"]')).toHaveLength(0);
  });

  it("renders orientation as a data attribute for horizontal and vertical layouts", () => {
    const { container, rerender } = render(<Stepper steps={steps} activeStep={0} />);
    expect(container.firstChild).toHaveAttribute("data-orientation", "horizontal");
    rerender(<Stepper steps={steps} activeStep={0} orientation="vertical" />);
    expect(container.firstChild).toHaveAttribute("data-orientation", "vertical");
  });

  it("fires onStepClick only for completed and active steps, not upcoming", () => {
    const onStepClick = vi.fn();
    render(<Stepper steps={steps} activeStep={1} onStepClick={onStepClick} />);
    const buttons = screen.getAllByRole("button");
    // Only completed (index 0) and active (index 1) steps are buttons.
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]!);
    fireEvent.click(buttons[1]!);
    expect(onStepClick).toHaveBeenCalledWith(0);
    expect(onStepClick).toHaveBeenCalledWith(1);
    expect(onStepClick).toHaveBeenCalledTimes(2);
  });

  it("does not render upcoming steps as buttons even when onStepClick is provided", () => {
    render(<Stepper steps={steps} activeStep={0} onStepClick={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("is entirely non-interactive when onStepClick is omitted", () => {
    render(<Stepper steps={steps} activeStep={1} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
