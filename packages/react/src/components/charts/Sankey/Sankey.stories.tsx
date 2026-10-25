import type { Meta, StoryObj } from "@storybook/react-vite";
import { SankeyChart } from "./Sankey";

const nodes = [
  { key: "visits", label: "Visits" },
  { key: "ads", label: "Ads" },
  { key: "organic", label: "Organic" },
  { key: "signup", label: "Sign-up" },
  { key: "bounce", label: "Bounced" },
  { key: "trial", label: "Trial" },
  { key: "paid", label: "Paid" },
  { key: "churn", label: "Churned" }
];
const links = [
  { source: "ads", target: "visits", value: 400 },
  { source: "organic", target: "visits", value: 600 },
  { source: "visits", target: "signup", value: 350 },
  { source: "visits", target: "bounce", value: 650 },
  { source: "signup", target: "trial", value: 300 },
  { source: "signup", target: "churn", value: 50 },
  { source: "trial", target: "paid", value: 120 },
  { source: "trial", target: "churn", value: 180 }
];

const meta: Meta<typeof SankeyChart> = { title: "Components/Charts/SankeyChart", component: SankeyChart };
export default meta;
type Story = StoryObj<typeof SankeyChart>;

export const Default: Story = { render: () => <SankeyChart nodes={nodes} links={links} width={760} height={380} /> };
export const GradientLinks: Story = {
  render: () => <SankeyChart nodes={nodes} links={links} width={760} height={380} linkColor="gradient" linkOpacity={0.5} nodeWidth={20} />
};
