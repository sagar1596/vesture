import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumbs } from "./index";

const meta: Meta<typeof Breadcrumbs> = {
  title: "Components/Breadcrumbs",
  component: Breadcrumbs,
  render: (args) => (
    <Breadcrumbs {...args}>
      <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/settings">Settings</Breadcrumbs.Item>
      <Breadcrumbs.Item>Profile</Breadcrumbs.Item>
    </Breadcrumbs>
  )
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {};

export const CustomSeparator: Story = {
  args: { separator: "›" }
};
