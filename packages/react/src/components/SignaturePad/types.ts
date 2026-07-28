export interface SignaturePadProps {
  /** Fires on every stroke completion (pointerup); null when the pad is cleared. */
  onChange?: (dataUrl: string | null) => void;
  /** @default vars.color.text */
  penColor?: string;
  /** @default 2.5 */
  penWidth?: number;
  /** @default transparent, so the pad composites onto whatever surface it's placed on */
  backgroundColor?: string;
  /** CSS pixel width of the canvas. @default 400 */
  width?: number;
  /** CSS pixel height of the canvas. @default 160 */
  height?: number;
  disabled?: boolean;
  /**
   * Renders a built-in "Clear" button wired to clear(). Set false to build
   * your own controls against the ref instead.
   * @default true
   */
  showClearButton?: boolean;
  /** There's no visible text label on the canvas itself, so this names it for assistive tech. */
  "aria-label"?: string;
  className?: string;
}

export interface SignaturePadHandle {
  /** Wipes the canvas and fires onChange(null). */
  clear: () => void;
  /** Returns the current signature as a data URL. @param type @default "image/png" */
  toDataURL: (type?: string) => string;
  isEmpty: () => boolean;
}
