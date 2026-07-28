import { createRef } from "react";
import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignaturePad } from "./SignaturePad";
import type { SignaturePadHandle } from "./types";

// jsdom doesn't implement a real 2D canvas rendering context — getContext("2d")
// returns null there. We only need to verify SignaturePad's *behavioral*
// wiring (does isEmpty flip, does onChange fire with the right shape of
// value), not actual pixel output, so a stub context with no-op drawing
// methods is enough — no need for the native `canvas` package as a test
// dependency.
function installCanvasMock() {
  const ctx = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 0,
    lineJoin: "round",
    lineCap: "round"
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,MOCKED"
  );
  return ctx;
}

function drawStroke(canvasEl: HTMLCanvasElement) {
  fireEvent.pointerDown(canvasEl, { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(canvasEl, { pointerId: 1, clientX: 20, clientY: 20 });
  fireEvent.pointerMove(canvasEl, { pointerId: 1, clientX: 30, clientY: 15 });
  fireEvent.pointerUp(canvasEl, { pointerId: 1, clientX: 30, clientY: 15 });
}

describe("SignaturePad", () => {
  beforeEach(() => {
    installCanvasMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("drawing a stroke flips isEmpty to false and fires onChange with a non-null data URL", () => {
    const onChange = vi.fn();
    const ref = createRef<SignaturePadHandle>();
    const { container } = render(<SignaturePad ref={ref} onChange={onChange} />);
    const canvasEl = container.querySelector("canvas")!;

    expect(ref.current?.isEmpty()).toBe(true);

    drawStroke(canvasEl);

    expect(ref.current?.isEmpty()).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("data:image/png;base64,MOCKED");
  });

  it("registers a tap with no movement as content (draws a dot)", () => {
    const onChange = vi.fn();
    const ref = createRef<SignaturePadHandle>();
    const { container } = render(<SignaturePad ref={ref} onChange={onChange} />);
    const canvasEl = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvasEl, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(canvasEl, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(ref.current?.isEmpty()).toBe(false);
    expect(onChange).toHaveBeenCalledWith("data:image/png;base64,MOCKED");
  });

  it("clear() resets isEmpty to true and fires onChange(null)", () => {
    const onChange = vi.fn();
    const ref = createRef<SignaturePadHandle>();
    const { container } = render(<SignaturePad ref={ref} onChange={onChange} />);
    const canvasEl = container.querySelector("canvas")!;

    drawStroke(canvasEl);
    expect(ref.current?.isEmpty()).toBe(false);

    ref.current?.clear();

    expect(ref.current?.isEmpty()).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("clicking the built-in Clear button clears the pad", () => {
    const onChange = vi.fn();
    const ref = createRef<SignaturePadHandle>();
    const { container, getByRole } = render(<SignaturePad ref={ref} onChange={onChange} />);
    const canvasEl = container.querySelector("canvas")!;

    drawStroke(canvasEl);
    expect(ref.current?.isEmpty()).toBe(false);

    fireEvent.click(getByRole("button", { name: "Clear" }));

    expect(ref.current?.isEmpty()).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("omits the Clear button when showClearButton is false", () => {
    const { queryByRole } = render(<SignaturePad showClearButton={false} />);
    expect(queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
  });

  it("disabled prevents drawing entirely", () => {
    const onChange = vi.fn();
    const ref = createRef<SignaturePadHandle>();
    const { container } = render(<SignaturePad ref={ref} onChange={onChange} disabled />);
    const canvasEl = container.querySelector("canvas")!;

    drawStroke(canvasEl);

    expect(ref.current?.isEmpty()).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("toDataURL returns the canvas data URL", () => {
    const ref = createRef<SignaturePadHandle>();
    render(<SignaturePad ref={ref} />);
    expect(ref.current?.toDataURL()).toBe("data:image/png;base64,MOCKED");
  });

  it("exposes an accessible name on the canvas", () => {
    const { getByRole } = render(<SignaturePad aria-label="Sign here" />);
    expect(getByRole("img", { name: "Sign here" })).toBeInTheDocument();
  });
});
