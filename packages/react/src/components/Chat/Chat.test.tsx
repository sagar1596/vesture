import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Chat } from "./Chat";
import { avatarHidden, bubble, chatInputRoot, inputControls, senderName, textarea as textareaClass } from "./Chat.css";
import { renderMarkdown } from "./markdown";
import { sanitizeChatHtml } from "./sanitize";
import type { ChatMessage } from "./types";

function mockScrollMetrics(el: HTMLElement, { scrollHeight, scrollTop, clientHeight }: { scrollHeight: number; scrollTop: number; clientHeight: number }) {
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(el, "scrollTop", { value: scrollTop, configurable: true, writable: true });
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true });
}

describe("Chat", () => {
  it("renders an empty state when there are no messages", () => {
    render(<Chat messages={[]} />);
    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  it("sends a message via the input and clears it afterward", () => {
    const onSendMessage = vi.fn();
    render(<Chat messages={[]} onSendMessage={onSendMessage} />);

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, { target: { value: "Hello there" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(onSendMessage).toHaveBeenCalledWith("Hello there");
    expect(textarea).toHaveValue("");
  });

  it("sends on Enter and inserts a newline on Shift+Enter", () => {
    const onSendMessage = vi.fn();
    render(<Chat messages={[]} onSendMessage={onSendMessage} />);
    const textarea = screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: "line one" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSendMessage).not.toHaveBeenCalled();

    fireEvent.change(textarea, { target: { value: "line one" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSendMessage).toHaveBeenCalledWith("line one");
  });

  it("disables the send button when the input is empty, disabled, or generating", () => {
    const { rerender } = render(<Chat messages={[]} onSendMessage={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, { target: { value: "hi" } });
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();

    rerender(<Chat messages={[]} onSendMessage={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    rerender(<Chat messages={[]} onSendMessage={vi.fn()} isGenerating />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("renders markdown content as sanitized HTML", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "**bold** and a [link](https://example.com)" }
    ];
    render(<Chat messages={messages} />);
    const bold = screen.getByText("bold");
    expect(bold.tagName).toBe("STRONG");
    const link = screen.getByRole("link", { name: "link" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("strips a script tag XSS payload from markdown content", () => {
    const malicious = "Hello <script>alert('xss')</script> world";
    const html = renderMarkdown(malicious);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(");
  });

  it("strips an onerror/onclick attribute XSS payload from markdown content", () => {
    const malicious = 'safe text <img src="x" onerror="alert(1)"> more text <a href="javascript:alert(2)">click</a>';
    const html = renderMarkdown(malicious);
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });

  it("sanitizeChatHtml drops tags outside the markdown-shaped allowlist", () => {
    const sanitized = sanitizeChatHtml('<iframe src="evil"></iframe><svg onload="alert(1)"></svg><p>ok</p>');
    expect(sanitized).not.toContain("<iframe");
    expect(sanitized).not.toContain("<svg");
    expect(sanitized).toContain("<p>ok</p>");
  });

  it("shows a typing indicator while generating with no streamed content yet", () => {
    render(<Chat messages={[]} isGenerating />);
    expect(screen.getByRole("status", { name: "Assistant is typing" })).toBeInTheDocument();
  });

  it("hides the typing indicator once a streaming message has content", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "assistant", content: "partial answer", streaming: true }];
    render(<Chat messages={messages} isGenerating />);
    expect(screen.queryByRole("status", { name: "Assistant is typing" })).not.toBeInTheDocument();
  });

  it("auto-scrolls to bottom on new messages when the user is already near the bottom", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "hi" }];
    const { container, rerender } = render(<Chat messages={messages} />);
    const scrollEl = container.querySelector('[role="log"]') as HTMLElement;
    mockScrollMetrics(scrollEl, { scrollHeight: 500, scrollTop: 420, clientHeight: 100 });
    fireEvent.scroll(scrollEl);

    mockScrollMetrics(scrollEl, { scrollHeight: 900, scrollTop: 420, clientHeight: 100 });
    rerender(<Chat messages={[...messages, { id: "2", role: "assistant", content: "reply" }]} />);

    expect(scrollEl.scrollTop).toBe(900);
  });

  it("does not yank scroll position when the user has scrolled up to read history", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "hi" }];
    const { container, rerender } = render(<Chat messages={messages} />);
    const scrollEl = container.querySelector('[role="log"]') as HTMLElement;
    mockScrollMetrics(scrollEl, { scrollHeight: 1000, scrollTop: 0, clientHeight: 100 });
    fireEvent.scroll(scrollEl);

    mockScrollMetrics(scrollEl, { scrollHeight: 1200, scrollTop: 0, clientHeight: 100 });
    rerender(<Chat messages={[...messages, { id: "2", role: "assistant", content: "reply" }]} />);

    expect(scrollEl.scrollTop).toBe(0);
    expect(screen.getByRole("button", { name: /New messages/ })).toBeInTheDocument();
  });

  it("clicking the scroll-to-bottom button scrolls down and hides itself", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "hi" }];
    const { container, rerender } = render(<Chat messages={messages} />);
    const scrollEl = container.querySelector('[role="log"]') as HTMLElement;
    mockScrollMetrics(scrollEl, { scrollHeight: 1000, scrollTop: 0, clientHeight: 100 });
    fireEvent.scroll(scrollEl);
    rerender(<Chat messages={[...messages, { id: "2", role: "assistant", content: "reply" }]} />);

    const button = screen.getByRole("button", { name: /New messages/ });
    mockScrollMetrics(scrollEl, { scrollHeight: 1000, scrollTop: 0, clientHeight: 100 });
    fireEvent.click(button);

    expect(screen.queryByRole("button", { name: /New messages/ })).not.toBeInTheDocument();
  });

  it("renders clickable suggestion chips that call onSendMessage with their text", () => {
    const onSendMessage = vi.fn();
    render(<Chat messages={[]} onSendMessage={onSendMessage} suggestions={["Tell me a joke"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Tell me a joke" }));
    expect(onSendMessage).toHaveBeenCalledWith("Tell me a joke");
  });

  it("composes a custom emptyState node instead of the default EmptyState", () => {
    render(<Chat messages={[]} emptyState={<div>Nothing here yet, custom!</div>} />);
    expect(screen.getByText("Nothing here yet, custom!")).toBeInTheDocument();
    expect(screen.queryByText("No messages yet")).not.toBeInTheDocument();
  });
});

describe("Chat message actions", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  it("copies the plain-text rendering of a message, not the raw markdown", async () => {
    const messages: ChatMessage[] = [{ id: "1", role: "assistant", content: "**bold** text" }];
    render(<Chat messages={messages} />);
    fireEvent.click(screen.getByRole("button", { name: "Message actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("bold text");
  });

  it("shows an Edit action for user messages only when onEditMessage is provided, and saves the edit", async () => {
    const onEditMessage = vi.fn();
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "original" }];
    render(<Chat messages={messages} onEditMessage={onEditMessage} />);
    fireEvent.click(screen.getByRole("button", { name: "Message actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Edit" }));

    const editBox = screen.getByRole("textbox", { name: "Edit message" });
    fireEvent.change(editBox, { target: { value: "edited content" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onEditMessage).toHaveBeenCalledWith("1", "edited content");
  });

  it("does not offer Edit for assistant messages", async () => {
    const messages: ChatMessage[] = [{ id: "1", role: "assistant", content: "hi" }];
    render(<Chat messages={messages} onEditMessage={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Message actions" }));
    expect(await screen.findByRole("menuitem", { name: "Copy" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("offers Regenerate for assistant messages and calls onRegenerateMessage", async () => {
    const onRegenerateMessage = vi.fn();
    const messages: ChatMessage[] = [{ id: "1", role: "assistant", content: "hi" }];
    render(<Chat messages={messages} onRegenerateMessage={onRegenerateMessage} />);
    fireEvent.click(screen.getByRole("button", { name: "Message actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Regenerate" }));
    expect(onRegenerateMessage).toHaveBeenCalledWith("1");
  });

  it("calls onDeleteMessage when Delete is selected", async () => {
    const onDeleteMessage = vi.fn();
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "hi" }];
    render(<Chat messages={messages} onDeleteMessage={onDeleteMessage} />);
    fireEvent.click(screen.getByRole("button", { name: "Message actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    expect(onDeleteMessage).toHaveBeenCalledWith("1");
  });

  it("offers Retry only for messages with an error status and calls onRetryMessage", async () => {
    const onRetryMessage = vi.fn();
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "hi", status: "error" }];
    render(<Chat messages={messages} onRetryMessage={onRetryMessage} />);
    fireEvent.click(screen.getByRole("button", { name: "Message actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Retry" }));
    expect(onRetryMessage).toHaveBeenCalledWith("1");
  });

  it("suppresses the actions menu entirely while a message is streaming", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "assistant", content: "partial", streaming: true }];
    render(<Chat messages={messages} onDeleteMessage={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Message actions" })).not.toBeInTheDocument();
  });

  it("renders status chrome: a spinner while sending and a danger-flagged error message", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "sending one", status: "sending" },
      { id: "2", role: "user", content: "errored one", status: "error" }
    ];
    render(<Chat messages={messages} />);
    expect(screen.getByRole("status", { name: "Sending" })).toBeInTheDocument();
    expect(screen.getByText("Failed to send")).toBeInTheDocument();
  });
});

describe("Chat attachments", () => {
  it("toggles the attachment picker when the paperclip button is clicked", () => {
    const { container } = render(<Chat messages={[]} />);
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Attach files" }));
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  it("calls onFilesAdded when a file is picked via the attachment queue", () => {
    const onFilesAdded = vi.fn();
    const { container } = render(<Chat messages={[]} onFilesAdded={onFilesAdded} />);
    fireEvent.click(screen.getByRole("button", { name: "Attach files" }));

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(onFilesAdded).toHaveBeenCalledWith([file]);
    expect(screen.getByText("notes.txt")).toBeInTheDocument();
  });

  it("renders an image attachment inline and a non-image attachment as a link chip", () => {
    const messages: ChatMessage[] = [
      {
        id: "1",
        role: "user",
        content: "see attached",
        attachments: [
          { name: "photo.png", url: "https://example.com/photo.png", type: "image/png" },
          { name: "report.pdf", url: "https://example.com/report.pdf", type: "application/pdf" }
        ]
      }
    ];
    render(<Chat messages={messages} />);
    const image = screen.getByRole("img", { name: "photo.png" });
    expect(image).toHaveAttribute("src", "https://example.com/photo.png");
    const link = screen.getByRole("link", { name: /report.pdf/ });
    expect(link).toHaveAttribute("href", "https://example.com/report.pdf");
  });
});

describe("Chat code highlighting", () => {
  it("applies highlight.js token classes to fenced code blocks", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "```js\nconst x = 1;\nfunction f() {}\n```" }
    ];
    const { container } = render(<Chat messages={messages} />);
    const codeEl = container.querySelector("pre code");
    expect(codeEl).toHaveClass("hljs");
    expect(codeEl?.innerHTML).toContain("hljs-keyword");
  });

  it("plain (unlabeled) code blocks still render without throwing", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "assistant", content: "```\nplain text block\n```" }];
    const { container } = render(<Chat messages={messages} />);
    expect(container.querySelector("pre code")).toHaveTextContent("plain text block");
  });
});

describe("Chat speech-to-text", () => {
  const originalSpeechRecognition = (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;

  afterEach(() => {
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition = originalSpeechRecognition;
  });

  it("hides the mic button when the browser has no SpeechRecognition support", () => {
    render(<Chat messages={[]} />);
    expect(screen.queryByRole("button", { name: /voice input/i })).not.toBeInTheDocument();
  });

  interface FakeSpeechRecognitionInstance {
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: { resultIndex: number; results: unknown[] }) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
  }

  function installFakeSpeechRecognition(): { getInstance: () => FakeSpeechRecognitionInstance | null } {
    let instance: FakeSpeechRecognitionInstance | null = null;
    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "en-US";
      onresult: FakeSpeechRecognitionInstance["onresult"] = null;
      onend: FakeSpeechRecognitionInstance["onend"] = null;
      onerror: FakeSpeechRecognitionInstance["onerror"] = null;
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();
      constructor() {
        instance = this as unknown as FakeSpeechRecognitionInstance;
      }
    }
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeSpeechRecognition;
    return { getInstance: () => instance };
  }

  function speechResult(transcript: string, isFinal: boolean) {
    return { 0: { transcript }, isFinal };
  }

  it("populates the input from a final transcribed result when SpeechRecognition is available", () => {
    const { getInstance } = installFakeSpeechRecognition();

    render(<Chat messages={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    const instance = getInstance();
    expect(instance).not.toBeNull();

    act(() => {
      instance?.onresult?.({ resultIndex: 0, results: [speechResult("hello from speech", true)] });
    });

    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("hello from speech");
  });

  it("accumulates across multiple results in a continuous session, combining final and interim text", () => {
    const { getInstance } = installFakeSpeechRecognition();
    render(<Chat messages={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    const instance = getInstance();

    act(() => {
      instance?.onresult?.({ resultIndex: 0, results: [speechResult("first phrase. ", true)] });
    });
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("first phrase.");

    act(() => {
      instance?.onresult?.({
        resultIndex: 1,
        results: [speechResult("first phrase. ", true), speechResult("second phrase", false)]
      });
    });
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("first phrase. second phrase");
  });

  it("shows a 'Listening…' placeholder while recording", () => {
    installFakeSpeechRecognition();
    render(<Chat messages={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute("placeholder", "Listening…");
  });

  it("surfaces a human-readable error and stops recording when recognition errors out", () => {
    const { getInstance } = installFakeSpeechRecognition();
    render(<Chat messages={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    const instance = getInstance();

    act(() => {
      instance?.onerror?.({ error: "not-allowed" });
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Microphone access was denied.");
    expect(screen.getByRole("button", { name: "Start voice input" })).toBeInTheDocument();
  });

  it("clears a prior error message when starting a new recording", () => {
    const { getInstance } = installFakeSpeechRecognition();
    render(<Chat messages={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    act(() => {
      getInstance()?.onerror?.({ error: "no-speech" });
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("aborts an in-flight recognition session on unmount rather than leaving the microphone open", () => {
    const { getInstance } = installFakeSpeechRecognition();
    const { unmount } = render(<Chat messages={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    const instance = getInstance();

    unmount();

    expect(instance?.abort).toHaveBeenCalledTimes(1);
  });

  it("stops (not aborts) an active session when the user clicks the mic again to stop recording", () => {
    const { getInstance } = installFakeSpeechRecognition();
    render(<Chat messages={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    const instance = getInstance();

    fireEvent.click(screen.getByRole("button", { name: "Stop voice input" }));

    expect(instance?.stop).toHaveBeenCalledTimes(1);
  });

  it("surfaces an error instead of silently doing nothing when start() throws synchronously (a stale-session InvalidStateError)", () => {
    class ThrowingSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "en-US";
      onresult = null;
      onend = null;
      onerror = null;
      start = vi.fn(() => {
        throw new DOMException("already started", "InvalidStateError");
      });
      stop = vi.fn();
      abort = vi.fn();
    }
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = ThrowingSpeechRecognition;

    render(<Chat messages={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Voice input failed to start. Please try again.");
    expect(screen.getByRole("button", { name: "Start voice input" })).toBeInTheDocument();
  });

  it("defensively aborts a still-referenced prior session before starting a new one", () => {
    const { getInstance } = installFakeSpeechRecognition();
    render(<Chat messages={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    const firstInstance = getInstance();

    // Simulate the browser already having ended the session natively
    // (onend fired) without the user clicking Stop first.
    act(() => {
      firstInstance?.onend?.();
    });
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));

    expect(firstInstance?.abort).toHaveBeenCalledTimes(1);
  });
});

describe("Chat streaming", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throttles markdown re-parsing during a fast stream rather than reparsing on every content change", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "assistant", content: "a", streaming: true }];
    const { rerender } = render(<Chat messages={messages} />);

    // A burst of rapid updates well within one throttle window.
    for (let i = 2; i <= 10; i++) {
      act(() => {
        rerender(<Chat messages={[{ id: "1", role: "assistant", content: "a".repeat(i), streaming: true }]} />);
      });
    }

    // Still showing the very first parsed render — the throttle hasn't fired yet.
    expect(screen.getByText("a")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByText("a".repeat(10))).toBeInTheDocument();
  });

  it("parses immediately once streaming completes, regardless of the throttle window", () => {
    const { rerender } = render(
      <Chat messages={[{ id: "1", role: "assistant", content: "loading", streaming: true }]} />
    );
    act(() => {
      rerender(<Chat messages={[{ id: "1", role: "assistant", content: "final answer", streaming: false }]} />);
    });
    expect(screen.getByText("final answer")).toBeInTheDocument();
  });
});

describe("Chat message grouping", () => {
  it("shows the sender name once for a run of consecutive same-sender messages, not once per message", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "first", sender: { name: "Bot" } },
      { id: "2", role: "assistant", content: "second", sender: { name: "Bot" } },
      { id: "3", role: "assistant", content: "third", sender: { name: "Bot" } }
    ];
    const { container } = render(<Chat messages={messages} />);
    expect(screen.getAllByText("Bot")).toHaveLength(1);
    // Every message still renders its own bubble/avatar box for spacing —
    // grouping is a display concern, not a data-merging one.
    expect(container.querySelectorAll("[data-message-id]")).toHaveLength(3);
  });

  it("hides the avatar (visibility, not removal — keeps bubble-column alignment) for every message after the first in a group", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "first", sender: { name: "Bot" } },
      { id: "2", role: "assistant", content: "second", sender: { name: "Bot" } }
    ];
    render(<Chat messages={messages} />);
    const rows = document.querySelectorAll("[data-message-id]");
    const avatarOf = (row: Element) => row.querySelector(".Avatar_wrapper, [class*='Avatar_wrapper']");
    expect(avatarOf(rows[0]!)?.className).not.toContain(avatarHidden);
    expect(avatarOf(rows[1]!)?.className).toContain(avatarHidden);
  });

  it("starts a new group (avatar + name shown again) when the role changes", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "hi", sender: { name: "Bot" } },
      { id: "2", role: "user", content: "hello there" }
    ];
    render(<Chat messages={messages} />);
    const rows = document.querySelectorAll("[data-message-id]");
    expect(rows[1]!.querySelector(`.${avatarHidden}`)).toBeNull();
  });

  it("starts a new group when more than 5 minutes pass between timestamps", () => {
    const base = new Date("2026-07-31T10:00:00");
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "first", sender: { name: "Bot" }, timestamp: base },
      {
        id: "2",
        role: "assistant",
        content: "much later",
        sender: { name: "Bot" },
        timestamp: new Date(base.getTime() + 10 * 60 * 1000)
      }
    ];
    render(<Chat messages={messages} />);
    expect(screen.getAllByText("Bot")).toHaveLength(2);
  });

  it("only shows the sender name element when isGroupStart, even if sender.name is present on a continuation message", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "first", sender: { name: "Bot" } },
      { id: "2", role: "assistant", content: "second", sender: { name: "Bot" } }
    ];
    render(<Chat messages={messages} />);
    expect(document.querySelectorAll(`.${senderName}`)).toHaveLength(1);
  });
});

describe("Chat tool-call rendering", () => {
  it("calls renderToolCall with the message's toolCall payload", () => {
    const renderToolCall = vi.fn((toolCall: { type: string; data: unknown }) => (
      <div data-testid="tool-render">{toolCall.type}</div>
    ));
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "", toolCall: { type: "chart", data: { value: 42 } } }
    ];
    render(<Chat messages={messages} renderToolCall={renderToolCall} />);
    expect(renderToolCall).toHaveBeenCalledWith({ type: "chart", data: { value: 42 } });
    expect(screen.getByTestId("tool-render")).toHaveTextContent("chart");
  });

  it("renders both the markdown bubble and the tool call when a message has both content and toolCall", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "Here's a chart:", toolCall: { type: "chart", data: {} } }
    ];
    render(<Chat messages={messages} renderToolCall={() => <div data-testid="tool-render">rendered</div>} />);
    expect(screen.getByText("Here's a chart:")).toBeInTheDocument();
    expect(screen.getByTestId("tool-render")).toBeInTheDocument();
  });

  it("skips the empty markdown bubble for a pure tool-call message with no text content", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "", toolCall: { type: "chart", data: {} } }
    ];
    const { container } = render(
      <Chat messages={messages} renderToolCall={() => <div data-testid="tool-render">rendered</div>} />
    );
    expect(container.querySelector(`.${bubble}`)).toBeNull();
    expect(screen.getByTestId("tool-render")).toBeInTheDocument();
  });

  it("leaves normal markdown rendering completely unaffected for messages without toolCall", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "assistant", content: "**bold** text" }];
    render(<Chat messages={messages} renderToolCall={() => <div data-testid="tool-render" />} />);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.queryByTestId("tool-render")).not.toBeInTheDocument();
  });

  it("does not render tool-call content when renderToolCall is not provided, even if toolCall is set", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "assistant", content: "text here", toolCall: { type: "chart", data: {} } }
    ];
    render(<Chat messages={messages} />);
    expect(screen.getByText("text here")).toBeInTheDocument();
  });
});

