import type { Meta, StoryObj } from "@storybook/react-vite";
import { LinearGauge, RadialGauge } from "./Gauge";
import type { GaugeRange } from "./Gauge.render";
import { vars } from "@vesture/tokens";

const ranges: GaugeRange[] = [
  { from: 0, to: 60, color: vars.color.success },
  { from: 60, to: 85, color: vars.color.warning },
  { from: 85, to: 100, color: vars.color.danger }
];

const meta: Meta<typeof RadialGauge> = {
  title: "Components/Gauge",
  component: RadialGauge
};

export default meta;
type Story = StoryObj<typeof RadialGauge>;

export const Radial: Story = { args: { value: 68, label: "CPU", formatValue: (v) => `${v}%` } };
export const RadialWithRanges: Story = { args: { value: 92, label: "Memory", ranges, formatValue: (v) => `${v}%` } };
export const Linear: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <LinearGauge value={72} label="Disk usage" ranges={ranges} formatValue={(v) => `${v}%`} />
    </div>
  )
};

export const HalfDialWithTicks: Story = {
  args: { value: 64, label: "Speed", startAngle: 180, sweep: 180, size: 220, ticks: 6, showTickLabels: true, target: 80 }
};
export const FullRing: Story = {
  args: {
    value: 72,
    sweep: 360,
    startAngle: -90,
    thickness: 14,
    squareCaps: true,
    renderCenter: ({ formatted }) => <strong style={{ fontSize: 28 }}>{formatted}%</strong>
  }
};
export const LinearWithTarget: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <LinearGauge value={58} label="Quota" target={75} thickness={14} formatValue={(v) => `${v}%`} />
    </div>
  )
};
