import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Accordion } from "./index";

function SingleAccordion() {
  return (
    <Accordion type="single" defaultValue="a">
      <Accordion.Item value="a">
        <Accordion.Trigger>Section A</Accordion.Trigger>
        <Accordion.Content>Content A</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Trigger>Section B</Accordion.Trigger>
        <Accordion.Content>Content B</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

function MultipleAccordion() {
  return (
    <Accordion type="multiple" defaultValue={["a"]}>
      <Accordion.Item value="a">
        <Accordion.Trigger>Section A</Accordion.Trigger>
        <Accordion.Content>Content A</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Trigger>Section B</Accordion.Trigger>
        <Accordion.Content>Content B</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("opens the default item and reflects aria-expanded", () => {
    render(<SingleAccordion />);
    expect(screen.getByRole("button", { name: /Section A/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Section B/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("single type closes the previous item when opening a new one", () => {
    render(<SingleAccordion />);
    fireEvent.click(screen.getByRole("button", { name: /Section B/ }));
    expect(screen.getByRole("button", { name: /Section A/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /Section B/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("single type closes an open item when clicked again", () => {
    render(<SingleAccordion />);
    fireEvent.click(screen.getByRole("button", { name: /Section A/ }));
    expect(screen.getByRole("button", { name: /Section A/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("multiple type keeps prior items open", () => {
    render(<MultipleAccordion />);
    fireEvent.click(screen.getByRole("button", { name: /Section B/ }));
    expect(screen.getByRole("button", { name: /Section A/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Section B/ })).toHaveAttribute("aria-expanded", "true");
  });
});
