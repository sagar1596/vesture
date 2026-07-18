import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "./Slider";

describe("Slider", () => {
  it("renders a single thumb with correct ARIA attributes", () => {
    render(<Slider aria-label="Volume" value={30} min={0} max={100} />);
    const thumb = screen.getByRole("slider", { name: "Volume" });
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "100");
    expect(thumb).toHaveAttribute("aria-valuenow", "30");
  });

  it("increments and decrements with arrow keys", () => {
    const onChange = vi.fn();
    render(<Slider aria-label="Volume" value={30} step={5} onChange={onChange} />);
    const thumb = screen.getByRole("slider", { name: "Volume" });
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(35);
    fireEvent.keyDown(thumb, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith(25);
  });

  it("jumps to min/max on Home/End", () => {
    const onChange = vi.fn();
    render(<Slider aria-label="Volume" value={30} min={0} max={100} onChange={onChange} />);
    const thumb = screen.getByRole("slider", { name: "Volume" });
    fireEvent.keyDown(thumb, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(100);
    fireEvent.keyDown(thumb, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("clamps within min/max", () => {
    const onChange = vi.fn();
    render(<Slider aria-label="Volume" value={100} max={100} onChange={onChange} />);
    const thumb = screen.getByRole("slider", { name: "Volume" });
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it("renders two thumbs in range mode and keeps start <= end", () => {
    const onChange = vi.fn();
    render(<Slider aria-label={["Min", "Max"]} value={[20, 80]} onChange={onChange} />);
    const thumbs = screen.getAllByRole("slider");
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute("aria-valuenow", "20");
    expect(thumbs[1]).toHaveAttribute("aria-valuenow", "80");

    fireEvent.keyDown(thumbs[0]!, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith([80, 80]);
  });

  it("does not respond to keyboard input when disabled", () => {
    const onChange = vi.fn();
    render(<Slider aria-label="Volume" value={30} onChange={onChange} disabled />);
    const thumb = screen.getByRole("slider", { name: "Volume" });
    fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(onChange).not.toHaveBeenCalled();
    expect(thumb).toHaveAttribute("tabindex", "-1");
  });
});
