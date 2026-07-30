import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorPicker } from "./ColorPicker";

interface FakeRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function mockRect(el: Element, rect: FakeRect) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({})
  });
}

async function openPicker() {
  const trigger = screen.getByRole("button", { name: "Color" });
  fireEvent.click(trigger);
  return screen.getByRole("group", { name: "Color" });
}

describe("ColorPicker", () => {
  it("renders a trigger swatch reflecting the current value", () => {
    render(<ColorPicker value="#2a78d6" />);
    const trigger = screen.getByRole("button", { name: "Color" });
    expect(trigger).toBeInTheDocument();
  });

  it("opens a popover with gradient square, hue strip, presets, and text input", async () => {
    render(<ColorPicker value="#2a78d6" />);
    const panel = await openPicker();
    expect(within(panel).getByRole("slider", { name: "Saturation and lightness" })).toBeInTheDocument();
    expect(within(panel).getByRole("slider", { name: "Hue" })).toBeInTheDocument();
    expect(within(panel).getByRole("group", { name: "Preset colors" })).toBeInTheDocument();
    expect(within(panel).getByLabelText("Color value (hex)")).toBeInTheDocument();
  });

  it("dragging the gradient square updates the value", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} />);
    const panel = await openPicker();
    const square = within(panel).getByRole("slider", { name: "Saturation and lightness" });
    mockRect(square, { left: 0, right: 200, top: 0, bottom: 100 });

    // Drag to top-left: saturation 0, lightness 100 -> white.
    fireEvent.pointerDown(square, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(square, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerUp(square, { pointerId: 1, clientX: 0, clientY: 0 });

    expect(onChange).toHaveBeenLastCalledWith("#ffffff");
  });

  it("dragging the hue strip updates the value", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} />);
    const panel = await openPicker();
    const hue = within(panel).getByRole("slider", { name: "Hue" });
    mockRect(hue, { left: 0, right: 360, top: 0, bottom: 12 });

    // Drag to x=120 -> hue 120 (pure green) at full saturation/lightness=50 (red's starting s/l).
    fireEvent.pointerDown(hue, { pointerId: 1, clientX: 120, clientY: 0 });
    fireEvent.pointerMove(hue, { pointerId: 1, clientX: 120, clientY: 0 });
    fireEvent.pointerUp(hue, { pointerId: 1, clientX: 120, clientY: 0 });

    expect(onChange).toHaveBeenLastCalledWith("#00ff00");
  });

  it("selects a preset color on click", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#000000" onChange={onChange} presets={["#123456"]} />);
    const panel = await openPicker();
    const preset = within(panel).getByRole("button", { name: "#123456" });
    fireEvent.click(preset);
    expect(onChange).toHaveBeenCalledWith("#123456");
  });

  it("typing a valid hex in the text input updates the value live", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#000000" onChange={onChange} />);
    const panel = await openPicker();
    const input = within(panel).getByLabelText("Color value (hex)") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "#ff00ff" } });
    expect(onChange).toHaveBeenLastCalledWith("#ff00ff");
  });

  it("reverts to the last valid value when invalid text is blurred", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#2a78d6" onChange={onChange} />);
    const panel = await openPicker();
    const input = within(panel).getByLabelText("Color value (hex)") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "not-a-color" } });
    fireEvent.blur(input);
    expect(input.value).toBe("#2a78d6");
    expect(onChange).not.toHaveBeenCalledWith("not-a-color");
  });

  it("supports rgb format for display and parsing", async () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#ff0000" onChange={onChange} format="rgb" />);
    const panel = await openPicker();
    const input = within(panel).getByLabelText("Color value (rgb)") as HTMLInputElement;
    expect(input.value).toBe("rgb(255, 0, 0)");
    fireEvent.change(input, { target: { value: "rgb(0, 255, 0)" } });
    expect(onChange).toHaveBeenLastCalledWith("#00ff00");
  });

  it("is controlled: external value changes update the displayed swatch/input", async () => {
    const { rerender } = render(<ColorPicker value="#2a78d6" />);
    let panel = await openPicker();
    let input = within(panel).getByLabelText("Color value (hex)") as HTMLInputElement;
    expect(input.value).toBe("#2a78d6");

    rerender(<ColorPicker value="#e34948" />);
    input = within(screen.getByRole("group", { name: "Color" })).getByLabelText("Color value (hex)") as HTMLInputElement;
    expect(input.value).toBe("#e34948");
  });
});
