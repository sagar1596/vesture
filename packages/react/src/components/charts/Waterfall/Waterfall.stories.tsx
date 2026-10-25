import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaterfallChart } from "./Waterfall";

const meta: Meta<typeof WaterfallChart> = { title: "Components/Charts/WaterfallChart", component: WaterfallChart };
export default meta;
type Story = StoryObj<typeof WaterfallChart>;

export const Default: Story = {
  render: () => (
    <WaterfallChart
      width={600}
      height={340}
      formatValue={(v) => `$${v}k`}
      data={[
        { key: "s", label: "Opening", value: 500, type: "total" },
        { key: "a", label: "New", value: 220 },
        { key: "b", label: "Expansion", value: 140 },
        { key: "c", label: "Churn", value: -180 },
        { key: "d", label: "Contraction", value: -60 },
        { key: "e", label: "Closing", value: 0, type: "total" }
      ]}
    />
  )
};
