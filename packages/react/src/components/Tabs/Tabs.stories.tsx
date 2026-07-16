import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "./index";

const meta: Meta<typeof Tabs> = {
  title: "Components/Tabs",
  component: Tabs,
  render: () => (
    <Tabs defaultValue="account" style={{ width: "480px" }}>
      <Tabs.List>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="security">Security</Tabs.Trigger>
        <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="account">Manage your account details here.</Tabs.Panel>
      <Tabs.Panel value="security">Update your password and two-factor settings.</Tabs.Panel>
      <Tabs.Panel value="billing">View invoices and manage your subscription.</Tabs.Panel>
    </Tabs>
  )
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {};
