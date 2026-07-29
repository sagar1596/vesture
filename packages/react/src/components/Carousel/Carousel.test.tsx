import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Carousel } from "./Carousel";

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
      dispatchEvent: vi.fn(),
    })),
  });
}

function slides(): string[] {
  return ["Slide 1", "Slide 2", "Slide 3"];
}

describe("Carousel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders all slides and shows the first one active", () => {
    render(
      <Carousel>
        {slides().map((s) => (
          <div key={s}>{s}</div>
        ))}
      </Carousel>
    );
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
    expect(screen.getByText("Slide 3")).toBeInTheDocument();
  });

  it("arrow clicks advance and retreat the active slide", () => {
    render(
      <Carousel>
        {slides().map((s) => (
          <div key={s}>{s}</div>
        ))}
      </Carousel>
    );

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(screen.getByText("Slide 2").parentElement).toHaveAttribute("aria-hidden", "false");

    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByText("Slide 1").parentElement).toHaveAttribute("aria-hidden", "false");
  });

  it("wraps at boundaries when loop is true", () => {
    render(
      <Carousel loop>
        {slides().map((s) => (
          <div key={s}>{s}</div>
        ))}
      </Carousel>
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(screen.getByText("Slide 3").parentElement).toHaveAttribute("aria-hidden", "false");
  });

  it("stops at boundaries when loop is false", () => {
    render(
      <Carousel loop={false}>
        {slides().map((s) => (
          <div key={s}>{s}</div>
        ))}
      </Carousel>
    );

    const prevButton = screen.getByRole("button", { name: "Previous slide" });
    expect(prevButton).toBeDisabled();
    fireEvent.click(prevButton);
    expect(screen.getByText("Slide 1").parentElement).toHaveAttribute("aria-hidden", "false");
  });

  it("dots jump to the correct slide", () => {
    render(
      <Carousel>
        {slides().map((s) => (
          <div key={s}>{s}</div>
        ))}
      </Carousel>
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(screen.getByText("Slide 3").parentElement).toHaveAttribute("aria-hidden", "false");
  });

  it("hides arrows and dots when disabled", () => {
    render(
      <Carousel showArrows={false} showDots={false}>
        {slides().map((s) => (
          <div key={s}>{s}</div>
        ))}
      </Carousel>
    );
    expect(screen.queryByRole("button", { name: "Next slide" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Go to slide 1" })).not.toBeInTheDocument();
  });

  describe("autoPlay", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("advances on a timer", () => {
      render(
        <Carousel autoPlay autoPlayInterval={1000}>
          {slides().map((s) => (
            <div key={s}>{s}</div>
          ))}
        </Carousel>
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText("Slide 2").parentElement).toHaveAttribute("aria-hidden", "false");
    });

    it("pauses on hover and does not advance", () => {
      const { container } = render(
        <Carousel autoPlay autoPlayInterval={1000}>
          {slides().map((s) => (
            <div key={s}>{s}</div>
          ))}
        </Carousel>
      );

      fireEvent.mouseEnter(container.firstElementChild!);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByText("Slide 1").parentElement).toHaveAttribute("aria-hidden", "false");
    });

    it("disables autoPlay entirely under prefers-reduced-motion", () => {
      mockMatchMedia(true);
      render(
        <Carousel autoPlay autoPlayInterval={1000}>
          {slides().map((s) => (
            <div key={s}>{s}</div>
          ))}
        </Carousel>
      );

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText("Slide 1").parentElement).toHaveAttribute("aria-hidden", "false");
    });
  });
});
