import { createRef } from "react";
import type { ComponentProps } from "react";
import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImageCropper } from "./ImageCropper";
import type { ImageCropperHandle } from "./types";

// jsdom never actually decodes/loads the `src`, so naturalWidth/naturalHeight
// and layout (getBoundingClientRect) are all 0 by default. Stub them to
// simulate a 2000x1000 source image displayed at 400x200 CSS px (a 5x
// downscale) — the exact scenario the "native resolution, not display
// resolution" requirement is about.
const NATURAL_SIZE = { width: 2000, height: 1000 };
const DISPLAY_SIZE = { width: 400, height: 200 };

function installImageMocks() {
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
    configurable: true,
    get: () => NATURAL_SIZE.width
  });
  Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", {
    configurable: true,
    get: () => NATURAL_SIZE.height
  });
  vi.spyOn(HTMLImageElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: DISPLAY_SIZE.width,
    bottom: DISPLAY_SIZE.height,
    width: DISPLAY_SIZE.width,
    height: DISPLAY_SIZE.height,
    toJSON: () => ({})
  });
}

interface MockCanvasCall {
  width: number;
  height: number;
  drawImageArgs: unknown[];
}

function installCanvasMock(): MockCanvasCall[] {
  const calls: MockCanvasCall[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (
    this: HTMLCanvasElement
  ) {
    const ctx = {
      drawImage: (...args: unknown[]) => {
        calls.push({ width: this.width, height: this.height, drawImageArgs: args });
      }
    };
    return ctx as unknown as CanvasRenderingContext2D;
  });
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,MOCKED");
  return calls;
}

function renderLoaded(props: Partial<ComponentProps<typeof ImageCropper>> = {}) {
  const ref = createRef<ImageCropperHandle>();
  const utils = render(<ImageCropper ref={ref} src="test.png" {...props} />);
  const imgEl = utils.container.querySelector("img")!;
  fireEvent.load(imgEl);
  return { ...utils, ref, imgEl };
}

function getCropRectEl(container: HTMLElement): HTMLElement {
  return container.querySelector('[role="group"]') as HTMLElement;
}

