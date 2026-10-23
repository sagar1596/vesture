import type { Meta, StoryObj } from "@storybook/react-vite";
import { FunnelChart } from "./Funnel";

const meta: Meta<typeof FunnelChart> = {
  title: "Components/Charts/FunnelChart",
  component: FunnelChart
};

export default meta;
type Story = StoryObj<typeof FunnelChart>;

export const Default: Story = {
  render: () => (
    <FunnelChart
      width={480}
      height={320}
      stages={[
        { key: "visit", label: "Visits", value: 12400 },
        { key: "signup", label: "Sign-ups", value: 5200 },
        { key: "trial", label: "Trials", value: 2100 },
        { key: "paid", label: "Paid", value: 640 }
      ]}
    />
  )
};

export const SteppedWithTotals: Story = {
  render: () => (
    <FunnelChart
      width={480}
      height={320}
      shape="stepped"
      gap={8}
      metric="total"
      colors={["#2a78d6", "#4a3aa7", "#e87ba4", "#eb6834"]}
      stages={[
        { key: "visit", label: "Visits", value: 12400 },
        { key: "signup", label: "Sign-ups", value: 5200 },
        { key: "trial", label: "Trials", value: 2100 },
        { key: "paid", label: "Paid", value: 640 }
      ]}
    />
  )
};
