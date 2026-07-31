import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart } from "../charts/BarChart";
import type { BarChartDataPoint } from "../charts/BarChart";
import { Chat } from "./Chat";
import type { ChatMessage } from "./types";

const meta: Meta<typeof Chat> = {
  title: "Components/Chat",
  component: Chat,
  decorators: [
    (Story) => (
      <div style={{ height: "560px", width: "480px", border: "1px solid #e2e2e2", borderRadius: "8px" }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof Chat>;

const BASE_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Can you show me a **markdown** example with a list?",
    timestamp: new Date("2026-07-30T10:00:00")
  },
  {
    id: "2",
    role: "assistant",
    content: "Sure! Here's a short list:\n\n- First item\n- Second item\n- `inline code` too\n\n> A blockquote for good measure.",
    timestamp: new Date("2026-07-30T10:00:05"),
    sender: { name: "Assistant" }
  }
];

export const BasicConversation: Story = {
  render: (args) => {
    function Demo() {
      const [messages, setMessages] = useState<ChatMessage[]>(BASE_MESSAGES);
      return (
        <Chat
          {...args}
          messages={messages}
          onSendMessage={(content) => {
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: "user", content, timestamp: new Date() }
            ]);
          }}
        />
      );
    }
    return <Demo />;
  }
};

export const EmptyConversation: Story = {
  args: { messages: [] }
};

const STREAM_TOKENS =
  "Streaming responses arrive incrementally — the consumer owns the fetch/SSE handling and just keeps appending to `content` while `streaming` stays true, token by token, until the response completes."
    .split(" ");

export const StreamingResponse: Story = {
  render: (args) => {
    function Demo() {
      const [messages, setMessages] = useState<ChatMessage[]>([]);
      const [isGenerating, setIsGenerating] = useState(false);
      const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

      function simulateStream() {
        const assistantId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "", streaming: true, sender: { name: "Assistant" } }
        ]);
        setIsGenerating(true);
        let index = 0;
        timerRef.current = setInterval(() => {
          index += 1;
          const partial = STREAM_TOKENS.slice(0, index).join(" ");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: partial, streaming: index < STREAM_TOKENS.length } : m
            )
          );
          if (index >= STREAM_TOKENS.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsGenerating(false);
          }
        }, 80);
      }

      useEffect(() => () => {
        if (timerRef.current) clearInterval(timerRef.current);
      }, []);

      return (
        <Chat
          {...args}
          messages={messages}
          isGenerating={isGenerating}
          onSendMessage={(content) => {
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }]);
            simulateStream();
          }}
        />
      );
    }
    return <Demo />;
  }
};

export const WithSuggestions: Story = {
  args: {
    messages: [],
    suggestions: ["What can you do?", "Summarize this page", "Write a haiku about React"]
  }
};

export const WithMessageActions: Story = {
  render: (args) => {
    function Demo() {
      const [messages, setMessages] = useState<ChatMessage[]>([
        { id: "1", role: "user", content: "What's the capital of France?" },
        { id: "2", role: "assistant", content: "The capital of France is **Paris**.", sender: { name: "Assistant" } },
        { id: "3", role: "user", content: "This one failed to send.", status: "error" }
      ]);
      return (
        <Chat
          {...args}
          messages={messages}
          onSendMessage={(content) =>
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }])
          }
          onEditMessage={(id, content) =>
            setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)))
          }
          onDeleteMessage={(id) => setMessages((prev) => prev.filter((m) => m.id !== id))}
          onRegenerateMessage={(id) =>
            setMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, content: `${m.content}\n\n_(regenerated)_` } : m))
            )
          }
          onRetryMessage={(id) =>
            setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: "sent" } : m)))
          }
        />
      );
    }
    return <Demo />;
  }
};

export const WithAttachments: Story = {
  args: {
    messages: [
      {
        id: "1",
        role: "user",
        content: "Here's the screenshot and the report.",
        attachments: [
          { name: "screenshot.png", url: "https://picsum.photos/seed/vesture/300/180", type: "image/png" },
          { name: "quarterly-report.pdf", url: "https://example.com/quarterly-report.pdf", type: "application/pdf" }
        ]
      }
    ]
  }
};

export const WithCodeBlocks: Story = {
  args: {
    messages: [
      {
        id: "1",
        role: "assistant",
        content:
          "Here's a small TypeScript example:\n\n```ts\nfunction add(a: number, b: number): number {\n  return a + b;\n}\n\nconst result = add(2, 3);\nconsole.log(result);\n```\n\nAnd the equivalent in Python:\n\n```python\ndef add(a, b):\n    return a + b\n\nprint(add(2, 3))\n```"
      }
    ]
  }
};

export const WithSpeechToText: Story = {
  render: (args) => {
    function Demo() {
      const [messages, setMessages] = useState<ChatMessage[]>([]);
      return (
        <Chat
          {...args}
          messages={messages}
          onSendMessage={(content) =>
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content }])
          }
        />
      );
    }
    return <Demo />;
  }
};

export const Disabled: Story = {
  args: {
    messages: BASE_MESSAGES,
    disabled: true,
    placeholder: "Chat is disabled"
  }
};

