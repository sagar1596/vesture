import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Scheduler } from "./Scheduler";
import { resizeHandle } from "./Scheduler.css";
import { SLOT_HEIGHT_PX } from "./scheduler-layout";
import type { SchedulerEvent } from "./types";

// Wednesday, Jan 5 2050 — well outside any real test run date.
const WED_2050 = new Date(2050, 0, 5);

function makeEvent(overrides: Partial<SchedulerEvent> & Pick<SchedulerEvent, "id">): SchedulerEvent {
  return {
    title: overrides.id,
    start: new Date(2050, 0, 5, 9, 0),
    end: new Date(2050, 0, 5, 10, 0),
    ...overrides,
  };
}

describe("Scheduler", () => {
  it("fires onEventClick with the clicked event", () => {
    const onEventClick = vi.fn();
    const event = makeEvent({ id: "standup", title: "Standup" });
    render(
      <Scheduler date={WED_2050} events={[event]} onEventClick={onEventClick} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Standup" }));
    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventClick).toHaveBeenCalledWith(event);
  });

  it("fires onDateChange from the previous/next/today controls", () => {
    const onDateChange = vi.fn();
    render(<Scheduler date={WED_2050} events={[]} onDateChange={onDateChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(onDateChange).toHaveBeenCalledTimes(1);
    let called = onDateChange.mock.calls[0]![0] as Date;
    expect(called.getDate()).toBe(12);

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(onDateChange).toHaveBeenCalledTimes(2);
    called = onDateChange.mock.calls[1]![0] as Date;
    expect(called.getDate()).toBe(29);
    expect(called.getMonth()).toBe(11);

    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(onDateChange).toHaveBeenCalledTimes(3);
  });

  it("renders all-day events in the all-day row, not the time grid", () => {
    const allDay = makeEvent({ id: "conf", title: "Conference", allDay: true });
    render(<Scheduler date={WED_2050} events={[allDay]} />);

    const button = screen.getByRole("button", { name: "Conference" });
    // Time-grid events render their time range as a second line; all-day events don't.
    expect(button.textContent).toBe("Conference");
  });

  it("clips events that partially overlap the visible startHour/endHour range", () => {
    const event = makeEvent({
      id: "early",
      title: "Early",
      start: new Date(2050, 0, 5, 6, 0),
      end: new Date(2050, 0, 5, 8, 30),
    });
    render(
      <Scheduler date={WED_2050} events={[event]} startHour={8} endHour={18} />
    );
    // Still rendered (clipped), not excluded.
    expect(screen.getByRole("button", { name: /Early/ })).toBeInTheDocument();
  });

  it("excludes events entirely outside the visible startHour/endHour range", () => {
    const event = makeEvent({
      id: "night",
      title: "Night Owl",
      start: new Date(2050, 0, 5, 1, 0),
      end: new Date(2050, 0, 5, 2, 0),
    });
    render(
      <Scheduler date={WED_2050} events={[event]} startHour={8} endHour={18} />
    );
    expect(screen.queryByRole("button", { name: "Night Owl" })).not.toBeInTheDocument();
  });

  it("applies the selected treatment when selectedEventId matches", () => {
    const event = makeEvent({ id: "standup", title: "Standup" });
    render(
      <Scheduler date={WED_2050} events={[event]} selectedEventId="standup" />
    );
    expect(screen.getByRole("button", { name: "Standup" })).toHaveAttribute(
      "data-selected",
      "true"
    );
  });

  describe("editable (drag-to-reschedule)", () => {
    it("fires onEventChange with a snapped new start/end after a drag-move, preserving duration", () => {
      const onEventChange = vi.fn();
      const onEventClick = vi.fn();
      const event = makeEvent({ id: "standup", title: "Standup" }); // 9:00-10:00
      render(
        <Scheduler
          date={WED_2050}
          events={[event]}
          editable
          onEventChange={onEventChange}
          onEventClick={onEventClick}
        />
      );

      const button = screen.getByRole("button", { name: /Standup/ });
      fireEvent.pointerDown(button, { pointerId: 1, clientX: 100, clientY: 100 });
      fireEvent.pointerMove(button, {
        pointerId: 1,
        clientX: 100,
        clientY: 100 + SLOT_HEIGHT_PX * 2, // +2 slots = +60min at the default 30min slotDuration
      });
      fireEvent.pointerUp(button, {
        pointerId: 1,
        clientX: 100,
        clientY: 100 + SLOT_HEIGHT_PX * 2,
      });

      expect(onEventChange).toHaveBeenCalledTimes(1);
      const [changedEvent, newStart, newEnd] = onEventChange.mock.calls[0]!;
      expect(changedEvent).toBe(event);
      expect(newStart.getHours()).toBe(10);
      expect(newStart.getMinutes()).toBe(0);
      expect(newEnd.getHours()).toBe(11);
      expect(newEnd.getTime() - newStart.getTime()).toBe(60 * 60 * 1000);
      expect(onEventClick).not.toHaveBeenCalled();
    });

    it("fires onEventClick, not onEventChange, when a pointer sequence doesn't move", () => {
      const onEventChange = vi.fn();
      const onEventClick = vi.fn();
      const event = makeEvent({ id: "standup", title: "Standup" });
      render(
        <Scheduler
          date={WED_2050}
          events={[event]}
          editable
          onEventChange={onEventChange}
          onEventClick={onEventClick}
        />
      );

      const button = screen.getByRole("button", { name: /Standup/ });
      fireEvent.pointerDown(button, { pointerId: 1, clientX: 100, clientY: 100 });
      fireEvent.pointerUp(button, { pointerId: 1, clientX: 100, clientY: 100 });

      expect(onEventClick).toHaveBeenCalledTimes(1);
      expect(onEventClick).toHaveBeenCalledWith(event);
      expect(onEventChange).not.toHaveBeenCalled();
    });

    it("resizing only changes the end time, respecting minEventDuration", () => {
      const onEventChange = vi.fn();
      const event = makeEvent({ id: "standup", title: "Standup" }); // 9:00-10:00
      const { container } = render(
        <Scheduler
          date={WED_2050}
          events={[event]}
          editable
          minEventDuration={30}
          onEventChange={onEventChange}
        />
      );

      const handle = container.querySelector(`.${resizeHandle}`) as HTMLElement;
      expect(handle).toBeInTheDocument();

      fireEvent.pointerDown(handle, { pointerId: 2, clientX: 50, clientY: 200 });
      fireEvent.pointerMove(handle, {
        pointerId: 2,
        clientX: 50,
        clientY: 200 + SLOT_HEIGHT_PX, // +1 slot = +30min
      });
      fireEvent.pointerUp(handle, {
        pointerId: 2,
        clientX: 50,
        clientY: 200 + SLOT_HEIGHT_PX,
      });

      expect(onEventChange).toHaveBeenCalledTimes(1);
      const [, newStart, newEnd] = onEventChange.mock.calls[0]!;
      expect(newStart.getTime()).toBe(event.start.getTime());
      expect(newEnd.getHours()).toBe(10);
      expect(newEnd.getMinutes()).toBe(30);

      onEventChange.mockClear();

      // Dragging far past the start must clamp to minEventDuration, not shrink further.
      fireEvent.pointerDown(handle, { pointerId: 3, clientX: 50, clientY: 200 });
      fireEvent.pointerMove(handle, {
        pointerId: 3,
        clientX: 50,
        clientY: 200 - SLOT_HEIGHT_PX * 10,
      });
      fireEvent.pointerUp(handle, {
        pointerId: 3,
        clientX: 50,
        clientY: 200 - SLOT_HEIGHT_PX * 10,
      });

      expect(onEventChange).toHaveBeenCalledTimes(1);
      const [, clampedStart, clampedEnd] = onEventChange.mock.calls[0]!;
      expect(clampedStart.getTime()).toBe(event.start.getTime());
      expect(clampedEnd.getTime() - clampedStart.getTime()).toBe(30 * 60 * 1000);
    });

    it("ArrowDown/Up on a focused event moves it by one slotDuration, preserving duration", () => {
      const onEventChange = vi.fn();
      const event = makeEvent({ id: "standup", title: "Standup" }); // 9:00-10:00
      render(
        <Scheduler date={WED_2050} events={[event]} editable onEventChange={onEventChange} />
      );

      const button = screen.getByRole("button", { name: /Standup/ });
      fireEvent.keyDown(button, { key: "ArrowDown" });

      expect(onEventChange).toHaveBeenCalledTimes(1);
      const [, newStart, newEnd] = onEventChange.mock.calls[0]!;
      expect(newStart.getHours()).toBe(9);
      expect(newStart.getMinutes()).toBe(30);
      expect(newEnd.getHours()).toBe(10);
      expect(newEnd.getMinutes()).toBe(30);
    });

    it("Shift+ArrowDown on a focused event resizes only the end time by one slotDuration", () => {
      const onEventChange = vi.fn();
      const event = makeEvent({ id: "standup", title: "Standup" }); // 9:00-10:00
      render(
        <Scheduler date={WED_2050} events={[event]} editable onEventChange={onEventChange} />
      );

      const button = screen.getByRole("button", { name: /Standup/ });
      fireEvent.keyDown(button, { key: "ArrowDown", shiftKey: true });

      expect(onEventChange).toHaveBeenCalledTimes(1);
      const [, newStart, newEnd] = onEventChange.mock.calls[0]!;
      expect(newStart.getTime()).toBe(event.start.getTime());
      expect(newEnd.getHours()).toBe(10);
      expect(newEnd.getMinutes()).toBe(30);
    });

    it("ArrowLeft/Right on a focused event moves it to the adjacent day at the same time", () => {
      const onEventChange = vi.fn();
      const event = makeEvent({ id: "standup", title: "Standup" }); // Wed 9:00-10:00
      render(
        <Scheduler date={WED_2050} events={[event]} editable onEventChange={onEventChange} />
      );

      const button = screen.getByRole("button", { name: /Standup/ });
      fireEvent.keyDown(button, { key: "ArrowRight" });

      expect(onEventChange).toHaveBeenCalledTimes(1);
      const [, newStart, newEnd] = onEventChange.mock.calls[0]!;
      expect(newStart.getDate()).toBe(event.start.getDate() + 1);
      expect(newStart.getHours()).toBe(9);
      expect(newEnd.getDate()).toBe(event.end.getDate() + 1);
      expect(newEnd.getHours()).toBe(10);
    });
  });

  describe("non-editable (default)", () => {
    it("renders no resize handle and no data-editable/dragging attributes", () => {
      const onEventChange = vi.fn();
      const event = makeEvent({ id: "standup", title: "Standup" });
      const { container } = render(
        <Scheduler date={WED_2050} events={[event]} onEventChange={onEventChange} />
      );

      expect(container.querySelector(`.${resizeHandle}`)).not.toBeInTheDocument();
      const button = screen.getByRole("button", { name: "Standup" });
      expect(button).not.toHaveAttribute("data-editable");
      expect(button).not.toHaveAttribute("data-dragging");

      // Arrow keys should be a no-op without editable.
      fireEvent.keyDown(button, { key: "ArrowDown" });
      expect(onEventChange).not.toHaveBeenCalled();
    });
  });
});
