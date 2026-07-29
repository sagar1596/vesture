import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Components/EmptyState",
  component: EmptyState,
  args: {
    title: "No results found",
    description: "Try adjusting your search or filters to find what you're looking for."
  }
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Basic: Story = {};

export const WithIcon: Story = {
  args: {
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
};

export const WithAction: Story = {
  args: {
    action: <Button>Clear filters</Button>
  }
};

export const Minimal: Story = {
  args: {
    title: "Nothing here yet",
    description: undefined
  }
};
