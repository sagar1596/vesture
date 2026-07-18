import { useEffect, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from "react";
import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { Calendar } from "../Calendar";
import {
  dateInput,
  iconButton,
  popover,
  separator,
  wrapper,
} from "./DateRangePicker.css";
import type { DateRange, DateRangePickerProps } from "./types";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function clampToMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** -1 if a < b, 0 if same day, 1 if a > b — compares calendar dates, ignoring time of day. */
function compareDates(a: Date, b: Date): number {
  const x = clampToMidnight(a).getTime();
  const y = clampToMidnight(b).getTime();
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}

function isDisabled(
  date: Date,
  minDate: Date | undefined,
  maxDate: Date | undefined,
  isDateDisabled: ((date: Date) => boolean) | undefined
): boolean {
  const target = clampToMidnight(date);
  if (minDate && target < clampToMidnight(minDate)) return true;
  if (maxDate && target > clampToMidnight(maxDate)) return true;
  if (isDateDisabled?.(target)) return true;
  return false;
}

/** Which {month, day, year} order this locale's short numeric date format uses. */
function getDatePartOrder(locale: string): Array<"month" | "day" | "year"> {
  const parts = new Intl.DateTimeFormat(locale).formatToParts(
    new Date(2000, 0, 2)
  );
  return parts
    .filter(
      (
        part
      ): part is Intl.DateTimeFormatPart & { type: "month" | "day" | "year" } =>
        part.type === "month" || part.type === "day" || part.type === "year"
    )
    .map((part) => part.type);
}

function getDatePlaceholder(locale: string): string {
  const parts = new Intl.DateTimeFormat(locale).formatToParts(
    new Date(2000, 0, 2)
  );
  return parts
    .map((part) => {
      switch (part.type) {
        case "month":
          return "MM";
        case "day":
          return "DD";
        case "year":
          return "YYYY";
        default:
          return part.value;
      }
    })
    .join("");
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale).format(date);
}

/** Parses locale-ordered numeric input like "2/14/2024" into a real calendar Date, or null if invalid. */
function parseDate(text: string, locale: string): Date | null {
  const numbers = text.match(/\d+/g);
  if (!numbers || numbers.length < 3) return null;

  const order = getDatePartOrder(locale);
  if (order.length < 3) return null;

  const values: Partial<Record<"month" | "day" | "year", number>> = {};
  order.forEach((type, i) => {
    values[type] = Number.parseInt(numbers[i]!, 10);
  });

  const { month, day, year } = values;
  if (!month || !day || !year) return null;

  const fullYear = year < 100 ? 2000 + year : year;
  const date = new Date(fullYear, month - 1, day);
  // Reject values that overflowed into the next month (e.g. Feb 31).
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

const EMPTY_RANGE: DateRange = { start: null, end: null };

export function DateRangePicker({
  value: controlledValue,
  defaultValue = EMPTY_RANGE,
  onChange,
  minDate,
  maxDate,
  isDateDisabled,
  weekStartsOn = 1,
  locale = "en-US",
  startPlaceholder,
  endPlaceholder,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
}: DateRangePickerProps): ReactElement {
  const [uncontrolledValue, setUncontrolledValue] =
    useState<DateRange>(defaultValue);
  const value =
    controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const setValue = (next: DateRange) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  };

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [month, setMonth] = useState<Date>(() =>
    startOfMonth(value.start ?? new Date())
  );
  const [startText, setStartText] = useState(() =>
    value.start ? formatDate(value.start, locale) : ""
  );
  const [endText, setEndText] = useState(() =>
    value.end ? formatDate(value.end, locale) : ""
  );

  useEffect(() => {
    setStartText(value.start ? formatDate(value.start, locale) : "");
  }, [value.start, locale]);

  useEffect(() => {
    setEndText(value.end ? formatDate(value.end, locale) : "");
  }, [value.end, locale]);

  useEffect(() => {
    if (open && value.start) {
      setMonth(startOfMonth(value.start));
    }
    // Only re-sync the displayed month at the moment the popover opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useDismiss(context),
    useRole(context, { role: "dialog" }),
  ]);

  const revertStartText = () => {
    setStartText(value.start ? formatDate(value.start, locale) : "");
  };

  const revertEndText = () => {
    setEndText(value.end ? formatDate(value.end, locale) : "");
  };

  const commitStartText = () => {
    const trimmed = startText.trim();
    if (!trimmed) {
      if (value.start !== null) {
        setValue({ start: null, end: value.end });
      }
      return;
    }

    const parsed = parseDate(trimmed, locale);
    if (
      !parsed ||
      isDisabled(parsed, minDate, maxDate, isDateDisabled) ||
      (value.end && compareDates(parsed, value.end) > 0)
    ) {
      revertStartText();
      return;
    }

    setValue({ start: parsed, end: value.end });
    setMonth(startOfMonth(parsed));
  };

  const commitEndText = () => {
    const trimmed = endText.trim();
    if (!trimmed) {
      if (value.end !== null) {
        setValue({ start: value.start, end: null });
      }
      return;
    }

    const parsed = parseDate(trimmed, locale);
    if (
      !parsed ||
      isDisabled(parsed, minDate, maxDate, isDateDisabled) ||
      (value.start && compareDates(parsed, value.start) < 0)
    ) {
      revertEndText();
      return;
    }

    setValue({ start: value.start, end: parsed });
    setMonth(startOfMonth(parsed));
  };

  const handleStartKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitStartText();
    }
  };

  const handleEndKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEndText();
    }
  };

  const handleCalendarChange = (date: Date) => {
    const { start, end } = value;
    if (!start || (start && end)) {
      setValue({ start: date, end: null });
      setMonth(startOfMonth(date));
      return;
    }

    if (compareDates(date, start) < 0) {
      setValue({ start: date, end: start });
    } else {
      setValue({ start, end: date });
    }
    setOpen(false);
  };

  const startPlaceholderText = startPlaceholder ?? getDatePlaceholder(locale);
  const endPlaceholderText = endPlaceholder ?? getDatePlaceholder(locale);

  return (
    <div
      className={wrapper}
      data-disabled={disabled || undefined}
      ref={refs.setReference}
    >
      <input
        type="text"
        className={dateInput}
        value={startText}
        placeholder={startPlaceholderText}
        disabled={disabled}
        onChange={(e) => setStartText(e.target.value)}
        onBlur={commitStartText}
        onKeyDown={handleStartKeyDown}
        aria-label="Start date"
      />
      <span className={separator} aria-hidden="true">
        –
      </span>
      <input
        type="text"
        className={dateInput}
        value={endText}
        placeholder={endPlaceholderText}
        disabled={disabled}
        onChange={(e) => setEndText(e.target.value)}
        onBlur={commitEndText}
        onKeyDown={handleEndKeyDown}
        aria-label="End date"
      />
      <button
        type="button"
        className={iconButton}
        disabled={disabled}
        aria-label={open ? "Close calendar" : "Open calendar"}
        {...getReferenceProps({
          onClick: () => {
            if (disabled) return;
            setOpen(!open);
          },
        })}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="1.5"
            y="2.5"
            width="13"
            height="12"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path d="M1.5 6h13" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M4.5 1v3M11.5 1v3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              className={popover}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <Calendar
                value={value.start}
                rangeEnd={value.end}
                onChange={handleCalendarChange}
                month={month}
                onMonthChange={setMonth}
                minDate={minDate}
                maxDate={maxDate}
                isDateDisabled={isDateDisabled}
                weekStartsOn={weekStartsOn}
                locale={locale}
              />
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
