import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pagination } from "./Pagination";

const meta: Meta<typeof Pagination> = {
  title: "Components/Pagination",
  component: Pagination,
  args: {
    totalPages: 20,
    siblingCount: 1
  },
  render: (args) => {
    const [page, setPage] = useState(1);
    return <Pagination {...args} page={page} onPageChange={setPage} />;
  }
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {};

export const FewPages: Story = {
  args: { totalPages: 4 }
};
