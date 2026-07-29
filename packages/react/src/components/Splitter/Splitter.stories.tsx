import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Splitter } from "./Splitter";

const meta: Meta<typeof Splitter> = {
  title: "Components/Splitter",
  component: Splitter,
};

export default meta;
type Story = StoryObj<typeof Splitter>;

function paneContent(label: string): ReactElement {
  return (
    <div style={{ padding: 16, height: "100%", boxSizing: "border-box" }}>{label}</div>
  );
}

export const TwoPanelHorizontal: Story = {
  render: () => (
    <div style={{ height: 300, border: "1px solid #ccc" }}>
      <Splitter>
        {paneContent("Left panel")}
        {paneContent("Right panel")}
      </Splitter>
    </div>
  ),
};

export const ThreePanelVertical: Story = {
  render: () => (
    <div style={{ height: 400, border: "1px solid #ccc" }}>
      <Splitter direction="vertical">
        {paneContent("Top panel")}
        {paneContent("Middle panel")}
        {paneContent("Bottom panel")}
      </Splitter>
    </div>
  ),
};

export const WithMinSize: Story = {
  render: () => (
    <div style={{ height: 300, border: "1px solid #ccc" }}>
      <Splitter minSize={25} defaultSizes={[50, 50]}>
        {paneContent("Can't shrink below 25%")}
        {paneContent("Can't shrink below 25%")}
      </Splitter>
    </div>
  ),
};

export const KeyboardResize: Story = {
  render: () => (
    <div style={{ height: 300, border: "1px solid #ccc" }}>
      <p>Focus the divider and press Arrow Left/Right to resize.</p>
      <Splitter>
        {paneContent("Left panel")}
        {paneContent("Right panel")}
      </Splitter>
    </div>
  ),
};
