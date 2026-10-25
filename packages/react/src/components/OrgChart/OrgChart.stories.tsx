import type { Meta, StoryObj } from "@storybook/react-vite";
import { OrgChart } from "./OrgChart";
import type { OrgNodeData } from "./org-layout";

const tree: OrgNodeData = {
  id: "ceo",
  name: "Ada Lovelace",
  title: "Chief Executive",
  children: [
    {
      id: "cto",
      name: "Grace Hopper",
      title: "CTO",
      children: [
        { id: "fe", name: "Margaret Hamilton", title: "Frontend Lead", children: [{ id: "fe1", name: "Tim Berners" }, { id: "fe2", name: "Brendan Eich" }] },
        { id: "be", name: "Dennis Ritchie", title: "Backend Lead" }
      ]
    },
    { id: "cfo", name: "Katherine Johnson", title: "CFO", children: [{ id: "acc", name: "Luca Pacioli", title: "Accounting" }] },
    { id: "coo", name: "Hedy Lamarr", title: "COO" }
  ]
};

const meta: Meta<typeof OrgChart> = { title: "Components/OrgChart", component: OrgChart };
export default meta;
type Story = StoryObj<typeof OrgChart>;

export const Default: Story = { render: () => <OrgChart data={tree} /> };
export const HorizontalCurves: Story = {
  render: () => <OrgChart data={tree} orientation="horizontal" edgeStyle="curve" nodeWidth={180} gapX={60} gapY={16} />
};
export const CustomCards: Story = {
  render: () => (
    <OrgChart
      data={tree}
      nodeHeight={56}
      renderNode={(n, { selected }) => (
        <span style={{ fontWeight: selected ? 700 : 500 }}>
          {n.name}
          <br />
          <small>{n.title}</small>
        </span>
      )}
    />
  )
};
