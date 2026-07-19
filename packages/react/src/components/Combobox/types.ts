export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  /** Enables multi-select (chips) mode. */
  multiple?: boolean;
  value?: string | string[] | null;
  defaultValue?: string | string[] | null;
  onChange?: (value: string | string[] | null) => void;
  /** Fires as the user types, e.g. to drive async/server-side filtering of `options`. */
  onInputChange?: (text: string) => void;
  /** Overrides the default case-insensitive substring filter, e.g. to disable client-side filtering for async options. */
  filterOptions?: (options: ComboboxOption[], inputText: string) => ComboboxOption[];
  placeholder?: string;
  noOptionsMessage?: string;
  disabled?: boolean;
  invalid?: boolean;
  loading?: boolean;
  /** Number of filtered options at/above which the listbox switches to virtualized (windowed) rendering. */
  virtualizationThreshold?: number;
  /** Row height (px) used for virtualized listbox rows; defaults to the `.option` class's rendered height. */
  optionHeight?: number;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}
