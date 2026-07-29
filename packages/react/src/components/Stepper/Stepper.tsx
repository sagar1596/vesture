import type { ReactElement } from "react";
import * as styles from "./Stepper.css";
import type { StepperProps } from "./types";

function CheckIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Stepper({
  steps,
  activeStep,
  orientation = "horizontal",
  completedSteps,
  onStepClick,
  className
}: StepperProps): ReactElement {
  const resolvedCompleted = completedSteps ?? new Set(steps.map((_, i) => i).filter((i) => i < activeStep));

  const getState = (index: number): "completed" | "active" | "upcoming" => {
    if (index === activeStep) return "active";
    if (resolvedCompleted.has(index)) return "completed";
    return "upcoming";
  };

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")} data-orientation={orientation}>
      {steps.map((stepItem, index) => {
        const state = getState(index);
        // Deliberate default: only completed/active steps are clickable, upcoming steps
        // can't be jumped to ahead of progress — matches the common linear wizard pattern.
        const clickable = onStepClick !== undefined && state !== "upcoming";
        const NodeTag = clickable ? "button" : "div";

        return (
          <div key={stepItem.id} className={styles.step}>
            <div className={styles.nodeLine}>
              <NodeTag
                type={clickable ? "button" : undefined}
                className={styles.node}
                data-state={state}
                aria-current={state === "active" ? "step" : undefined}
                onClick={clickable ? () => onStepClick?.(index) : undefined}
              >
                {state === "completed" ? <CheckIcon /> : index + 1}
              </NodeTag>
              {index < steps.length - 1 ? (
                <div className={styles.connector} data-filled={state === "completed" ? "true" : "false"} />
              ) : null}
            </div>
            <div className={styles.content}>
              <div className={styles.label}>{stepItem.label}</div>
              {stepItem.description ? <div className={styles.description}>{stepItem.description}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
