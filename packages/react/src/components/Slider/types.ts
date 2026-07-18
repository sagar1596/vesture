export type SliderValue = number | [number, number];

export interface SliderProps {
  value?: SliderValue;
  defaultValue?: SliderValue;
  onChange?: (value: SliderValue) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  /** Label for the single thumb, or the [start, end] thumbs in range mode. */
  "aria-label"?: string | [string, string];
  /** Formats the value shown to assistive tech and in the value label, e.g. `(v) => \`$\${v}\`` */
  formatValue?: (value: number) => string;
}
