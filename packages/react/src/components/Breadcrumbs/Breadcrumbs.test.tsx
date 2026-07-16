import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./index";

describe("Breadcrumbs", () => {
  it("renders links for all but the last item", () => {
    render(
      <Breadcrumbs>
        <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/settings">Settings</Breadcrumbs.Item>
        <Breadcrumbs.Item>Profile</Breadcrumbs.Item>
      </Breadcrumbs>
    );

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  });

  it("marks the last item as the current page", () => {
    render(
      <Breadcrumbs>
        <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item>Profile</Breadcrumbs.Item>
      </Breadcrumbs>
    );

    expect(screen.getByText("Profile")).toHaveAttribute("aria-current", "page");
  });

  it("renders a navigation landmark", () => {
    render(
      <Breadcrumbs>
        <Breadcrumbs.Item>Home</Breadcrumbs.Item>
      </Breadcrumbs>
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });
});
