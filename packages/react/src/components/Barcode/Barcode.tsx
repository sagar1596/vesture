"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { errorText, root } from "./Barcode.css";

export interface BarcodeProps {
  value: string;
  format?: "CODE128" | "CODE39" | "EAN13" | "UPC";
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export function Barcode({
  value,
  format = "CODE128",
  width,
  height,
  displayValue = true,
  className
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !value) {
      setError(null);
      return;
    }

    // The `valid` callback option suppresses jsbarcode's normal throw-on-invalid-input
    // behavior, so a value it marks invalid never reaches rendering. A *caught* exception
    // here instead means rendering itself blew up after validation passed — a real bug, not
    // a value we should mislabel as "invalid for this format".
    // jsbarcode's option merge is a plain Object.assign-style overwrite (see its help/merge.js),
    // so an explicit `width: undefined`/`height: undefined` key clobbers its own internal
    // defaults with `undefined` instead of falling back to them — producing NaN geometry and an
    // invisible 0x0 barcode. Only include the keys when the caller actually provided a value.
    let valid = true;
    try {
      JsBarcode(svg, value, {
        format,
        displayValue,
        ...(width !== undefined ? { width } : null),
        ...(height !== undefined ? { height } : null),
        valid: (isValid) => {
          valid = isValid;
        }
      });
      setError(valid ? null : `Invalid value "${value}" for ${format} format`);
    } catch {
      setError(`Could not render a barcode for "${value}"`);
    }
  }, [value, format, width, height, displayValue]);

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      <svg ref={svgRef} role="img" aria-label={error ? undefined : `Barcode for ${value}`} />
      {error ? <div className={errorText}>{error}</div> : null}
    </div>
  );
}
