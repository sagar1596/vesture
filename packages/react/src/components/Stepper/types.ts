export interface StepItem {
  id: string;
  label: string;
  description?: string;
}

export type StepperOrientation = "horizontal" | "vertical";

export interface StepperProps {
  steps: StepItem[];
  activeStep: number;
  orientation?: StepperOrientation;
  completedSteps?: Set<number>;
  onStepClick?: (index: number) => void;
  className?: string;
}
