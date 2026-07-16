import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("renders initials from the name when no image is given", () => {
    render(<Avatar name="Ada Lovelace" />);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("renders a single initial for a one-word name", () => {
    render(<Avatar name="Ada" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders an image when src is provided", () => {
    render(<Avatar name="Ada Lovelace" src="/ada.png" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/ada.png");
  });

  it("shows a status indicator when status is provided", () => {
    render(<Avatar name="Ada Lovelace" status="online" />);
    expect(screen.getByRole("status", { name: "online" })).toBeInTheDocument();
  });
});
