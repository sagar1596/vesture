// Pure geometry helpers, split out from ImageCropper.tsx for the same reason
// scheduler-layout.ts/kanban-dnd.ts are split from their components: the math
// is independently unit-testable without mounting a component or mocking
// pointer events.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

/** Moves the crop rect by (dx, dy), clamped so it never leaves the image bounds. */
export function moveCropRect(rect: Rect, dx: number, dy: number, bounds: Size): Rect {
  const maxX = Math.max(0, bounds.width - rect.width);
  const maxY = Math.max(0, bounds.height - rect.height);
  return {
    ...rect,
    x: clamp(rect.x + dx, 0, maxX),
    y: clamp(rect.y + dy, 0, maxY)
  };
}

/**
 * Centered crop rect sized to a 90% inset of the displayed image, respecting
 * aspectRatio when locked. Used both on initial image load and whenever the
 * displayed size changes enough that the previous crop no longer fits.
 */
export function computeInitialCropRect(display: Size, aspectRatio: number | undefined, minCropSize: number): Rect {
  if (display.width <= 0 || display.height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const margin = 0.1;
  let width = display.width * (1 - margin * 2);
  let height = display.height * (1 - margin * 2);
  if (aspectRatio) {
    if (width / aspectRatio <= height) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }
  }
  width = clamp(width, Math.min(minCropSize, display.width), display.width);
  height = clamp(height, Math.min(minCropSize, display.height), display.height);
  return {
    x: (display.width - width) / 2,
    y: (display.height - height) / 2,
    width,
    height
  };
}

const TOUCHES_LEFT: ResizeHandle[] = ["w", "nw", "sw"];
const TOUCHES_RIGHT: ResizeHandle[] = ["e", "ne", "se"];
const TOUCHES_TOP: ResizeHandle[] = ["n", "nw", "ne"];
const TOUCHES_BOTTOM: ResizeHandle[] = ["s", "sw", "se"];
const CORNER_HANDLES: ResizeHandle[] = ["nw", "ne", "sw", "se"];

/**
 * Resizes startRect by dragging `handle` by (dx, dy) from the drag's start
 * position, clamped to minSize and to `bounds`. When aspectRatio is set, the
 * edge(s) not touched by the handle are re-derived to preserve the ratio
 * rather than left independent — see the per-handle-type branches below.
 */
export function resizeCropRect(
  startRect: Rect,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  bounds: Size,
  minSize: number,
  aspectRatio?: number
): Rect {
  const touchesLeft = TOUCHES_LEFT.includes(handle);
  const touchesRight = TOUCHES_RIGHT.includes(handle);
  const touchesTop = TOUCHES_TOP.includes(handle);
  const touchesBottom = TOUCHES_BOTTOM.includes(handle);

  let left = startRect.x;
  let right = startRect.x + startRect.width;
  let top = startRect.y;
  let bottom = startRect.y + startRect.height;

  if (touchesLeft) left = clamp(left + dx, 0, right - minSize);
  if (touchesRight) right = clamp(right + dx, left + minSize, bounds.width);
  if (touchesTop) top = clamp(top + dy, 0, bottom - minSize);
  if (touchesBottom) bottom = clamp(bottom + dy, top + minSize, bounds.height);

  let width = right - left;
  let height = bottom - top;

  if (aspectRatio) {
    if (CORNER_HANDLES.includes(handle)) {
      // Diagonal drag: follow whichever axis moved further proportionally,
      // rather than always privileging width.
      const widthChange = Math.abs(width / startRect.width - 1);
      const heightChange = Math.abs(height / startRect.height - 1);
      if (widthChange >= heightChange) {
        height = width / aspectRatio;
      } else {
        width = height * aspectRatio;
      }
    } else if (touchesTop || touchesBottom) {
      // Pure vertical handle: derive width from the new height and re-center
      // horizontally, since neither the left nor right edge was dragged.
      width = height * aspectRatio;
    } else {
      // Pure horizontal handle: derive height from the new width, re-center
      // vertically.
      height = width / aspectRatio;
    }

    if (touchesLeft) {
      left = right - width;
    } else if (touchesRight) {
      right = left + width;
    } else {
      const centerX = startRect.x + startRect.width / 2;
      left = centerX - width / 2;
      right = centerX + width / 2;
    }
    if (touchesTop) {
      top = bottom - height;
    } else if (touchesBottom) {
      bottom = top + height;
    } else {
      const centerY = startRect.y + startRect.height / 2;
      top = centerY - height / 2;
      bottom = centerY + height / 2;
    }

    // Pull the whole rect back inside bounds without breaking the ratio.
    if (left < 0) {
      right -= left;
      left = 0;
    }
    if (top < 0) {
      bottom -= top;
      top = 0;
    }
    if (right > bounds.width) {
      left -= right - bounds.width;
      right = bounds.width;
    }
    if (bottom > bounds.height) {
      top -= bottom - bounds.height;
      bottom = bounds.height;
    }
    left = clamp(left, 0, bounds.width);
    top = clamp(top, 0, bounds.height);
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}

/** Maps a rect in displayed (on-screen, CSS px) image coordinates to the source image's native pixel coordinates. */
export function mapDisplayRectToNatural(rect: Rect, display: Size, natural: Size): Rect {
  const scaleX = display.width === 0 ? 0 : natural.width / display.width;
  const scaleY = display.height === 0 ? 0 : natural.height / display.height;
  return {
    x: Math.round(rect.x * scaleX),
    y: Math.round(rect.y * scaleY),
    width: Math.round(rect.width * scaleX),
    height: Math.round(rect.height * scaleY)
  };
}

export const RESIZE_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
export const CORNER_RESIZE_HANDLES: ResizeHandle[] = CORNER_HANDLES;

export function cursorForHandle(handle: ResizeHandle): string {
  switch (handle) {
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    default:
      return "move";
  }
}
