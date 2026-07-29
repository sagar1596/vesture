import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { OTPInput } from "./OTPInput";

const meta: Meta<typeof OTPInput> = {
  title: "Components/OTPInput",
  component: OTPInput,
};

export default meta;
type Story = StoryObj<typeof OTPInput>;

export const Default6Digit: Story = {
  render: () => <OTPInput />,
};

export const FourDigit: Story = {
  render: () => <OTPInput length={4} />,
};

export const Alphanumeric: Story = {
  render: () => <OTPInput length={6} type="alphanumeric" />,
};

export const ControlledValue: Story = {
  render: function Render() {
    const [value, setValue] = useState("12");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <OTPInput length={6} value={value} onChange={setValue} />
        <span>Current value: {value || "(empty)"}</span>
      </div>
    );
  },
};

export const PasteHandlingDemo: Story = {
  render: function Render() {
    const [value, setValue] = useState("");
    const [completed, setCompleted] = useState("");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p>Copy a 6-digit code (e.g. 482913) and paste into any box.</p>
        <OTPInput
          length={6}
          value={value}
          onChange={setValue}
          onComplete={setCompleted}
        />
        <span>onComplete fired with: {completed || "(not yet)"}</span>
      </div>
    );
  },
};
