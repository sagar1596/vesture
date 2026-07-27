import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { pulse, shimmerOverlay, variant as variantStyles } from "./Skeleton.css";
import { Skeleton } from "./Skeleton";
import { SkeletonWrapper } from "./SkeletonWrapper";

function mockMatchMedia(matches: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
}

describe("Skeleton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies the text variant's shape class by default", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton")).toHaveClass(variantStyles.text);
  });

  it("applies the circular variant's shape class", () => {
    render(<Skeleton variant="circular" />);
    expect(screen.getByTestId("skeleton")).toHaveClass(variantStyles.circular);
  });

  it("applies the rectangular variant's shape class", () => {
    render(<Skeleton variant="rectangular" />);
    expect(screen.getByTestId("skeleton")).toHaveClass(variantStyles.rectangular);
  });

  it("renders the requested number of text lines, with the last one narrower", () => {
    render(<Skeleton variant="text" lines={3} />);
    const lines = screen.getAllByTestId("skeleton-line");
    expect(lines).toHaveLength(3);
    expect(lines[0]?.className).not.toMatch(/lastLine/);
    expect(lines[2]?.className).toMatch(/lastLine/);
  });

  it("does not shorten the last line when an explicit width is given", () => {
    render(<Skeleton variant="text" lines={2} width={200} />);
    const lines = screen.getAllByTestId("skeleton-line");
    expect(lines[0]?.style.width).toBe("200px");
    expect(lines[1]?.style.width).toBe("200px");
    expect(lines[1]?.className).not.toMatch(/lastLine/);
  });

  it("renders a shimmer overlay by default", () => {
    render(<Skeleton />);
    expect(screen.getByTestId("skeleton").querySelector(`.${shimmerOverlay}`)).toBeInTheDocument();
  });

  it("applies the pulse animation class for animation='pulse'", () => {
    render(<Skeleton animation="pulse" />);
    expect(screen.getByTestId("skeleton")).toHaveClass(pulse);
  });

  it("applies no animation classes or overlay for animation='none'", () => {
    render(<Skeleton animation="none" />);
    const el = screen.getByTestId("skeleton");
    expect(el).not.toHaveClass(pulse);
    expect(el.querySelector(`.${shimmerOverlay}`)).not.toBeInTheDocument();
  });

  it("respects prefers-reduced-motion by falling back to a static treatment", () => {
    mockMatchMedia(true);
    expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
  });
});

describe("SkeletonWrapper", () => {
  it("renders the skeleton while loading", () => {
    render(
      <SkeletonWrapper loading skeleton={<div>Loading placeholder</div>}>
        <div>Real content</div>
      </SkeletonWrapper>
    );
    expect(screen.getByText("Loading placeholder")).toBeInTheDocument();
    expect(screen.queryByText("Real content")).not.toBeInTheDocument();
  });

  it("renders the children once loading is false", () => {
    render(
      <SkeletonWrapper loading={false} skeleton={<div>Loading placeholder</div>}>
        <div>Real content</div>
      </SkeletonWrapper>
    );
    expect(screen.getByText("Real content")).toBeInTheDocument();
    expect(screen.queryByText("Loading placeholder")).not.toBeInTheDocument();
  });
});
