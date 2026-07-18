export interface DatePickerProps {
  /** Controlled selected date. Pass `null` for "controlled, nothing selected". */
  value?: Date | null;
  /** Initial selected date when uncontrolled. */
  defaultValue?: Date | null;
  /** Called with `null` when the input is cleared. */
  onChange?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  /** Disables arbitrary dates on top of minDate/maxDate, e.g. weekends. */
  isDateDisabled?: (date: Date) => boolean;
  weekStartsOn?: 0 | 1;
  /** BCP 47 locale used for the input format and the underlying Calendar. */
  locale?: string;
  /** Defaults to a pattern derived from `locale` via Intl.DateTimeFormat, e.g. "MM/DD/YYYY". */
  placeholder?: string;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