describe("ImageCropper", () => {
  beforeEach(() => {
    installImageMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes a centered crop rect within the displayed image bounds", () => {
    const { container } = renderLoaded();
    const rectEl = getCropRectEl(container);
    const left = parseFloat(rectEl.style.left);
    const top = parseFloat(rectEl.style.top);
    const width = parseFloat(rectEl.style.width);
    const height = parseFloat(rectEl.style.height);

    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left + width).toBeLessThanOrEqual(DISPLAY_SIZE.width);
    expect(top + height).toBeLessThanOrEqual(DISPLAY_SIZE.height);
  });

  it("dragging the crop rect moves it, clamped so it cannot leave the image bounds", () => {
    const { container } = renderLoaded();
    const rectEl = getCropRectEl(container);
    const startLeft = parseFloat(rectEl.style.left);
    const startTop = parseFloat(rectEl.style.top);

    fireEvent.pointerDown(rectEl, { pointerId: 1, clientX: 50, clientY: 50 });
    fireEvent.pointerMove(rectEl, { pointerId: 1, clientX: 70, clientY: 65 });
    fireEvent.pointerUp(rectEl, { pointerId: 1, clientX: 70, clientY: 65 });

    expect(parseFloat(rectEl.style.left)).toBeCloseTo(startLeft + 20);
    expect(parseFloat(rectEl.style.top)).toBeCloseTo(startTop + 15);

    // Now drag it far past the right/bottom edge of the image — it must clamp,
    // not travel outside [0, displaySize] bounds.
    fireEvent.pointerDown(rectEl, { pointerId: 2, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(rectEl, { pointerId: 2, clientX: 10000, clientY: 10000 });
    fireEvent.pointerUp(rectEl, { pointerId: 2, clientX: 10000, clientY: 10000 });

    const left = parseFloat(rectEl.style.left);
    const top = parseFloat(rectEl.style.top);
    const width = parseFloat(rectEl.style.width);
    const height = parseFloat(rectEl.style.height);
    expect(left + width).toBeLessThanOrEqual(DISPLAY_SIZE.width + 0.01);
    expect(top + height).toBeLessThanOrEqual(DISPLAY_SIZE.height + 0.01);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(top).toBeGreaterThanOrEqual(0);

    // And past the top-left edge.
    fireEvent.pointerDown(rectEl, { pointerId: 3, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(rectEl, { pointerId: 3, clientX: -10000, clientY: -10000 });
    fireEvent.pointerUp(rectEl, { pointerId: 3, clientX: -10000, clientY: -10000 });
    expect(parseFloat(rectEl.style.left)).toBe(0);
    expect(parseFloat(rectEl.style.top)).toBe(0);
  });

  it("resizing via a corner handle respects minCropSize", () => {
    const { container } = renderLoaded({ minCropSize: 30 });
    const rectEl = getCropRectEl(container);
    const handleEl = rectEl.querySelector('[data-handle="se"]') as HTMLElement;

    const startLeft = parseFloat(rectEl.style.left);
    const startTop = parseFloat(rectEl.style.top);

    // Drag the bottom-right handle far up and to the left — enough to try to
    // shrink the rect to nothing.
    fireEvent.pointerDown(handleEl, { pointerId: 1, clientX: 1000, clientY: 1000 });
    fireEvent.pointerMove(handleEl, { pointerId: 1, clientX: -1000, clientY: -1000 });
    fireEvent.pointerUp(handleEl, { pointerId: 1, clientX: -1000, clientY: -1000 });

    const width = parseFloat(rectEl.style.width);
    const height = parseFloat(rectEl.style.height);
    expect(width).toBeGreaterThanOrEqual(30);
    expect(height).toBeGreaterThanOrEqual(30);
    // The top-left anchor (opposite the se handle) should not have moved.
    expect(parseFloat(rectEl.style.left)).toBeCloseTo(startLeft);
    expect(parseFloat(rectEl.style.top)).toBeCloseTo(startTop);
  });

  it("resizing with aspectRatio locked preserves the ratio", () => {
    const { container } = renderLoaded({ aspectRatio: 2 });
    const rectEl = getCropRectEl(container);
    const handleEl = rectEl.querySelector('[data-handle="se"]') as HTMLElement;

    fireEvent.pointerDown(handleEl, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(handleEl, { pointerId: 1, clientX: 40, clientY: 5 });
    fireEvent.pointerUp(handleEl, { pointerId: 1, clientX: 40, clientY: 5 });

    const width = parseFloat(rectEl.style.width);
    const height = parseFloat(rectEl.style.height);
    expect(width / height).toBeCloseTo(2, 5);
  });

  it("only renders corner handles when aspectRatio is locked (no edge handles to break the ratio)", () => {
    const { container } = renderLoaded({ aspectRatio: 1 });
    const rectEl = getCropRectEl(container);
    expect(rectEl.querySelectorAll("[data-handle]").length).toBe(4);
    expect(rectEl.querySelector('[data-handle="n"]')).toBeNull();
  });

  it("renders all 8 handles in freeform mode", () => {
    const { container } = renderLoaded();
    const rectEl = getCropRectEl(container);
    expect(rectEl.querySelectorAll("[data-handle]").length).toBe(8);
  });

  it("getCroppedImage() renders at the source image's native resolution, not its display resolution", () => {
    const calls = installCanvasMock();
    const onCropComplete = vi.fn();
    const { ref } = renderLoaded({ onCropComplete });

    // Displayed 400x200, natural 2000x1000 -> a 5x scale factor in both axes.
    // The default initial crop is a centered 80%-inset rect: 320x160 CSS px
    // at (40, 20), which maps to 1600x800 native px at (200, 100).
    const dataUrl = ref.current!.getCroppedImage();

    expect(dataUrl).toBe("data:image/png;base64,MOCKED");
    expect(onCropComplete).toHaveBeenCalledWith("data:image/png;base64,MOCKED");
    expect(calls).toHaveLength(1);

    const call = calls[0]!;
    // The canvas must be sized to the native crop region, not the 320x160
    // on-screen size.
    expect(call.width).toBe(1600);
    expect(call.height).toBe(800);
    expect(call.width).not.toBe(320);
    expect(call.height).not.toBe(160);

    // drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    const [, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight] = call.drawImageArgs;
    expect(sx).toBe(200);
    expect(sy).toBe(100);
    expect(sWidth).toBe(1600);
    expect(sHeight).toBe(800);
    expect(dx).toBe(0);
    expect(dy).toBe(0);
    expect(dWidth).toBe(1600);
    expect(dHeight).toBe(800);
  });

  it("getCroppedImage() output resolution scales with a resized crop rect", () => {
    const calls = installCanvasMock();
    const { container, ref } = renderLoaded();
    const rectEl = getCropRectEl(container);
    const handleEl = rectEl.querySelector('[data-handle="se"]') as HTMLElement;

    // Shrink the crop rect by 40 display px in both axes -> 200 native px (5x scale).
    fireEvent.pointerDown(handleEl, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(handleEl, { pointerId: 1, clientX: -40, clientY: -40 });
    fireEvent.pointerUp(handleEl, { pointerId: 1, clientX: -40, clientY: -40 });

    const displayWidth = parseFloat(rectEl.style.width);
    const displayHeight = parseFloat(rectEl.style.height);

    ref.current!.getCroppedImage();

    const call = calls[0]!;
    expect(call.width).toBe(Math.round(displayWidth * 5));
    expect(call.height).toBe(Math.round(displayHeight * 5));
  });

  it("does not fire onCropComplete on drag/resize alone, only when getCroppedImage() is called", () => {
    const onCropComplete = vi.fn();
    const { container } = renderLoaded({ onCropComplete });
    const rectEl = getCropRectEl(container);

    fireEvent.pointerDown(rectEl, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(rectEl, { pointerId: 1, clientX: 20, clientY: 20 });
    fireEvent.pointerUp(rectEl, { pointerId: 1, clientX: 20, clientY: 20 });

    expect(onCropComplete).not.toHaveBeenCalled();
  });
});
