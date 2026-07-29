import type { Meta, StoryObj } from "@storybook/react-vite";
import { Barcode } from "./Barcode";

const meta: Meta<typeof Barcode> = {
  title: "Components/Barcode",
  component: Barcode,
  args: {
    value: "123456789012",
    format: "CODE128"
  }
};

export default meta;
type Story = StoryObj<typeof Barcode>;

export const Code128Default: Story = {};

export const EAN13: Story = {
  args: { value: "5901234123457", format: "EAN13" }
};

export const UPC: Story = {
  args: { value: "123456789012", format: "UPC" }
};

export const WithoutDisplayValue: Story = {
  args: { displayValue: false }
};
