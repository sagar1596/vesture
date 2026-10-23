import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Gantt } from "./Gantt";
import type { GanttTask } from "./types";

const initial: GanttTask[] = [
  { id: "plan", name: "Planning", start: "2026-03-02", end: "2026-03-13" },
  { id: "scope", name: "Scope", start: "2026-03-02", end: "2026-03-06", parentId: "plan", progress: 100 },
  { id: "spec", name: "Spec", start: "2026-03-09", end: "2026-03-13", parentId: "plan", progress: 60, dependsOn: ["scope"] },
  { id: "build", name: "Build", start: "2026-03-16", end: "2026-04-03" },
  { id: "api", name: "API", start: "2026-03-16", end: "2026-03-27", parentId: "build", progress: 30, dependsOn: ["spec"] },
  { id: "ui", name: "UI", start: "2026-03-19", end: "2026-04-03", parentId: "build", progress: 10, dependsOn: ["spec"] },
  { id: "qa", name: "QA", start: "2026-04-06", end: "2026-04-10", dependsOn: ["api", "ui"] },
  { id: "ship", name: "Release", start: "2026-04-13", end: "2026-04-13", dependsOn: ["qa"] }
];

const meta: Meta<typeof Gantt> = {
  title: "Components/Gantt",
  component: Gantt
};

export default meta;
type Story = StoryObj<typeof Gantt>;

export const ReadOnly: Story = {
  render: () => <Gantt tasks={initial} today="2026-03-18" />
};

export const Editable: Story = {
  render: () => {
    const [tasks, setTasks] = useState(initial);
    return (
      <Gantt
        tasks={tasks}
        today="2026-03-18"
        onTaskChange={(id, change) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...change } : t)))}
      />
    );
  }
};

export const CustomColumnsMilestonesAndColors: Story = {
  render: () => {
    const [tasks, setTasks] = useState<GanttTask[]>([
      ...initial.map((t) => (t.id === "api" ? { ...t, color: "#1baf7a" } : t)),
      { id: "launch", name: "Launch day", start: "2026-04-15", end: "2026-04-15", type: "milestone", color: "#e34948", dependsOn: ["ship"] }
    ]);
    return (
      <Gantt
        tasks={tasks}
        today="2026-03-18"
        listWidth={180}
        snapDays={1}
        nameHeader="Work item"
        columns={[
          { key: "progress", header: "Done", width: 60, render: (t) => (t.progress !== undefined ? `${t.progress}%` : "–") },
          { key: "start", header: "Start", width: 90, render: (t) => t.start }
        ]}
        isTaskEditable={(t) => (t.progress ?? 0) < 100}
        renderBarLabel={(t) => (t.progress ? `${t.name} · ${t.progress}%` : t.name)}
        onTaskChange={(id, change) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...change } : t)))}
      />
    );
  }
};

export const WeeklyScaleWithSnap: Story = {
  render: () => <Gantt tasks={initial} today="2026-03-18" dayWidth={18} scale="week" snapDays={7} weekendDays={[]} onTaskChange={() => {}} />
};
