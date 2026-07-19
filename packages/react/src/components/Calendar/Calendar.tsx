import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from "react";
import {
  dayButton,
  dayCell,
  grid,
  header,
  monthLabel,
  navButton,
  root,
  weekRow,
  weekdayCell,
} from "./Calendar.css";
import type { CalendarProps } from "./types";
import {
  addDays,
  addMonths,
  clampToMidnight,
  dateKey,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "../../utils/date";

function getCalendarWeeks(month: Date, weekStartsOn: 0 | 1): Date[][] {
  const gridStart = startOfWeek(startOfMonth(month), weekStartsOn);
  const gridEnd = endOfWeek(endOfMonth(month), weekStartsOn);

  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function isDateDisabledBy(
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

/** Walks forward/backward from `date` (inclusive) until an enabled date is found, or null if none within a year. */
function findEnabledDate(
  date: Date,
  direction: 1 | -1,
  minDate: Date | undefined,
  maxDate: Date | undefined,
  isDateDisabled: ((date: Date) => boolean) | undefined
): Date | null {
  let cursor = date;
  for (let i = 0; i < 366; i++) {
    if (!isDateDisabledBy(cursor, minDate, maxDate, isDateDisabled)) {
      return cursor;
    }
    cursor = addDays(cursor, direction);
  }
  return null;
}

function getFocusableDate(
  month: Date,
  value: Date | null,
  minDate: Date | undefined,
  maxDate: Date | undefined,
  isDateDisabled: ((date: Date) => boolean) | undefined
): Date {
  if (
    value &&
    isSameMonth(value, month) &&
    !isDateDisabledBy(value, minDate, maxDate, isDateDisabled)
  ) {
    return clampToMidnight(value);
  }
  const today = clampToMidnight(new Date());
  if (
    isSameMonth(today, month) &&
    !isDateDisabledBy(today, minDate, maxDate, isDateDisabled)
  ) {
    return today;
  }
  const firstEnabled = findEnabledDate(
    startOfMonth(month),
    1,
    minDate,
    maxDate,
    isDateDisabled
  );
  if (firstEnabled && isSameMonth(firstEnabled, month)) {
    return firstEnabled;
  }
  return startOfMonth(month);
}

export function Calendar({
  value: controlledValue,
  defaultValue = null,
  onChange,
  month: controlledMonth,
  onMonthChange,
  minDate,
  maxDate,
  isDateDisabled,
  weekStartsOn = 1,
  locale = "en-US",
  rangeEnd,
}: CalendarProps): ReactElement {
  const [uncontrolledValue, setUncontrolledValue] = useState<Date | null>(
    defaultValue
  );
  const value =
    controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const setValue = (next: Date) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  };

  const [uncontrolledMonth, setUncontrolledMonth] = useState<Date>(() =>
    startOfMonth(controlledMonth ?? value ?? new Date())
  );
  const month =
    controlledMonth !== undefined
      ? startOfMonth(controlledMonth)
      : uncontrolledMonth;

  const setMonth = (next: Date) => {
    const normalized = startOfMonth(next);
    if (controlledMonth === undefined) {
      setUncontrolledMonth(normalized);
    }
    onMonthChange?.(normalized);
  };

  const [rovingDate, setRovingDate] = useState<Date>(() =>
    getFocusableDate(month, value, minDate, maxDate, isDateDisabled)
  );
  const shouldFocusRef = useRef(false);
  const dayRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    setRovingDate((prev) => {
      if (isSameMonth(prev, month)) return prev;
      return getFocusableDate(month, value, minDate, maxDate, isDateDisabled);
    });
    // Only the displayed month should re-derive the roving date; value/min/max changes
    // within the same month are handled by click/keyboard handlers directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    if (!shouldFocusRef.current) return;
    shouldFocusRef.current = false;
    dayRefs.current.get(dateKey(rovingDate))?.focus();
  }, [rovingDate, month]);

  const weeks = useMemo(
    () => getCalendarWeeks(month, weekStartsOn),
    [month, weekStartsOn]
  );
  const today = useMemo(() => clampToMidnight(new Date()), []);

  const monthLabelFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale]
  );
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short" }),
    [locale]
  );

  const handleDayClick = (date: Date, disabled: boolean, inMonth: boolean) => {
    if (disabled) return;
    if (!inMonth) {
      setMonth(startOfMonth(date));
      return;
    }
    const normalized = clampToMidnight(date);
    setValue(normalized);
    setRovingDate(normalized);
  };

  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    date: Date
  ) => {
    let targetRaw: Date;
    let direction: 1 | -1;
    switch (event.key) {
      case "ArrowLeft":
        targetRaw = addDays(date, -1);
        direction = -1;
        break;
      case "ArrowRight":
        targetRaw = addDays(date, 1);
        direction = 1;
        break;
      case "ArrowUp":
        targetRaw = addDays(date, -7);
        direction = -1;
        break;
      case "ArrowDown":
        targetRaw = addDays(date, 7);
        direction = 1;
        break;
      case "Home":
        targetRaw = startOfWeek(date, weekStartsOn);
        direction = -1;
        break;
      case "End":
        targetRaw = endOfWeek(date, weekStartsOn);
        direction = 1;
        break;
      case "PageUp":
        targetRaw = addMonths(date, -1);
        direction = -1;
        break;
      case "PageDown":
        targetRaw = addMonths(date, 1);
        direction = 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = findEnabledDate(
      targetRaw,
      direction,
      minDate,
      maxDate,
      isDateDisabled
    );
    if (!target) return;
    shouldFocusRef.current = true;
    setRovingDate(target);
    if (!isSameMonth(target, month)) {
      setMonth(startOfMonth(target));
    }
  };

  const monthLabelText = monthLabelFormatter.format(month);
  const clampedValue = value ? clampToMidnight(value) : null;
  const clampedRangeEnd = rangeEnd ? clampToMidnight(rangeEnd) : null;

  return (
    <div className={root} role="application" aria-label={monthLabelText}>
      <div className={header}>
        <button
          type="button"
          className={navButton}
          onClick={() => setMonth(addMonths(month, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className={monthLabel}>{monthLabelText}</span>
        <button
          type="button"
          className={navButton}
          onClick={() => setMonth(addMonths(month, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className={grid} role="grid" aria-label={monthLabelText}>
        <div className={weekRow} role="row">
          {weeks[0]!.map((date) => (
            <div
              key={dateKey(date)}
              className={weekdayCell}
              role="columnheader"
            >
              {weekdayFormatter.format(date)}
            </div>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className={weekRow} role="row">
            {week.map((date) => {
              const inMonth = isSameMonth(date, month);
              const disabled = isDateDisabledBy(
                date,
                minDate,
                maxDate,
                isDateDisabled
              );
              const isRangeEndDay = clampedRangeEnd
                ? isSameDay(date, clampedRangeEnd)
                : false;
              const selected =
                (clampedValue ? isSameDay(date, clampedValue) : false) ||
                isRangeEndDay;
              const inRange = Boolean(
                clampedValue &&
                  clampedRangeEnd &&
                  date > clampedValue &&
                  date < clampedRangeEnd
              );
              const isToday = isSameDay(date, today);
              const tabIndex =
                inMonth && !disabled && isSameDay(date, rovingDate) ? 0 : -1;

              return (
                <div key={dateKey(date)} className={dayCell} role="gridcell">
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) {
                        dayRefs.current.set(dateKey(date), el);
                      } else {
                        dayRefs.current.delete(dateKey(date));
                      }
                    }}
                    className={dayButton}
                    data-outside={!inMonth || undefined}
                    data-today={isToday || undefined}
                    data-selected={selected || undefined}
                    data-in-range={inRange || undefined}
                    disabled={disabled}
                    tabIndex={tabIndex}
                    aria-selected={selected || undefined}
                    aria-current={isToday ? "date" : undefined}
                    aria-disabled={disabled || undefined}
                    aria-label={date.toDateString()}
                    onClick={() => handleDayClick(date, disabled, inMonth)}
                    onKeyDown={
                      inMonth ? (e) => handleKeyDown(e, date) : undefined
                    }
                  >
                    {date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
