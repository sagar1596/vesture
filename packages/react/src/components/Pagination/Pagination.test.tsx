import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";
import { getPageRange } from "./getPageRange";

describe("getPageRange", () => {
  it("returns every page when total is small", () => {
    expect(getPageRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows a right ellipsis near the start", () => {
    expect(getPageRange(1, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20]);
  });

  it("shows a left ellipsis near the end", () => {
    expect(getPageRange(20, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20]);
  });

  it("shows both ellipses in the middle", () => {
    expect(getPageRange(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20]);
  });
});

describe("Pagination", () => {
  it("marks the current page", () => {
    render(<Pagination page={3} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
  });

  it("calls onPageChange when a page button is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables Previous on the first page and Next on the last page", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).not.toBeDisabled();
  });
});
