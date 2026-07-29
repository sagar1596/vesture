import { useEffect, useState } from "react";
import type { FocusEvent as ReactFocusEvent, KeyboardEvent as ReactKeyboardEvent, ReactElement, ReactNode } from "react";
import { arrowButton, dot, dots, root, slide, track, viewport } from "./Carousel.css";

export interface CarouselProps {
  children: ReactNode[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  loop?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
}

function nextIndex(current: number, length: number, loop: boolean): number {
  if (current < length - 1) return current + 1;
  return loop ? 0 : current;
}

function prevIndex(current: number, length: number, loop: boolean): number {
  if (current > 0) return current - 1;
  return loop ? length - 1 : current;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Carousel({
  children,
  autoPlay = false,
  autoPlayInterval = 5000,
  loop = true,
  showArrows = true,
  showDots = true,
  className,
}: CarouselProps): ReactElement {
  const length = children.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;

  useEffect(() => {
    if (!autoPlay || paused || length <= 1) return;
    if (prefersReducedMotion()) return;

    const id = setInterval(() => {
      setActiveIndex((current) => nextIndex(current, length, loop));
    }, autoPlayInterval);

    return () => clearInterval(id);
  }, [autoPlay, paused, autoPlayInterval, length, loop]);

  function goTo(index: number) {
    setActiveIndex(Math.max(0, Math.min(length - 1, index)));
  }

  function goNext() {
    setActiveIndex((current) => nextIndex(current, length, loop));
  }

  function goPrev() {
    setActiveIndex((current) => prevIndex(current, length, loop));
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  }

  function handleBlur(event: ReactFocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setFocused(false);
    }
  }

  return (
    <div
      className={[root, className].filter(Boolean).join(" ")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div className={viewport}>
        <div className={track} style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {children.map((child, index) => (
            <div key={index} className={slide} aria-hidden={index !== activeIndex}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows ? (
        <>
          <button
            type="button"
            className={arrowButton}
            data-side="prev"
            onClick={goPrev}
            disabled={!loop && activeIndex === 0}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            className={arrowButton}
            data-side="next"
            onClick={goNext}
            disabled={!loop && activeIndex === length - 1}
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      ) : null}

      {showDots ? (
        <div className={dots}>
          {children.map((_, index) => (
            <button
              key={index}
              type="button"
              className={dot}
              data-active={index === activeIndex || undefined}
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === activeIndex || undefined}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
