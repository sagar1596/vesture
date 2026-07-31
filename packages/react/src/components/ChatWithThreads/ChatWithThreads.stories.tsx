import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChatWithThreads } from "./ChatWithThreads";
import type { ChatThread } from "./types";

const meta: Meta<typeof ChatWithThreads> = {
  title: "Components/ChatWithThreads",
  component: ChatWithThreads,
  decorators: [
    (Story) => (
      <div style={{ height: "560px", width: "720px", border: "1px solid #e2e2e2", borderRadius: "8px" }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof ChatWithThreads>;

function initialThreads(): ChatThread[] {
  return [
    {
      id: "t1",
      title: "Trip planning",
      messages: [
        { id: "m1", role: "user", content: "Plan a weekend trip to the coast." },
        { id: "m2", role: "assistant", content: "Here's a two-day itinerary...", sender: { name: "Assistant" } }
      ],
      updatedAt: new Date("2026-07-30T10:00:00")
    },
    {
      id: "t2",
      title: "Recipe ideas",
      messages: [{ id: "m3", role: "user", content: "Give me a quick pasta recipe." }],
      updatedAt: new Date("2026-07-30T09:00:00")
    },
    {
      id: "t3",
      title: "Debugging session",
      messages: [],
      updatedAt: new Date("2026-07-29T15:00:00")
    }
  ];
}

export const Default: Story = {
  render: () => {
    function Demo() {
      const [threads, setThreads] = useState<ChatThread[]>(initialThreads());
      const [activeThreadId, setActiveThreadId] = useState("t1");

      return (
        <ChatWithThreads
          threads={threads}
          activeThreadId={activeThreadId}
          onThreadChange={setActiveThreadId}
          onSendMessage={(content) => {
            setThreads((prev) =>
              prev.map((thread) =>
                thread.id === activeThreadId
                  ? {
                      ...thread,
                      messages: [...thread.messages, { id: crypto.randomUUID(), role: "user", content }],
                      updatedAt: new Date()
                    }
                  : thread
              )
            );
          }}
          onNewThread={() => {
            const id = crypto.randomUUID();
            setThreads((prev) => [
              { id, title: "New conversation", messages: [], updatedAt: new Date() },
              ...prev
            ]);
            setActiveThreadId(id);
          }}
          onDeleteThread={(id) => {
            setThreads((prev) => prev.filter((thread) => thread.id !== id));
            if (id === activeThreadId) {
              setActiveThreadId((prev) => threads.find((t) => t.id !== prev)?.id ?? "");
            }
          }}
          onRenameThread={(id, title) => {
            setThreads((prev) => prev.map((thread) => (thread.id === id ? { ...thread, title } : thread)));
          }}
        />
      );
    }
    return <Demo />;
  }
};

export const EmptyThreadList: Story = {
  render: () => {
    function Demo() {
      const [threads, setThreads] = useState<ChatThread[]>([]);
      const [activeThreadId, setActiveThreadId] = useState("");
      return (
        <ChatWithThreads
          threads={threads}
          activeThreadId={activeThreadId}
          onThreadChange={setActiveThreadId}
          onNewThread={() => {
            const id = crypto.randomUUID();
            setThreads([{ id, title: "New conversation", messages: [], updatedAt: new Date() }]);
            setActiveThreadId(id);
          }}
        />
      );
    }
    return <Demo />;
  }
};

export const ReadOnlyNoThreadManagement: Story = {
  args: {
    threads: initialThreads(),
    activeThreadId: "t1",
    onThreadChange: () => {}
  }
};
