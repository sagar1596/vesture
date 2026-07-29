import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { marker } from "./Timeline.css";
import { Timeline } from "./Timeline";
import type { TimelineItem } from "./types";

const items: TimelineItem[] = [
  { id: "1", title: "Order placed", timestamp: "9:00 AM", status: "success" },
  { id: "2", title: "Payment failed", description: "Card declined", status: "danger" },
  { id: "3", title: "Awaiting review", status: "warning" },
  { id: "4", title: "Created" },
];

describe("Timeline", () => {
  it("renders the correct item count and content", () => {
    render(<Timeline items={items} />);

    expect(screen.getByText("Order placed")).toBeInTheDocument();
    expect(screen.getByText("9:00 AM")).toBeInTheDocument();
    expect(screen.getByText("Payment failed")).toBeInTheDocument();
    expect(screen.getByText("Card declined")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("applies the correct status color class to each marker", () => {
    render(<Timeline items={items} />);
    const markers = document.querySelectorAll(`.${marker}`);

    expect(markers[0]).toHaveAttribute("data-status", "success");
    expect(markers[1]).toHaveAttribute("data-status", "danger");
    expect(markers[2]).toHaveAttribute("data-status", "warning");
    expect(markers[3]).toHaveAttribute("data-status", "default");
  });

  it("renders custom icons when provided", () => {
    render(
      <Timeline
        items={[{ id: "1", title: "Shipped", icon: <span data-testid="custom-icon">✓</span> }]}
      />
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("defaults to vertical orientation", () => {
    render(<Timeline items={items} />);
    expect(screen.getByRole("list")).toHaveAttribute("data-orientation", "vertical");
  });

  it("switches to horizontal orientation", () => {
    render(<Timeline items={items} orientation="horizontal" />);
    expect(screen.getByRole("list")).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders minimally with just a title", () => {
    render(<Timeline items={[{ id: "1", title: "Just a title" }]} />);
    expect(screen.getByText("Just a title")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
