import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tabs } from "./index";

function ThreeTabs() {
  return (
    <Tabs defaultValue="a">
      <Tabs.List>
        <Tabs.Trigger value="a">Tab A</Tabs.Trigger>
        <Tabs.Trigger value="b">Tab B</Tabs.Trigger>
        <Tabs.Trigger value="c">Tab C</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="a">Panel A</Tabs.Panel>
      <Tabs.Panel value="b">Panel B</Tabs.Panel>
      <Tabs.Panel value="c">Panel C</Tabs.Panel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the default panel and marks its trigger selected", () => {
    render(<ThreeTabs />);
    expect(screen.getByText("Panel A")).toBeInTheDocument();
    expect(screen.queryByText("Panel B")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveAttribute("aria-selected", "true");
  });

  it("switches panels when a trigger is clicked", () => {
    render(<ThreeTabs />);
    fireEvent.click(screen.getByRole("tab", { name: "Tab B" }));
    expect(screen.getByText("Panel B")).toBeInTheDocument();
    expect(screen.queryByText("Panel A")).not.toBeInTheDocument();
  });

  it("navigates with ArrowRight and selects the next tab", () => {
    render(<ThreeTabs />);
    const tabA = screen.getByRole("tab", { name: "Tab A" });
    tabA.focus();
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Panel B")).toBeInTheDocument();
  });

  it("wraps around with ArrowLeft from the first tab", () => {
    render(<ThreeTabs />);
    const tabA = screen.getByRole("tab", { name: "Tab A" });
    tabA.focus();
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Tab C" })).toHaveAttribute("aria-selected", "true");
  });

  it("only gives the selected tab a 0 tabIndex", () => {
    render(<ThreeTabs />);
    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute("tabindex", "-1");
  });
});
