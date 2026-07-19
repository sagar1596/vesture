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
