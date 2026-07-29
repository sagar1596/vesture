import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OTPInput } from "./OTPInput";

function getBoxes(): HTMLInputElement[] {
  return screen.getAllByRole("textbox") as HTMLInputElement[];
}

describe("OTPInput", () => {
  it("renders `length` boxes, defaulting to 6", () => {
    render(<OTPInput />);
    expect(getBoxes()).toHaveLength(6);
  });

  it("renders a custom length", () => {
    render(<OTPInput length={4} />);
    expect(getBoxes()).toHaveLength(4);
  });

  it("typing a valid character auto-advances focus to the next box", () => {
    render(<OTPInput length={4} />);
    const boxes = getBoxes();
    boxes[0]!.focus();
    fireEvent.change(boxes[0]!, { target: { value: "1" } });
    expect(document.activeElement).toBe(boxes[1]);
  });

  it("rejects characters that don't match a numeric type", () => {
    const onChange = vi.fn();
    render(<OTPInput length={4} onChange={onChange} />);
    const boxes = getBoxes();
    fireEvent.change(boxes[0]!, { target: { value: "a" } });
    expect(onChange).not.toHaveBeenCalled();
    expect(boxes[0]!.value).toBe("");
  });

  it("accepts letters and digits for alphanumeric type", () => {
    const onChange = vi.fn();
    render(<OTPInput length={4} type="alphanumeric" onChange={onChange} />);
    const boxes = getBoxes();
    fireEvent.change(boxes[0]!, { target: { value: "a" } });
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("backspace on an empty box moves focus to and clears the previous box", () => {
    const onChange = vi.fn();
    render(<OTPInput length={4} defaultValue="12" onChange={onChange} />);
    const boxes = getBoxes();
    boxes[2]!.focus();
    fireEvent.keyDown(boxes[2]!, { key: "Backspace" });
    expect(document.activeElement).toBe(boxes[1]);
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("arrow keys move focus between boxes without altering content", () => {
    const onChange = vi.fn();
    render(<OTPInput length={4} defaultValue="12" onChange={onChange} />);
    const boxes = getBoxes();
    boxes[1]!.focus();
    fireEvent.keyDown(boxes[1]!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(boxes[0]);
    fireEvent.keyDown(boxes[0]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(boxes[1]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("pasting a full-length code distributes characters across all boxes from the first", () => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    render(<OTPInput length={6} onChange={onChange} onComplete={onComplete} />);
    const boxes = getBoxes();
    boxes[3]!.focus();

    fireEvent.paste(boxes[3]!, {
      clipboardData: { getData: () => "123456" },
    });

    expect(onChange).toHaveBeenCalledWith("123456");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("onComplete fires exactly once when filled, not on every subsequent keystroke", () => {
    const onComplete = vi.fn();
    render(<OTPInput length={2} onComplete={onComplete} />);
    const boxes = getBoxes();
    fireEvent.change(boxes[0]!, { target: { value: "1" } });
    fireEvent.change(boxes[1]!, { target: { value: "2" } });
    expect(onComplete).toHaveBeenCalledTimes(1);

    boxes[1]!.focus();
    fireEvent.keyDown(boxes[1]!, { key: "Backspace" });
    fireEvent.change(boxes[1]!, { target: { value: "" } });
    fireEvent.change(boxes[1]!, { target: { value: "3" } });
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("respects a controlled value prop", () => {
    render(<OTPInput length={4} value="12" onChange={() => {}} />);
    const boxes = getBoxes();
    expect(boxes[0]!.value).toBe("1");
    expect(boxes[1]!.value).toBe("2");
    expect(boxes[2]!.value).toBe("");
  });
});
