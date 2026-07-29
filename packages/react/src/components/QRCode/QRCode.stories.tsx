import type { Meta, StoryObj } from "@storybook/react-vite";
import { QRCode } from "./QRCode";

const meta: Meta<typeof QRCode> = {
  title: "Components/QRCode",
  component: QRCode,
  args: {
    value: "https://vesture.dev"
  }
};

export default meta;
type Story = StoryObj<typeof QRCode>;

export const Default: Story = {};

export const CustomColors: Story = {
  args: {
    fgColor: "#1d4ed8",
    bgColor: "#eff6ff"
  }
};

export const DifferentErrorCorrectionLevels: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "16px" }}>
      <QRCode {...args} errorCorrectionLevel="L" />
      <QRCode {...args} errorCorrectionLevel="M" />
      <QRCode {...args} errorCorrectionLevel="Q" />
      <QRCode {...args} errorCorrectionLevel="H" />
    </div>
  )
};

export const VariousSizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
      <QRCode {...args} size={64} />
      <QRCode {...args} size={128} />
      <QRCode {...args} size={256} />
    </div>
  )
};
