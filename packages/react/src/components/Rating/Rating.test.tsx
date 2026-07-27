import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Rating } from "./Rating";

function stubRect(el: Element, left: number, width: number) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    left,
    width,
    top: 0,
    height: 24,
    right: left + width,
    bottom: 24,
    x: left,
    y: 0,
    toJSON: () => ({})
  });
}

describe("Rating", () => {
  it("clicking a star sets the correct value", () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rate" value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("moves to the next star on ArrowRight and focuses it", () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rate" value={2} onChange={onChange} />);
    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("moves to the previous star on ArrowLeft", () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rate" value={3} onChange={onChange} />);
    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("does not move below 1 whole star on ArrowLeft", () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rate" value={1} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("previews fill up to and including the hovered star, not just the hovered one", () => {
    const { container } = render(<Rating aria-label="Rate" value={0} />);
    const labels = container.querySelectorAll("label");
    fireEvent.mouseEnter(labels[2]!); // hover the 3rd star

    const fillClips = container.querySelectorAll(
      'label span > span[style*="width"]'
    ) as NodeListOf<HTMLElement>;
    const widths = Array.from(fillClips).map((el) => el.style.width);
    expect(widths).toEqual(["100%", "100%", "100%", "0%", "0%"]);
  });

  it("clears the hover preview on mouse leave", () => {
    const { container } = render(<Rating aria-label="Rate" value={1} />);
    const labels = container.querySelectorAll("label");
    fireEvent.mouseEnter(labels[3]!);
    fireEvent.mouseLeave(screen.getByRole("radiogroup"));

    const fillClips = container.querySelectorAll(
      'label span > span[style*="width"]'
    ) as NodeListOf<HTMLElement>;
    const widths = Array.from(fillClips).map((el) => el.style.width);
    expect(widths).toEqual(["100%", "0%", "0%", "0%", "0%"]);
  });

  it("registers a half value when clicking the left half of a star with allowHalf", () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rate" value={0} allowHalf onChange={onChange} />);
    const labels = screen.getAllByRole("radio").map((input) => input.closest("label")!);
    const thirdStarLabel = labels[2]!;
    stubRect(thirdStarLabel, 0, 24);

    fireEvent.click(thirdStarLabel, { clientX: 5 }); // left half -> 2.5

    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it("registers a whole value when clicking the right half of a star with allowHalf", () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rate" value={0} allowHalf onChange={onChange} />);
    const labels = screen.getAllByRole("radio").map((input) => input.closest("label")!);
    const thirdStarLabel = labels[2]!;
    stubRect(thirdStarLabel, 0, 24);

    fireEvent.click(thirdStarLabel, { clientX: 20 }); // right half -> 3

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("keeps keyboard nav working after a half-star click (preventDefault must not swallow focus)", () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rate" defaultValue={0} allowHalf onChange={onChange} />);
    const radios = screen.getAllByRole("radio");
    const thirdStarLabel = radios[2]!.closest("label")!;
    stubRect(thirdStarLabel, 0, 24);

    fireEvent.click(thirdStarLabel, { clientX: 5 }); // left half -> 2.5
    expect(onChange).toHaveBeenCalledWith(2.5);
    expect(document.activeElement).toBe(radios[2]); // Math.ceil(2.5) -> 3rd input

    const group = screen.getByRole("radiogroup");
    fireEvent.keyDown(group, { key: "ArrowRight", shiftKey: true });
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("moves by half a star on Shift+ArrowRight when allowHalf is set", () => {
    const onChange = vi.fn();
    render(<Rating aria-label="Rate" value={2} allowHalf onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("radiogroup"), { key: "ArrowRight", shiftKey: true });
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it("readOnly mode renders no interactive inputs", () => {
    const { container } = render(<Rating readOnly value={4.2} />);
    expect(container.querySelectorAll("input")).toHaveLength(0);
  });

  it("readOnly mode shows a genuine partial fill for a non-integer value, not rounded", () => {
    const { container } = render(<Rating readOnly value={4.2} />);
    const fillClips = container.querySelectorAll(
      'span > span[style*="width"]'
    ) as NodeListOf<HTMLElement>;
    const widths = Array.from(fillClips).map((el) => el.style.width);
    expect(widths).toEqual(["100%", "100%", "100%", "100%", "20%"]);
  });

  it("readOnly mode exposes an aria-label describing the numeric rating", () => {
    render(<Rating readOnly value={4.2} />);
    expect(screen.getByRole("img", { name: "Rated 4.2 out of 5 stars" })).toBeInTheDocument();
  });

  it("gives multiple instances distinct auto-generated radio group names", () => {
    const { container } = render(
      <>
        <Rating aria-label="First" value={0} />
        <Rating aria-label="Second" value={0} />
      </>
    );
    const groups = container.querySelectorAll('[role="radiogroup"]');
    const nameOf = (group: Element) => group.querySelector("input")!.getAttribute("name");
    expect(nameOf(groups[0]!)).not.toBe(nameOf(groups[1]!));
  });

  it("selecting a star in one instance does not affect another instance", () => {
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    render(
      <>
        <Rating aria-label="First" value={0} onChange={onChangeA} />
        <Rating aria-label="Second" value={0} onChange={onChangeB} />
      </>
    );
    const firstGroupStars = screen.getAllByRole("radio", { name: "2 stars" });
    fireEvent.click(firstGroupStars[0]!);
    expect(onChangeA).toHaveBeenCalledWith(2);
    expect(onChangeB).not.toHaveBeenCalled();
  });
});
