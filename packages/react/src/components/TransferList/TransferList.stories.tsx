import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TransferList } from "./TransferList";

const items = [
  { key: "read", label: "Read", group: "Content" },
  { key: "write", label: "Write", group: "Content" },
  { key: "delete", label: "Delete", group: "Content" },
  { key: "invite", label: "Invite members", group: "Team" },
  { key: "remove", label: "Remove members", group: "Team" },
  { key: "billing", label: "Manage billing", group: "Admin", disabled: true },
  { key: "audit", label: "View audit log", group: "Admin" }
];

const meta: Meta<typeof TransferList> = { title: "Components/TransferList", component: TransferList };
export default meta;
type Story = StoryObj<typeof TransferList>;

export const Permissions: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["read"]);
    return (
      <div style={{ maxWidth: 640 }}>
        <TransferList items={items} value={value} onChange={setValue} titles={["Available permissions", "Granted"]} maxTarget={5} />
        <p>Granted: {value.join(", ") || "none"}</p>
      </div>
    );
  }
};
