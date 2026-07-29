import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QRCode } from "./QRCode";

describe("QRCode", () => {
  it("renders a QR code image for a given value", async () => {
    const { container } = render(<QRCode value="https://vesture.dev" />);
    await waitFor(() => {
      expect(container.querySelector("img")).toBeInTheDocument();
    });
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toMatch(/^data:image\/png/);
    expect(img.getAttribute("alt")).toBe("QR code for https://vesture.dev");
  });

  it("regenerates the code when value changes", async () => {
    const { container, rerender } = render(<QRCode value="one" />);
    await waitFor(() => expect(container.querySelector("img")).toBeInTheDocument());
    const firstSrc = container.querySelector("img")!.getAttribute("src");

    rerender(<QRCode value="two" />);
    await waitFor(() => {
      const src = container.querySelector("img")!.getAttribute("src");
      expect(src).not.toBe(firstSrc);
    });
  });

  it("handles an empty value gracefully without crashing", () => {
    const { container } = render(<QRCode value="" />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
});
