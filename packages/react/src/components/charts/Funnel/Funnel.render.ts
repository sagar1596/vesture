export interface FunnelStage {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export interface FunnelSegment {
  stage: FunnelStage;
  /** Percent of the first stage. */
  percentOfTotal: number;
  /** Percent of the previous stage; null for the first. */
  percentOfPrevious: number | null;
  /** Top and bottom half-widths as 0..1 fractions of the available width. */
  topHalf: number;
  bottomHalf: number;
}

/**
 * Each segment's top edge matches its own value and its bottom edge tapers to the next stage's
 * value (the last stage keeps a straight edge), so the silhouette reads as one continuous funnel.
 */
export function buildFunnelSegments(stages: FunnelStage[]): FunnelSegment[] {
  const valid = stages.filter((s) => s.value >= 0);
  const first = valid[0]?.value ?? 0;
  if (valid.length === 0 || first <= 0) return [];
  return valid.map((stage, i) => {
    const next = valid[i + 1];
    const top = stage.value / first;
    return {
      stage,
      percentOfTotal: (stage.value / first) * 100,
      percentOfPrevious: i === 0 ? null : valid[i - 1]!.value > 0 ? (stage.value / valid[i - 1]!.value) * 100 : 0,
      topHalf: top / 2,
      bottomHalf: (next ? next.value / first : top) / 2
    };
  });
}
