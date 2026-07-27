import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { Skeleton } from "./Skeleton";
import { SkeletonWrapper } from "./SkeletonWrapper";

const meta: Meta<typeof Skeleton> = {
  title: "Components/Skeleton",
  component: Skeleton
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const TextSingleLine: Story = {
  args: { variant: "text", style: { width: "240px" } }
};

export const TextMultiLine: Story = {
  args: { variant: "text", lines: 4, style: { width: "320px" } }
};

export const Circular: Story = {
  args: { variant: "circular" }
};

export const Rectangular: Story = {
  args: { variant: "rectangular", width: 320, height: 160 }
};

export const PulseAnimation: Story = {
  args: { variant: "rectangular", width: 320, height: 160, animation: "pulse" }
};

export const NoAnimation: Story = {
  args: { variant: "rectangular", width: 320, height: 160, animation: "none" }
};

export const WithWrapper: Story = {
  render: () => {
    const [loading, setLoading] = useState(true);
    return (
      <Stack gap="md">
        <button onClick={() => setLoading((prev) => !prev)}>
          {loading ? "Show content" : "Show skeleton"}
        </button>
        <SkeletonWrapper
          loading={loading}
          skeleton={<Skeleton variant="text" lines={2} style={{ width: "280px" }} />}
        >
          <p>Real content, loaded and ready.</p>
        </SkeletonWrapper>
      </Stack>
    );
  }
};

export const CardSkeleton: Story = {
  render: () => (
    <Stack direction="row" gap="sm" align="center">
      <Skeleton variant="circular" />
      <Stack gap="xs" style={{ width: "200px" }}>
        <Skeleton variant="text" style={{ width: "70%" }} />
        <Skeleton variant="text" style={{ width: "90%" }} />
      </Stack>
    </Stack>
  )
};
