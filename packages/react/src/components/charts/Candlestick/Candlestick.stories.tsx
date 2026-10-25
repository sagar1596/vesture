import type { Meta, StoryObj } from "@storybook/react-vite";
import { CandlestickChart } from "./Candlestick";
import type { Candle } from "./candlestick.math";

let seed = 11;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
let price = 120;
const data: Candle[] = Array.from({ length: 90 }, (_, i) => {
  const open = price;
  const close = open + (rnd() - 0.48) * 6;
  price = close;
  const d = new Date(Date.UTC(2026, 0, 1 + i));
  return {
    time: d.toISOString().slice(5, 10),
    open,
    close,
    high: Math.max(open, close) + rnd() * 3,
    low: Math.min(open, close) - rnd() * 3,
    volume: Math.round(2000 + rnd() * 6000)
  };
});

const meta: Meta<typeof CandlestickChart> = { title: "Components/Charts/CandlestickChart", component: CandlestickChart };
export default meta;
type Story = StoryObj<typeof CandlestickChart>;

export const Default: Story = {
  render: () => (
    <CandlestickChart
      data={data}
      width={760}
      height={380}
      defaultVisibleRange={[30, 90]}
      indicators={[{ kind: "sma", period: 10 }, { kind: "ema", period: 20 }]}
    />
  )
};
export const HollowOhlc: Story = {
  render: () => <CandlestickChart data={data} width={760} height={380} type="ohlc" showVolume={false} />
};
