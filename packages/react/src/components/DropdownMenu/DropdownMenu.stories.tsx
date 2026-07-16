import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { DropdownMenu } from "./index";

const meta: Meta<typeof DropdownMenu> = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  render: () => (
    <div style={{ padding: "80px" }}>
      <DropdownMenu trigger={<Button variant="secondary">Options</Button>}>
        <DropdownMenu.Item onSelect={() => console.log("Edit")}>Edit</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => console.log("Duplicate")}>Duplicate</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Archive (disabled)</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => console.log("Delete")}>Delete</DropdownMenu.Item>
      </DropdownMenu>
    </div>
  )
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {};
