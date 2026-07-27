export interface RatingProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** @default 5 */
  max?: number;
  /** @default false */
  allowHalf?: boolean;
  /**
   * Renders the current value as filled stars with no interactive inputs at
   * all — for displaying an average rating (e.g. "4.2 stars") computed from
   * other users' data. Non-integer values render an actual partial fill
   * (4.2/5 shows the 5th star at 20% fill), not rounded to the nearest star.
   * @default false
   */
  readOnly?: boolean;
  disabled?: boolean;
  /**
   * Name for the underlying native radio group. Auto-generated via useId
   * when omitted — required so multiple Rating instances on one page get
   * distinct native radio group names; sharing a name across instances
   * would make their native radio behavior collide (selecting a star in one
   * would clear the other).
   */
  name?: string;
  /**
   * There's no visible text label by default, so this is required in
   * practice for accessibility — pass a label like "Rate this product".
   */
  "aria-label"?: string;
  className?: string;
}
