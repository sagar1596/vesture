import { describe, expect, it } from "vitest";
import {
  combineDayAndMinutes,
  computeMoveResult,
  computeResizeResult,
  getVerticalMetrics,
  hashStringToIndex,
  layoutOverlappingEvents,
  minutesOfDay,
  pixelDeltaToSnappedMinutes,
  SLOT_HEIGHT_PX,
} from "./scheduler-layout";

function d(hour: number, minute = 0): Date {
  return new Date(2050, 0, 3, hour, minute);
}

function dayOnly(dayOfMonth: number): Date {
  return new Date(2050, 0, dayOfMonth);
}

describe("layoutOverlappingEvents", () => {
  it("returns an empty array for no events", () => {
    expect(layoutOverlappingEvents([])).toEqual([]);
  });

  it("gives a single event its own column", () => {
    const result = layoutOverlappingEvents([
      { id: "a", start: d(9), end: d(10) },
    ]);
    expect(result).toEqual([{ id: "a", columnIndex: 0, columnCount: 1 }]);
  });

  it("places two overlapping events side by side", () => {
    const result = layoutOverlappingEvents([
      { id: "a", start: d(9), end: d(10) },
      { id: "b", start: d(9, 30), end: d(10, 30) },
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));
    expect(byId.a!.columnCount).toBe(2);
    expect(byId.b!.columnCount).toBe(2);
    expect(byId.a!.columnIndex).not.toBe(byId.b!.columnIndex);
  });

  it("clusters a three-way chain via a bridging event, even though the outer two don't directly overlap", () => {
    // a: 9-10, b: 9:30-10:30 (bridges a and c), c: 10:15-11
    const result = layoutOverlappingEvents([
      { id: "a", start: d(9), end: d(10) },
      { id: "b", start: d(9, 30), end: d(10, 30) },
      { id: "c", start: d(10, 15), end: d(11) },
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));
    // All three belong to one cluster and must share the same column count. a and c don't
    // directly overlap (a ends 10:00, c starts 10:15) so the greedy packer reuses a's column
    // for c, needing only 2 columns total for the cluster.
    expect(byId.a!.columnCount).toBe(2);
    expect(byId.b!.columnCount).toBe(2);
    expect(byId.c!.columnCount).toBe(2);
    expect(byId.a!.columnIndex).toBe(byId.c!.columnIndex);
    expect(byId.b!.columnIndex).not.toBe(byId.a!.columnIndex);
  });

  it("keeps disjoint clusters independent", () => {
    const result = layoutOverlappingEvents([
      { id: "a", start: d(9), end: d(10) },
      { id: "b", start: d(9, 30), end: d(10, 30) },
      { id: "c", start: d(14), end: d(15) },
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));
    expect(byId.a!.columnCount).toBe(2);
    expect(byId.b!.columnCount).toBe(2);
    expect(byId.c!.columnCount).toBe(1);
    expect(byId.c!.columnIndex).toBe(0);
  });

  it("handles fully nested events by reusing a freed column where possible", () => {
    // a: 9-17 (spans everything), b: 10-11, c: 12-13 — b and c don't overlap each other,
    // so they can share a column once b has ended, giving a total of 2 columns.
    const result = layoutOverlappingEvents([
      { id: "a", start: d(9), end: d(17) },
      { id: "b", start: d(10), end: d(11) },
      { id: "c", start: d(12), end: d(13) },
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));
    expect(byId.a!.columnCount).toBe(2);
    expect(byId.a!.columnIndex).toBe(0);
    expect(byId.b!.columnIndex).toBe(1);
    expect(byId.c!.columnIndex).toBe(1);
  });

  it("does not treat back-to-back non-overlapping events as overlapping", () => {
    const result = layoutOverlappingEvents([
      { id: "a", start: d(9), end: d(10) },
      { id: "b", start: d(10), end: d(11) },
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.id, r]));
    expect(byId.a!.columnCount).toBe(1);
    expect(byId.b!.columnCount).toBe(1);
    expect(byId.a!.columnIndex).toBe(0);
    expect(byId.b!.columnIndex).toBe(0);
  });

  it("preserves the input order in its return array", () => {
    const input = [
      { id: "c", start: d(14), end: d(15) },
      { id: "a", start: d(9), end: d(10) },
      { id: "b", start: d(9, 30), end: d(10, 30) },
    ];
    const result = layoutOverlappingEvents(input);
    expect(result.map((r) => r.id)).toEqual(["c", "a", "b"]);
  });

  it("handles a dense four-way overlap needing four columns", () => {
    const result = layoutOverlappingEvents([
      { id: "a", start: d(9), end: d(11) },
      { id: "b", start: d(9), end: d(11) },
      { id: "c", start: d(9), end: d(11) },
      { id: "d", start: d(9), end: d(11) },
    ]);
    const columnIndices = result.map((r) => r.columnIndex).sort();
    expect(columnIndices).toEqual([0, 1, 2, 3]);
    expect(result.every((r) => r.columnCount === 4)).toBe(true);
  });
});

describe("getVerticalMetrics", () => {
  it("maps an event fully inside the range to a top/height percentage", () => {
    const metrics = getVerticalMetrics(d(10), d(11), 8, 20);
    expect(metrics).not.toBeNull();
    expect(metrics!.top).toBeCloseTo(((2 * 60) / (12 * 60)) * 100);
    expect(metrics!.height).toBeCloseTo((60 / (12 * 60)) * 100);
  });

  it("clips an event that starts before the visible range", () => {
    const metrics = getVerticalMetrics(d(6), d(9), 8, 20);
    expect(metrics).not.toBeNull();
    expect(metrics!.top).toBe(0);
  });

  it("clips an event that ends after the visible range", () => {
    const metrics = getVerticalMetrics(d(19), d(22), 8, 20);
    expect(metrics).not.toBeNull();
    expect(metrics!.top + metrics!.height).toBeCloseTo(100);
  });

  it("excludes an event entirely outside the visible range", () => {
    expect(getVerticalMetrics(d(5), d(7), 8, 20)).toBeNull();
    expect(getVerticalMetrics(d(21), d(22), 8, 20)).toBeNull();
  });
});

