import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Scheduler } from "./Scheduler";
import type { SchedulerEvent } from "./types";

const meta: Meta<typeof Scheduler> = {
  title: "Components/Scheduler",
  component: Scheduler,
};

export default meta;
type Story = StoryObj<typeof Scheduler>;

// Monday of a fixed reference week, so stories render identically regardless of when
// Storybook is run.
const WEEK = new Date(2050, 0, 3);

function at(dayOffset: number, hour: number, minute = 0): Date {
  const date = new Date(WEEK);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function SchedulerHarness({ events, startHour, endHour }: { events: SchedulerEvent[]; startHour?: number; endHour?: number }) {
  const [date, setDate] = useState(WEEK);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  return (
    <Scheduler
      date={date}
      onDateChange={setDate}
      events={events}
      startHour={startHour}
      endHour={endHour}
      selectedEventId={selectedEventId}
      onEventClick={(event) => setSelectedEventId(event.id)}
    />
  );
}

export const Default: Story = {
  render: () => (
    <SchedulerHarness
      events={[
        { id: "1", title: "Team Standup", start: at(1, 9), end: at(1, 9, 30) },
        { id: "2", title: "Design Review", start: at(1, 11), end: at(1, 12) },
        { id: "3", title: "Lunch", start: at(2, 12), end: at(2, 13) },
        { id: "4", title: "1:1 with Manager", start: at(2, 14), end: at(2, 14, 30) },
        { id: "5", title: "Deep Work", start: at(3, 9), end: at(3, 12) },
        { id: "6", title: "Sprint Planning", start: at(4, 10), end: at(4, 11, 30) },
        { id: "7", title: "Retro", start: at(4, 16), end: at(4, 17) },
      ]}
    />
  ),
};

export const OverlappingEvents: Story = {
  render: () => (
    <SchedulerHarness
      events={[
        { id: "a", title: "Client Call", start: at(2, 9), end: at(2, 10, 30) },
        { id: "b", title: "Interview: Frontend", start: at(2, 9, 30), end: at(2, 10) },
        { id: "c", title: "Interview: Backend", start: at(2, 9, 45), end: at(2, 10, 15) },
        { id: "d", title: "Follow-up Sync", start: at(2, 10), end: at(2, 11) },
        { id: "e", title: "All-Hands Prep", start: at(2, 10, 45), end: at(2, 11, 30) },
      ]}
    />
  ),
};

export const AllDayEvents: Story = {
  render: () => (
    <SchedulerHarness
      events={[
        { id: "conf", title: "Company Offsite", start: at(1, 0), end: at(3, 0), allDay: true },
        { id: "holiday", title: "Public Holiday", start: at(4, 0), end: at(4, 0), allDay: true },
        { id: "standup", title: "Standup", start: at(1, 9), end: at(1, 9, 30) },
      ]}
    />
  ),
};

export const RestrictedHours: Story = {
  render: () => (
    <SchedulerHarness
      startHour={7}
      endHour={19}
      events={[
        { id: "1", title: "Morning Sync", start: at(1, 7, 30), end: at(1, 8) },
        { id: "2", title: "Late Night Ops", start: at(1, 22), end: at(1, 23) },
        { id: "3", title: "Overflowing Meeting", start: at(2, 18), end: at(2, 20) },
      ]}
    />
  ),
};

export const EmptyWeek: Story = {
  render: () => <SchedulerHarness events={[]} />,
};

function EditableHarness({ initialEvents }: { initialEvents: SchedulerEvent[] }) {
  const [date, setDate] = useState(WEEK);
  const [events, setEvents] = useState(initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

  const handleEventChange = (event: SchedulerEvent, newStart: Date, newEnd: Date) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? { ...e, start: newStart, end: newEnd } : e))
    );
  };

  return (
    <Scheduler
      date={date}
      onDateChange={setDate}
      events={events}
      editable
      onEventChange={handleEventChange}
      selectedEventId={selectedEventId}
      onEventClick={(event) => setSelectedEventId(event.id)}
    />
  );
}

export const EditableDragToMove: Story = {
  render: () => (
    <EditableHarness
      initialEvents={[
        { id: "1", title: "Team Standup", start: at(1, 9), end: at(1, 9, 30) },
        { id: "2", title: "Design Review", start: at(1, 11), end: at(1, 12) },
        { id: "3", title: "Deep Work", start: at(3, 9), end: at(3, 12) },
      ]}
    />
  ),
};

export const EditableResize: Story = {
  render: () => (
    <EditableHarness
      initialEvents={[
        { id: "1", title: "Team Standup", start: at(1, 9), end: at(1, 9, 30) },
        { id: "2", title: "Design Review", start: at(1, 11), end: at(1, 12) },
      ]}
    />
  ),
};

export const EditableKeyboardOnly: Story = {
  render: () => (
    <div>
      <p style={{ fontFamily: "sans-serif", fontSize: 13, marginBottom: 8 }}>
        Tab to an event, then use Arrow Up/Down/Left/Right to move it (one slotDuration or one
        day at a time), or Shift+Arrow Up/Down to resize its end time. Manual accessibility
        testing: no pointer required.
      </p>
      <EditableHarness
        initialEvents={[
          { id: "1", title: "Team Standup", start: at(1, 9), end: at(1, 9, 30) },
          { id: "2", title: "Design Review", start: at(1, 11), end: at(1, 12) },
        ]}
      />
    </div>
  ),
};
