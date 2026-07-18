export interface CalendarProps {
  /** Controlled selected date. Pass `null` for "controlled, nothing selected". */
  value?: Date | null;
  /** Initial selected date when uncontrolled. */
  defaultValue?: Date | null;
  onChange?: (date: Date) => void;
  /**
   * Optional second endpoint for range-selection UIs (e.g. DateRangePicker).
   * Purely visual — `value` renders as the range start, `rangeEnd` as the end,
   * and dates strictly between are shaded. Click/keyboard selection semantics
   * are unaffected and remain single-date via value/onChange.
   */
  rangeEnd?: Date | null;
  /** Controlled displayed month. Defaults to value's month, then defaultValue's month, then today. */
  month?: Date;
  onMonthChange?: (month: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  /** Disables arbitrary dates on top of minDate/maxDate, e.g. weekends. */
  isDateDisabled?: (date: Date) => boolean;
  weekStartsOn?: 0 | 1;
  /** BCP 47 locale used for month/weekday name formatting via Intl.DateTimeFormat. */
  locale?: string;
}