describe("hashStringToIndex", () => {
  it("is stable across calls for the same id", () => {
    expect(hashStringToIndex("event-42", 8)).toBe(hashStringToIndex("event-42", 8));
  });

  it("stays within bounds", () => {
    for (const id of ["a", "b", "some-longer-event-id", ""]) {
      const index = hashStringToIndex(id, 8);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(8);
    }
  });
});

describe("pixelDeltaToSnappedMinutes", () => {
  it("snaps to the nearest whole slot", () => {
    expect(pixelDeltaToSnappedMinutes(SLOT_HEIGHT_PX, 30)).toBe(30);
    expect(pixelDeltaToSnappedMinutes(SLOT_HEIGHT_PX * 2, 30)).toBe(60);
    expect(pixelDeltaToSnappedMinutes(-SLOT_HEIGHT_PX, 30)).toBe(-30);
    expect(pixelDeltaToSnappedMinutes(0, 30)).toBe(0);
  });

  it("rounds a sub-slot delta to the nearest slot", () => {
    expect(pixelDeltaToSnappedMinutes(SLOT_HEIGHT_PX * 0.4, 30)).toBe(0);
    expect(pixelDeltaToSnappedMinutes(SLOT_HEIGHT_PX * 0.6, 30)).toBe(30);
  });
});

describe("minutesOfDay / combineDayAndMinutes", () => {
  it("round-trips a time of day onto a different calendar day", () => {
    const combined = combineDayAndMinutes(dayOnly(10), minutesOfDay(d(14, 30)));
    expect(combined.getDate()).toBe(10);
    expect(combined.getHours()).toBe(14);
    expect(combined.getMinutes()).toBe(30);
  });
});

describe("computeMoveResult", () => {
  it("moves start/end by a snapped delta while preserving duration", () => {
    const result = computeMoveResult({
      originalStart: d(9),
      originalEnd: d(10),
      targetDay: dayOnly(3),
      deltaYPx: SLOT_HEIGHT_PX * 2,
      slotDuration: 30,
      startHour: 0,
      endHour: 24,
    });
    expect(result.start.getHours()).toBe(10);
    expect(result.start.getMinutes()).toBe(0);
    expect(result.end.getHours()).toBe(11);
    expect(result.end.getTime() - result.start.getTime()).toBe(60 * 60 * 1000);
  });

  it("moves an event onto a different day at the same time of day", () => {
    const result = computeMoveResult({
      originalStart: d(9),
      originalEnd: d(10),
      targetDay: dayOnly(5),
      deltaYPx: 0,
      slotDuration: 30,
      startHour: 0,
      endHour: 24,
    });
    expect(result.start.getDate()).toBe(5);
    expect(result.start.getHours()).toBe(9);
    expect(result.end.getDate()).toBe(5);
    expect(result.end.getHours()).toBe(10);
  });

  it("clamps so the event cannot start before startHour", () => {
    const result = computeMoveResult({
      originalStart: d(8),
      originalEnd: d(9),
      targetDay: dayOnly(3),
      deltaYPx: -SLOT_HEIGHT_PX * 10,
      slotDuration: 30,
      startHour: 8,
      endHour: 18,
    });
    expect(minutesOfDay(result.start)).toBe(8 * 60);
    expect(result.end.getTime() - result.start.getTime()).toBe(60 * 60 * 1000);
  });

  it("clamps so the event cannot end after endHour", () => {
    const result = computeMoveResult({
      originalStart: d(17),
      originalEnd: d(18),
      targetDay: dayOnly(3),
      deltaYPx: SLOT_HEIGHT_PX * 10,
      slotDuration: 30,
      startHour: 8,
      endHour: 18,
    });
    expect(minutesOfDay(result.end)).toBe(18 * 60);
    expect(result.end.getTime() - result.start.getTime()).toBe(60 * 60 * 1000);
  });
});

describe("computeResizeResult", () => {
  it("extends the end time by a snapped delta, leaving start untouched", () => {
    const result = computeResizeResult({
      originalStart: d(9),
      originalEnd: d(10),
      deltaYPx: SLOT_HEIGHT_PX,
      slotDuration: 30,
      minEventDuration: 30,
      endHour: 24,
    });
    expect(result.end.getHours()).toBe(10);
    expect(result.end.getMinutes()).toBe(30);
  });

  it("cannot shrink an event below minEventDuration", () => {
    const result = computeResizeResult({
      originalStart: d(9),
      originalEnd: d(9, 30),
      deltaYPx: -SLOT_HEIGHT_PX * 5,
      slotDuration: 30,
      minEventDuration: 30,
      endHour: 24,
    });
    expect(result.end.getTime() - d(9).getTime()).toBe(30 * 60 * 1000);
  });

  it("cannot resize past endHour", () => {
    const result = computeResizeResult({
      originalStart: d(17),
      originalEnd: d(17, 30),
      deltaYPx: SLOT_HEIGHT_PX * 10,
      slotDuration: 30,
      minEventDuration: 30,
      endHour: 18,
    });
    expect(minutesOfDay(result.end)).toBe(18 * 60);
  });
});
