import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductTour } from "./ProductTour";
import { placeCard } from "./tour-geometry";

describe("placeCard", () => {
  const vp = { width: 1000, height: 800 };
  const card = { width: 300, height: 150 };
  const target = { top: 300, left: 400, width: 100, height: 40 };

  it("centers over the target on the requested side", () => {
    const p = placeCard(target, card, vp, "bottom");
    expect(p.placement).toBe("bottom");
    expect(p.top).toBe(300 + 40 + 12);
    expect(p.left).toBe(450 - 150);
  });
  it("flips when there's no room", () => {
    const high = { top: 10, left: 400, width: 100, height: 40 };
    expect(placeCard(high, card, vp, "top").placement).toBe("bottom");
    const right = { top: 300, left: 900, width: 80, height: 40 };
    expect(placeCard(right, card, vp, "right").placement).toBe("left");
  });
  it("clamps into the viewport", () => {
    const edge = { top: 300, left: 0, width: 40, height: 40 };
    const p = placeCard(edge, card, vp, "bottom");
    expect(p.left).toBe(12);
  });
  it("centers un-anchored steps", () => {
    const p = placeCard({ top: 0, left: 0, width: 0, height: 0 }, card, vp, "center");
    expect(p).toEqual({ top: 325, left: 350, placement: "center" });
  });
});

const steps = [
  { target: "#one", title: "First", content: "Look here" },
  { target: "#two", title: "Second", content: "Then here" },
  { title: "Finish", content: "All done" }
];

function Page(props: Partial<React.ComponentProps<typeof ProductTour>>) {
  return (
    <>
      <button id="one">One</button>
      <button id="two">Two</button>
      <ProductTour steps={steps} defaultOpen {...props} />
    </>
  );
}

describe("ProductTour", () => {
  it("renders nothing when closed", () => {
    render(<Page defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("shows the first step with progress and a spotlight", () => {
    render(<Page />);
    expect(screen.getByRole("dialog", { name: "First" })).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByTestId("tour-spotlight")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });
  it("walks forward and back, then finishes", () => {
    const onFinish = vi.fn();
    const onStepChange = vi.fn();
    render(<Page onFinish={onFinish} onStepChange={onStepChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Second" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("dialog", { name: "First" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByTestId("tour-spotlight")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onStepChange).toHaveBeenCalledWith(1);
  });
  it("skips with the button and with Escape", () => {
    const onSkip = vi.fn();
    const { unmount } = render(<Page onSkip={onSkip} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalledWith(0);
    expect(screen.queryByRole("dialog")).toBeNull();
    unmount();
    const onSkip2 = vi.fn();
    render(<Page onSkip={onSkip2} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onSkip2).toHaveBeenCalled();
  });
  it("navigates with arrow keys", () => {
    render(<Page />);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByRole("dialog", { name: "Second" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByRole("dialog", { name: "First" })).toBeInTheDocument();
  });
  it("is controllable", () => {
    const onOpenChange = vi.fn();
    const onStepChange = vi.fn();
    render(<Page open step={1} onOpenChange={onOpenChange} onStepChange={onStepChange} />);
    expect(screen.getByRole("dialog", { name: "Second" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onStepChange).toHaveBeenCalledWith(2);
    expect(screen.getByRole("dialog", { name: "Second" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
  it("supports custom labels, dots, hidden overlay and custom card rendering", () => {
    const { rerender } = render(<Page labels={{ next: "Continue" }} showDots showOverlay={false} />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.queryByTestId("tour-spotlight")).toBeNull();
    rerender(<Page renderCard={({ index, next }) => <button onClick={next}>custom {index}</button>} />);
    fireEvent.click(screen.getByRole("button", { name: "custom 0" }));
    expect(screen.getByRole("button", { name: "custom 1" })).toBeInTheDocument();
  });
  it("accepts element and ref targets and tolerates missing selectors", () => {
    const ref = { current: document.createElement("div") };
    document.body.appendChild(ref.current);
    render(<ProductTour defaultOpen steps={[{ target: ref, content: "ref" }, { target: "#nope", content: "missing" }]} />);
    expect(screen.getByTestId("tour-spotlight")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.queryByTestId("tour-spotlight")).toBeNull();
    expect(screen.getByText("missing")).toBeInTheDocument();
  });
  it("closes on backdrop click when enabled", () => {
    const onSkip = vi.fn();
    render(<Page closeOnBackdropClick onSkip={onSkip} />);
    fireEvent.click(screen.getByTestId("tour-blocker"));
    expect(onSkip).toHaveBeenCalled();
  });
});
