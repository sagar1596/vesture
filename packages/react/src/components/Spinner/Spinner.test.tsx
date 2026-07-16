import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("exposes a status role with a default label", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("accepts a custom label", () => {
    render(<Spinner label="Fetching results" />);
    expect(screen.getByRole("status", { name: "Fetching results" })).toBeInTheDocument();
  });
});
