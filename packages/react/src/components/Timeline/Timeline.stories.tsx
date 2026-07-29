import type { Meta, StoryObj } from "@storybook/react-vite";
import { Timeline } from "./Timeline";
import type { TimelineItem } from "./types";

const meta: Meta<typeof Timeline> = {
  title: "Components/Timeline",
  component: Timeline,
};

export default meta;
type Story = StoryObj<typeof Timeline>;

const items: TimelineItem[] = [
  {
    id: "1",
    title: "Order placed",
    description: "Your order has been received.",
    timestamp: "Jan 5, 9:00 AM",
    status: "success",
  },
  {
    id: "2",
    title: "Payment confirmed",
    timestamp: "Jan 5, 9:05 AM",
    status: "success",
  },
  {
    id: "3",
    title: "Preparing shipment",
    description: "Item is being packed at the warehouse.",
    timestamp: "Jan 6, 2:30 PM",
    status: "warning",
  },
  {
    id: "4",
    title: "Delivery delayed",
    description: "Weather conditions have delayed the carrier.",
    timestamp: "Jan 7, 8:00 AM",
    status: "danger",
  },
];

export const Vertical: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Timeline items={items} />
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => <Timeline items={items} orientation="horizontal" />,
};

export const WithStatusColors: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Timeline
        items={[
          { id: "1", title: "Default status" },
          { id: "2", title: "Success status", status: "success" },
          { id: "3", title: "Warning status", status: "warning" },
          { id: "4", title: "Danger status", status: "danger" },
        ]}
      />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Timeline
        items={[
          { id: "1", title: "Cart created", icon: <span>🛒</span>, status: "default" },
          { id: "2", title: "Payment processed", icon: <span>💳</span>, status: "success" },
          { id: "3", title: "Package shipped", icon: <span>📦</span>, status: "success" },
        ]}
      />
    </div>
  ),
};

export const Minimal: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Timeline
        items={[
          { id: "1", title: "Step one" },
          { id: "2", title: "Step two" },
          { id: "3", title: "Step three" },
        ]}
      />
    </div>
  ),
};
