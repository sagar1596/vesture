import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Barcode } from "./Barcode";

// jsbarcode measures its text label via a scratch canvas (getContext("2d")) whenever
// displayValue is true; jsdom doesn't implement a real 2D context, so without this stub the
// measurement step throws mid-render for otherwise-valid values (see SignaturePad.test.tsx for
// the same pattern) — not an actual encoding-validity failure.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    font: "",
    measureText: () => ({ width: 40 })
  } as unknown as CanvasRenderingContext2D);
});

describe("Barcode", () => {
  it("renders a barcode for a given value and format", async () => {
    const { container } = render(<Barcode value="123456789012" format="CODE128" />);
    await waitFor(() => {
      expect(container.querySelector("svg")?.children.length).toBeGreaterThan(0);
    });
  });

  it("surfaces a clear error state for a non-numeric value under EAN13", async () => {
    const { getByText } = render(<Barcode value="not-numeric" format="EAN13" />);
    await waitFor(() => {
      expect(getByText(/Invalid value/)).toBeInTheDocument();
    });
  });

  it("renders a valid numeric EAN13 value without an error", async () => {
    const { container, queryByText } = render(<Barcode value="5901234123457" format="EAN13" />);
    await waitFor(() => {
      expect(container.querySelector("svg")?.children.length).toBeGreaterThan(0);
    });
    expect(queryByText(/Invalid value/)).not.toBeInTheDocument();
  });

  it("falls back to jsbarcode's own width/height defaults instead of NaN when width/height are omitted", async () => {
    // Regression test: passing `width: undefined` straight through to jsbarcode clobbers its
    // internal default via its Object.assign-style option merge, producing a NaN/0x0 SVG that's
    // invisible even though it "renders" without throwing.
    const { container } = render(<Barcode value="123456789012" format="CODE128" />);
    await waitFor(() => {
      const svg = container.querySelector("svg")!;
      expect(parseFloat(svg.getAttribute("width")!)).toBeGreaterThan(0);
      expect(parseFloat(svg.getAttribute("height")!)).toBeGreaterThan(0);
    });
  });
});