// ═══════════════════════════════════════════
// Message grouping
// ═══════════════════════════════════════════

export const MessageGrouping: Story = {
  args: {
    messages: [
      {
        id: "1",
        role: "assistant",
        content: "Let me walk you through this in a few steps.",
        sender: { name: "Assistant" },
        timestamp: new Date("2026-07-31T09:00:00")
      },
      {
        id: "2",
        role: "assistant",
        content: "First, install the package.",
        sender: { name: "Assistant" },
        timestamp: new Date("2026-07-31T09:00:20")
      },
      {
        id: "3",
        role: "assistant",
        content: "Then, import it into your app.",
        sender: { name: "Assistant" },
        timestamp: new Date("2026-07-31T09:00:40")
      },
      {
        id: "4",
        role: "user",
        content: "Got it, thanks!",
        timestamp: new Date("2026-07-31T09:01:00")
      },
      {
        id: "5",
        role: "user",
        content: "One more question though.",
        timestamp: new Date("2026-07-31T09:01:05")
      },
      {
        id: "6",
        role: "assistant",
        content: "This one starts a new group — more than 5 minutes have passed.",
        sender: { name: "Assistant" },
        timestamp: new Date("2026-07-31T09:10:00")
      }
    ]
  }
};

// ═══════════════════════════════════════════
// Tool-call / generative UI rendering (Feature 3)
// ═══════════════════════════════════════════

const REVENUE_BY_QUARTER: BarChartDataPoint[] = [
  { category: "Q1", revenue: 120 },
  { category: "Q2", revenue: 180 },
  { category: "Q3", revenue: 150 },
  { category: "Q4", revenue: 240 }
];

/**
 * Chat ships no built-in tool-call types — this is the pattern a consumer
 * follows to wire one up: check `toolCall.type` against whatever
 * discriminators their own backend/agent emits, and render accordingly with
 * `toolCall.data`. Here "bar-chart" renders the existing BarChart component;
 * an unrecognized type falls back to a plain message so unknown/future
 * tool-call types never render as nothing.
 */
function renderToolCall(toolCall: { type: string; data: unknown }) {
  if (toolCall.type === "bar-chart") {
    const { data, series, width, height } = toolCall.data as {
      data: BarChartDataPoint[];
      series: { key: string; label: string }[];
      width: number;
      height: number;
    };
    return <BarChart width={width} height={height} data={data} series={series} />;
  }
  return <em>Unsupported tool call: {toolCall.type}</em>;
}

export const WithToolCallRendering: Story = {
  args: {
    messages: [
      { id: "1", role: "user", content: "How did revenue trend this year?" },
      {
        id: "2",
        role: "assistant",
        content: "Here's quarterly revenue:",
        sender: { name: "Assistant" },
        toolCall: {
          type: "bar-chart",
          data: {
            data: REVENUE_BY_QUARTER,
            series: [{ key: "revenue", label: "Revenue" }],
            width: 340,
            height: 200
          }
        }
      }
    ],
    renderToolCall
  }
};

// ═══════════════════════════════════════════
// Keyboard shortcuts (Feature 4)
// ═══════════════════════════════════════════

export const KeyboardShortcuts: Story = {
  args: {
    messages: [{ id: "1", role: "user", content: "This was my last message — press Arrow-Up in the empty input below to bring it back." }],
    placeholder: 'Press "/" anywhere on this page to focus me, or Arrow-Up here when empty'
  }
};

export const CustomFocusShortcut: Story = {
  args: {
    messages: [],
    focusShortcut: "mod+k",
    placeholder: "Press Cmd/Ctrl+K anywhere on this page to focus me"
  }
};

export const FocusShortcutDisabled: Story = {
  args: {
    messages: [],
    focusShortcut: null,
    placeholder: 'The "/" shortcut is disabled for this instance'
  }
};

// ═══════════════════════════════════════════
// Input layout regression — attach button must never overlap the textarea,
// at both a short single-line input and a tall multi-line one.
// ═══════════════════════════════════════════

export const InputAreaShortAndExpanded: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "480px" }}>
        <Story />
      </div>
    )
  ],
  render: (args) => {
    function Demo() {
      const [shortMessages] = useState<ChatMessage[]>([]);
      const [expandedMessages] = useState<ChatMessage[]>([]);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <p style={{ fontSize: "13px", marginBottom: "8px" }}>Short (empty) input:</p>
            <div style={{ height: "260px", border: "1px solid #e2e2e2", borderRadius: "8px" }}>
              <Chat {...args} messages={shortMessages} />
            </div>
          </div>
          <div>
            <p style={{ fontSize: "13px", marginBottom: "8px" }}>
              Expanded input — type more than 5 lines below to grow the textarea toward its 5-row max
              height (it scrolls internally past that) and confirm the attach/mic/send buttons stay put
              beside it, and the message list above never gets overlapped:
            </p>
            <div style={{ height: "420px", border: "1px solid #e2e2e2", borderRadius: "8px" }}>
              <Chat {...args} messages={expandedMessages} />
            </div>
          </div>
        </div>
      );
    }
    return <Demo />;
  }
};
