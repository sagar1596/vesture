export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Places a card of `card` size next to `target` on the preferred side, flipping to the opposite
 * side when it would overflow, then clamping into the viewport.
 */
export function placeCard(
  target: Box,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
  placement: TourPlacement,
  gap = 12,
  margin = 12
): { top: number; left: number; placement: TourPlacement } {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  if (placement === "center") {
    return { top: (viewport.height - card.height) / 2, left: (viewport.width - card.width) / 2, placement };
  }
  const fits = (p: TourPlacement) => {
    if (p === "top") return target.top - gap - card.height >= margin;
    if (p === "bottom") return target.top + target.height + gap + card.height <= viewport.height - margin;
    if (p === "left") return target.left - gap - card.width >= margin;
    return target.left + target.width + gap + card.width <= viewport.width - margin;
  };
  const opposite: Record<Exclude<TourPlacement, "center">, TourPlacement> = { top: "bottom", bottom: "top", left: "right", right: "left" };
  let side: TourPlacement = placement;
  if (!fits(side)) {
    const flipped = opposite[placement];
    side = fits(flipped) ? flipped : (["bottom", "top", "right", "left"] as TourPlacement[]).find(fits) ?? placement;
  }
  const cx = target.left + target.width / 2 - card.width / 2;
  const cy = target.top + target.height / 2 - card.height / 2;
  let top: number;
  let left: number;
  if (side === "top") {
    top = target.top - gap - card.height;
    left = cx;
  } else if (side === "bottom") {
    top = target.top + target.height + gap;
    left = cx;
  } else if (side === "left") {
    top = cy;
    left = target.left - gap - card.width;
  } else {
    top = cy;
    left = target.left + target.width + gap;
  }
  return {
    top: clamp(top, margin, Math.max(margin, viewport.height - card.height - margin)),
    left: clamp(left, margin, Math.max(margin, viewport.width - card.width - margin)),
    placement: side
  };
}
