export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  /** Controlled selected range. */
  value?: DateRange;
  /** Initial selected range when uncontrolled. */
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  /** Disables arbitrary dates on top of minDate/maxDate, e.g. weekends. */
  isDateDisabled?: (date: Date) => boolean;
  weekStartsOn?: 0 | 1;
  /** BCP 47 locale used for the inputs' format and the underlying Calendar. */
  locale?: string;
  /** Defaults to a pattern derived from `locale` via Intl.DateTimeFormat, e.g. "MM/DD/YYYY". */
  startPlaceholder?: string;
  endPlaceholder?: string;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
