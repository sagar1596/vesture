import "@testing-library/jest-dom/vitest";

// jsdom has no ResizeObserver. @visx/responsive's ParentSize needs the constructor to exist,
// but charts under test rely on the `initialSize` prop for stable dimensions rather than real
// measurement, so this stub never needs to invoke its callback.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom has no PointerEvent, so @testing-library/dom's fireEvent.pointerDown/Move/Up fall
// back to the base Event constructor, which silently drops clientX/clientY/pointerId — every
// pointer-drag interaction test (Scheduler) would see `undefined` coordinates. MouseEvent
// carries clientX/clientY natively; this just layers pointerId/pointerType on top so
// setPointerCapture-adjacent code (which no-ops here, see catch blocks around it) has
// something to read.
if (typeof globalThis.PointerEvent === "undefined") {
  class PointerEventStub extends MouseEvent {
    public pointerId: number;
    public pointerType: string;
    public isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? "mouse";
      this.isPrimary = params.isPrimary ?? true;
    }
  }
  globalThis.PointerEvent = PointerEventStub as unknown as typeof PointerEvent;
}

if (typeof HTMLElement.prototype.setPointerCapture === "undefined") {
  HTMLElement.prototype.setPointerCapture = function setPointerCapture(): void {};
}
if (typeof HTMLElement.prototype.releasePointerCapture === "undefined") {
  HTMLElement.prototype.releasePointerCapture = function releasePointerCapture(): void {};
}