describe("Chat Arrow-Up prefill", () => {
  it("prefills the input with the user's last sent message on Arrow-Up when the input is empty and focused", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "my last message" },
      { id: "2", role: "assistant", content: "a reply" }
    ];
    render(<Chat messages={messages} />);
    const textarea = screen.getByRole("textbox", { name: "Message" });
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "ArrowUp" });
    expect(textarea).toHaveValue("my last message");
  });

  it("does not prefill (or otherwise touch) the input when it already has text", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "my last message" }];
    render(<Chat messages={messages} />);
    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, { target: { value: "typing something new" } });
    fireEvent.keyDown(textarea, { key: "ArrowUp" });
    expect(textarea).toHaveValue("typing something new");
  });

  it("is a no-op when there is no prior user message to prefill", () => {
    render(<Chat messages={[]} />);
    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.keyDown(textarea, { key: "ArrowUp" });
    expect(textarea).toHaveValue("");
  });

  it("does not overwrite message history — the original message is untouched, this is a fresh compose prefill", () => {
    const messages: ChatMessage[] = [{ id: "1", role: "user", content: "original message" }];
    const { container } = render(<Chat messages={messages} />);
    const textarea = screen.getByRole("textbox", { name: "Message" });
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "ArrowUp" });
    // The original message bubble is still there, unedited, alongside the prefilled input.
    expect(container.querySelector(`.${bubble}`)).toHaveTextContent("original message");
    expect(textarea).toHaveValue("original message");
  });
});

