import { useEffect, useRef, useState } from "react";
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
import { dateInput, iconButton, popover, wrapper } from "./DatePicker.css";
import type { DatePickerProps } from "./types";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function clampToMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

export function DatePicker({
  value: controlledValue,
  defaultValue = null,
  onChange,
  minDate,
  maxDate,
  isDateDisabled,
  weekStartsOn = 1,
  locale = "en-US",
  placeholder,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
}: DatePickerProps): ReactElement {
  const [uncontrolledValue, setUncontrolledValue] = useState<Date | null>(
    defaultValue
  );
  const value =
    controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const setValue = (next: Date | null) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  };

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [month, setMonth] = useState<Date>(() =>
    startOfMonth(value ?? new Date())
  );
  const [inputText, setInputText] = useState(() =>
    value ? formatDate(value, locale) : ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputText(value ? formatDate(value, locale) : "");
  }, [value, locale]);

  useEffect(() => {
    if (open && value) {
      setMonth(startOfMonth(value));
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

  const revertInputText = () => {
    setInputText(value ? formatDate(value, locale) : "");
  };

  const commitTypedValue = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      if (value !== null) {
        setValue(null);
      }
      return;
    }

    const parsed = parseDate(trimmed, locale);
    if (!parsed || isDisabled(parsed, minDate, maxDate, isDateDisabled)) {
      revertInputText();
      return;
    }

    setValue(parsed);
    setMonth(startOfMonth(parsed));
    setInputText(formatDate(parsed, locale));
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTypedValue();
    }
  };

  const handleCalendarChange = (date: Date) => {
    setValue(date);
    setMonth(startOfMonth(date));
    setOpen(false);
  };

  const placeholderText = placeholder ?? getDatePlaceholder(locale);

  return (
    <div className={wrapper} ref={refs.setReference}>
      <input
        ref={inputRef}
        type="text"
        className={dateInput}
        value={inputText}
        placeholder={placeholderText}
        disabled={disabled}
        onChange={(e) => setInputText(e.target.value)}
        onBlur={commitTypedValue}
        onKeyDown={handleInputKeyDown}
        aria-label="Date"
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
          <FloatingFocusManager
            context={context}
            modal={false}
            returnFocus={inputRef}
          >
            <div
              ref={refs.setFloating}
              className={popover}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <Calendar
                value={value}
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
