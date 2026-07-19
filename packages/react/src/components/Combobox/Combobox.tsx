import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactElement } from "react";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from "@floating-ui/react";
import {
  chip,
  chipRemove,
  chipsWrapper,
  emptyState,
  inputEl,
  listbox,
  option as optionClass,
  virtualSpacer,
  wrapper
} from "./Combobox.css";
import type { ComboboxOption, ComboboxProps } from "./types";

// Matches the .option class's padding (2 * space.sm = 16px) + line height
// (sizeSm 14px * lineHeightNormal 1.5 = 21px) in Combobox.css.ts.
const DEFAULT_OPTION_HEIGHT = 37;
const OVERSCAN = 5;

function defaultFilter(options: ComboboxOption[], inputText: string): ComboboxOption[] {
  const query = inputText.trim().toLowerCase();
  if (!query) return options;
  return options.filter((opt) => opt.label.toLowerCase().includes(query));
}

function labelFor(options: ComboboxOption[], value: string | null): string {
  if (!value) return "";
  return options.find((opt) => opt.value === value)?.label ?? "";
}

export function Combobox({
  options,
  multiple = false,
  value: controlledValue,
  defaultValue,
  onChange,
  onInputChange,
  filterOptions = defaultFilter,
  placeholder,
  noOptionsMessage = "No options",
  disabled = false,
  invalid,
  loading = false,
  virtualizationThreshold = 50,
  optionHeight = DEFAULT_OPTION_HEIGHT,
  id,
  className,
  ...rest
}: ComboboxProps): ReactElement {
  const fallbackDefault = multiple ? [] : null;
  const [uncontrolledValue, setUncontrolledValue] = useState<string | string[] | null>(
    defaultValue !== undefined ? defaultValue : fallbackDefault
  );
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const setValue = (next: string | string[] | null) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  };

  const selectedValues = multiple ? ((value as string[] | null) ?? []) : [];
  const singleValue = multiple ? null : (value as string | null);

  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(() => (multiple ? "" : labelFor(options, singleValue)));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!multiple) {
      setInputText(labelFor(options, singleValue));
    }
    // Only re-sync the displayed text when the committed single-select value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleValue, multiple]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(280);

  const filteredOptions = filterOptions(options, multiple ? inputText : open ? inputText : "");

  const isVirtualized = filteredOptions.length >= virtualizationThreshold;

  useEffect(() => {
    // A brand-new `options` array (e.g. an async re-fetch triggered by
    // onInputChange) means the previous scroll position/active row are
    // stale — land back at the top rather than mid-scroll.
    setScrollTop(0);
    setActiveIndex(null);
    if (listboxRef.current) listboxRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  useEffect(() => {
    if (!open) return;
    const node = listboxRef.current;
    if (!node) return;
    if (node.clientHeight > 0) setViewportHeight(node.clientHeight);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setViewportHeight(entry.contentRect.height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [open]);

  const totalHeight = filteredOptions.length * optionHeight;
  const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
  const effectiveScrollTop = Math.min(scrollTop, maxScrollTop);
  const visibleCount = Math.ceil(viewportHeight / optionHeight) + OVERSCAN * 2;
  const startIndex = isVirtualized
    ? Math.max(0, Math.floor(effectiveScrollTop / optionHeight) - OVERSCAN)
    : 0;
  const endIndex = isVirtualized
    ? Math.min(filteredOptions.length, startIndex + visibleCount)
    : filteredOptions.length;
  const visibleOptions = filteredOptions.slice(startIndex, endIndex);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })]
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useDismiss(context),
    useRole(context, { role: "listbox" })
  ]);

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(null);
  };

  const closeList = () => {
    setOpen(false);
    setActiveIndex(null);
  };

  const selectOption = (opt: ComboboxOption) => {
    if (opt.disabled) return;

    if (multiple) {
      const next = selectedValues.includes(opt.value)
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value];
      setValue(next);
      setInputText("");
      onInputChange?.("");
      inputRef.current?.focus();
      return;
    }

    setValue(opt.value);
    setInputText(opt.label);
    closeList();
  };

  const removeChip = (optionValue: string) => {
    setValue(selectedValues.filter((v) => v !== optionValue));
    inputRef.current?.focus();
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    onInputChange?.(text);
    setOpen(true);
    setActiveIndex(null);
  };

  const scrollIndexIntoView = (index: number) => {
    if (!isVirtualized) return;
    const rowTop = index * optionHeight;
    const rowBottom = rowTop + optionHeight;
    let next = scrollTop;
    if (rowTop < scrollTop) {
      next = rowTop;
    } else if (rowBottom > scrollTop + viewportHeight) {
      next = rowBottom - viewportHeight;
    } else {
      return;
    }
    setScrollTop(next);
    if (listboxRef.current) listboxRef.current.scrollTop = next;
  };

  const moveActiveIndex = (direction: 1 | -1) => {
    if (filteredOptions.length === 0) return;
    let next = activeIndex ?? (direction === 1 ? -1 : filteredOptions.length);
    for (let step = 0; step < filteredOptions.length; step++) {
      next = (next + direction + filteredOptions.length) % filteredOptions.length;
      if (!filteredOptions[next]?.disabled) {
        setActiveIndex(next);
        scrollIndexIntoView(next);
        return;
      }
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) {
          openList();
        } else {
          moveActiveIndex(1);
        }
        return;
      case "ArrowUp":
        event.preventDefault();
        if (open) moveActiveIndex(-1);
        return;
      case "Enter": {
        if (!open) return;
        event.preventDefault();
        const active = activeIndex !== null ? filteredOptions[activeIndex] : undefined;
        if (active) selectOption(active);
        return;
      }
      case "Escape":
        if (open) {
          event.preventDefault();
          closeList();
          if (!multiple) setInputText(labelFor(options, singleValue));
        }
        return;
      case "Backspace":
        if (multiple && inputText === "" && selectedValues.length > 0) {
          removeChip(selectedValues[selectedValues.length - 1]!);
        }
        return;
      default:
    }
  };

  const handleBlur = () => {
    if (!multiple) {
      setInputText(labelFor(options, singleValue));
    }
    closeList();
  };

  const classes = [wrapper, className].filter(Boolean).join(" ");
  const activeOptionId = activeIndex !== null ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <span className={classes} ref={refs.setReference} data-disabled={disabled || undefined}>
      {multiple && selectedValues.length > 0 ? (
        <span className={chipsWrapper}>
          {selectedValues.map((val) => (
            <span key={val} className={chip}>
              {labelFor(options, val)}
              <button
                type="button"
                className={chipRemove}
                aria-label={`Remove ${labelFor(options, val)}`}
                disabled={disabled}
                onClick={() => removeChip(val)}
              >
                ×
              </button>
            </span>
          ))}
        </span>
      ) : null}
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        className={inputEl}
        value={inputText}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={invalid || undefined}
        aria-activedescendant={activeOptionId}
        {...getReferenceProps({
          ...rest,
          onFocus: openList,
          onBlur: handleBlur,
          onChange: (e) => handleInputChange((e.target as HTMLInputElement).value),
          onKeyDown: handleKeyDown
        })}
      />
      {open ? (
        <FloatingPortal>
          <div
            ref={(node) => {
              refs.setFloating(node);
              listboxRef.current = node;
            }}
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            className={listbox}
            style={floatingStyles}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            {...getFloatingProps()}
          >
            {loading ? (
              <div className={emptyState}>Loading…</div>
            ) : filteredOptions.length === 0 ? (
              <div className={emptyState}>{noOptionsMessage}</div>
            ) : isVirtualized ? (
              <div className={virtualSpacer} style={{ height: totalHeight }}>
                {visibleOptions.map((opt, i) => {
                  const index = startIndex + i;
                  const isSelected = multiple
                    ? selectedValues.includes(opt.value)
                    : opt.value === singleValue;
                  return (
                    <div
                      key={opt.value}
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled || undefined}
                      data-active={activeIndex === index || undefined}
                      className={optionClass}
                      style={{ position: "absolute", top: index * optionHeight, left: 0, right: 0, height: optionHeight }}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectOption(opt);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      {opt.label}
                    </div>
                  );
                })}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = multiple ? selectedValues.includes(opt.value) : opt.value === singleValue;
                return (
                  <div
                    key={opt.value}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled || undefined}
                    data-active={activeIndex === index || undefined}
                    className={optionClass}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectOption(opt);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {opt.label}
                  </div>
                );
              })
            )}
          </div>
        </FloatingPortal>
      ) : null}
    </span>
  );
}
