import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Stepper } from "./Stepper";
import type { StepItem } from "./types";

const steps: StepItem[] = [
  { id: "account", label: "Account" },
  { id: "profile", label: "Profile" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" }
];

const stepsWithDescriptions: StepItem[] = [
  { id: "account", label: "Account", description: "Create your login" },
  { id: "profile", label: "Profile", description: "Tell us about yourself" },
  { id: "review", label: "Review", description: "Check everything looks right" },
  { id: "done", label: "Done", description: "You're all set" }
];

const meta: Meta<typeof Stepper> = {
  title: "Components/Stepper",
  component: Stepper,
  args: {
    steps,
    activeStep: 1
  }
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div style={{ height: "320px" }}>
      <Stepper {...args} />
    </div>
  )
};

export const WithDescriptions: Story = {
  args: { steps: stepsWithDescriptions, activeStep: 2 }
};

export const ClickableForJumpBack: Story = {
  render: (args) => {
    function Interactive() {
      const [activeStep, setActiveStep] = useState(2);
      return <Stepper {...args} activeStep={activeStep} onStepClick={setActiveStep} />;
    }
    return <Interactive />;
  }
};

export const ReadOnly: Story = {
  args: { activeStep: 2 }
};
