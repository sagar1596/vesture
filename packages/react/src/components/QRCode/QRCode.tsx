"use client";

// qrcode's public API (toDataURL/toString) is Promise-based even though the underlying
// module-matrix computation is synchronous — the library reserves the async contract for
// renderers that may eventually do real I/O (toFile, toFileStream). We ride that public API
// rather than reaching into qrcode's internal, untyped modules, which makes this component
// inherently async and client-only: it renders in two passes (nothing/previous code, then the
// generated code once the promise resolves), unlike the chart components' synchronous
// static/interactive split.
import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";
import { vars } from "@vesture/tokens";
import { image, root } from "./QRCode.css";

export interface QRCodeProps {
  value: string;
  size?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

// vars.color.* is a vanilla-extract CSS var() reference — fine to use directly in DOM/CSS, but
// canvas rendering (what qrcode's toDataURL uses) operates outside the CSSOM and can't resolve
// var(), so a concrete color has to be read off the page via getComputedStyle instead.
function resolveColor(value: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const match = /var\((--[^,)]+)/.exec(value);
  if (!match || !match[1]) return value;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
  return resolved || fallback;
}

export function QRCode({
  value,
  size = 128,
  errorCorrectionLevel = "M",
  fgColor,
  bgColor,
  className
}: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setDataUrl(null);
      return;
    }

    let cancelled = false;

    QRCodeLib.toDataURL(value, {
      width: size,
      errorCorrectionLevel,
      color: {
        dark: resolveColor(fgColor ?? vars.color.text, "#000000"),
        light: resolveColor(bgColor ?? vars.color.background, "#ffffff")
      }
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [value, size, errorCorrectionLevel, fgColor, bgColor]);

  return (
    <div className={[root, className].filter(Boolean).join(" ")} style={{ width: size, height: size }}>
      {dataUrl ? (
        <img className={image} src={dataUrl} width={size} height={size} alt={`QR code for ${value}`} />
      ) : null}
    </div>
  );
}
