import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CandlestickChart } from "./Candlestick";
import { clampRange, ema, sma } from "./candlestick.math";
import type { Candle } from "./candlestick.math";

const candles: Candle[] = Array.from({ length: 30 }, (_, i) => ({
  time: `2026-01-${String(i + 1).padStart(2, "0")}`,
  open: 100 + i,
  close: 100 + i + (i % 2 ? -2 : 3),
  high: 106 + i,
  low: 96 + i,
  volume: 1000 + i * 10
}));

describe("indicators", () => {
  it("computes sma with nulls before the window fills", () => {
    expect(sma([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
  });
  it("seeds ema with the sma", () => {
    const out = ema([1, 2, 3, 4], 2);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeCloseTo(1.5);
    expect(out[2]).toBeCloseTo(2.5);
  });
  it("clamps ranges", () => {
    expect(clampRange([-5, 5], 30, 10)).toEqual([0, 10]);
    expect(clampRange([25, 50], 30, 10)).toEqual([5, 30]);
  });
});

describe("CandlestickChart", () => {
  it("renders every candle by default and flags direction", () => {
    render(<CandlestickChart data={candles} width={600} height={320} />);
    const all = screen.getAllByTestId("candlestick-candle");
    expect(all).toHaveLength(30);
    expect(all[0]!.getAttribute("data-direction")).toBe("up");
    expect(all[1]!.getAttribute("data-direction")).toBe("down");
  });
  it("respects a controlled visible range", () => {
    render(<CandlestickChart data={candles} width={600} height={320} visibleRange={[10, 20]} />);
    expect(screen.getAllByTestId("candlestick-candle")).toHaveLength(10);
  });
  it("draws one path per indicator", () => {
    render(
      <CandlestickChart
        data={candles}
        width={600}
        height={320}
        indicators={[{ kind: "sma", period: 5 }, { kind: "ema", period: 10, color: "#f0f" }]}
      />
    );
    expect(screen.getAllByTestId("candlestick-indicator")).toHaveLength(2);
  });
  it("pans with the arrow keys and reports the range", () => {
    const onVisibleRangeChange = vi.fn();
    render(
      <CandlestickChart data={candles} width={600} height={320} defaultVisibleRange={[0, 10]} onVisibleRangeChange={onVisibleRangeChange} />
    );
    fireEvent.keyDown(screen.getByRole("group"), { key: "ArrowRight" });
    expect(onVisibleRangeChange).toHaveBeenCalledWith([1, 11]);
  });
  it("zooms with + and keeps a minimum window", () => {
    render(<CandlestickChart data={candles} width={600} height={320} defaultVisibleRange={[0, 12]} minVisible={10} />);
    fireEvent.keyDown(screen.getByRole("group"), { key: "+" });
    fireEvent.keyDown(screen.getByRole("group"), { key: "+" });
    expect(screen.getAllByTestId("candlestick-candle").length).toBeGreaterThanOrEqual(10);
  });
  it("renders ohlc ticks and a line mode", () => {
    const { rerender } = render(<CandlestickChart data={candles} width={600} height={320} type="ohlc" />);
    expect(screen.getAllByTestId("candlestick-candle")).toHaveLength(30);
    rerender(<CandlestickChart data={candles} width={600} height={320} type="line" />);
    expect(screen.queryAllByTestId("candlestick-candle")).toHaveLength(0);
  });
  it("shows empty state", () => {
    render(<CandlestickChart data={[]} width={300} height={200} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