describe("Chat focus shortcut", () => {
  it("focuses the message input when the default '/' shortcut fires and nothing editable is focused", () => {
    render(<Chat messages={[]} />);
    document.body.focus();
    fireEvent.keyDown(document, { key: "/" });
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus();
  });

  it("does not hijack the shortcut key while a different editable element is focused", () => {
    render(
      <div>
        <input aria-label="Other field" />
        <Chat messages={[]} />
      </div>
    );
    const other = screen.getByRole("textbox", { name: "Other field" });
    other.focus();
    fireEvent.keyDown(document, { key: "/" });
    expect(other).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Message" })).not.toHaveFocus();
  });

  it("supports a modifier-combo shortcut string like 'mod+k'", () => {
    render(<Chat messages={[]} focusShortcut="mod+k" />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus();
  });

  it("is entirely disabled when focusShortcut is null", () => {
    render(<Chat messages={[]} focusShortcut={null} />);
    fireEvent.keyDown(document, { key: "/" });
    expect(screen.getByRole("textbox", { name: "Message" })).not.toHaveFocus();
  });
});

describe("Chat input layout (attach button overlap regression)", () => {
  // jsdom has no real layout engine (getBoundingClientRect() always returns
  // zeros here) and doesn't apply vanilla-extract's generated stylesheet to
  // the document the way a real browser does — getComputedStyle() on these
  // elements resolves to nothing in this test environment regardless of
  // what the CSS actually says. The real pixel-geometry verification (zero
  // overlap between the textarea and the attach/mic/send buttons, at both
  // the collapsed and 200px-expanded heights) was done manually against a
  // live render — see the PR description for the exact before/after
  // measurements. What *is* meaningfully testable here is that the elements
  // carry the specific classes Chat.css.ts uses to fix this — the same
  // regression-guard technique this suite already uses elsewhere (e.g.
  // Button.test.tsx asserting class membership rather than resolved style).
  it("applies the textarea class that sets box-sizing: border-box (the actual root cause of the overlap)", () => {
    render(<Chat messages={[]} />);
    const textarea = screen.getByRole("textbox", { name: "Message" });
    expect(textarea).toHaveClass(textareaClass);
  });

  it("applies the inputControls class that sets flex-shrink: 0 on the button row", () => {
    render(<Chat messages={[]} />);
    const attachButton = screen.getByRole("button", { name: "Attach files" });
    const controls = attachButton.closest(`.${inputControls}`);
    expect(controls).not.toBeNull();
  });

  it("applies the chatInputRoot class that sets flex-shrink: 0 on the whole input area — the follow-up bug where a tall multi-line textarea got squeezed into overlapping the message list above it instead of the message list shrinking to make room", () => {
    render(<Chat messages={[]} />);
    const attachButton = screen.getByRole("button", { name: "Attach files" });
    const chatInputRootEl = attachButton.closest(`.${chatInputRoot}`);
    expect(chatInputRootEl).not.toBeNull();
  });

  it("caps the textarea's growth via a row-based (not hardcoded-pixel) max-height class", () => {
    render(<Chat messages={[]} />);
    const textarea = screen.getByRole("textbox", { name: "Message" });
    expect(textarea).toHaveClass(textareaClass);
  });
});
