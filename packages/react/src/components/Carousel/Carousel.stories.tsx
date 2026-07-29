import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Carousel } from "./Carousel";

const meta: Meta<typeof Carousel> = {
  title: "Components/Carousel",
  component: Carousel,
};

export default meta;
type Story = StoryObj<typeof Carousel>;

const colors = ["#f97066", "#f79009", "#12b76a", "#2e90fa", "#7a5af8"];

function slide(index: number): ReactElement {
  return (
    <div
      style={{
        height: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors[index % colors.length],
        color: "white",
        fontSize: 24,
      }}
    >
      Slide {index + 1}
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Carousel>{[0, 1, 2, 3].map((i) => slide(i))}</Carousel>
    </div>
  ),
};

export const AutoPlay: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Carousel autoPlay autoPlayInterval={2000}>
        {[0, 1, 2, 3].map((i) => slide(i))}
      </Carousel>
    </div>
  ),
};

export const NoLoop: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Carousel loop={false}>{[0, 1, 2].map((i) => slide(i))}</Carousel>
    </div>
  ),
};

export const WithoutArrowsOrDots: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Carousel showArrows={false} showDots={false}>
        {[0, 1, 2].map((i) => slide(i))}
      </Carousel>
    </div>
  ),
};

export const KeyboardNav: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <p>Focus the carousel (click an arrow or dot), then use Arrow Left/Right.</p>
      <Carousel>{[0, 1, 2, 3].map((i) => slide(i))}</Carousel>
    </div>
  ),
};
