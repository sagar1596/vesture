import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatWithThreads } from "./ChatWithThreads";
import type { ChatThread } from "./types";

function makeThreads(): ChatThread[] {
  return [
    {
      id: "t1",
      title: "First thread",
      messages: [{ id: "m1", role: "user", content: "hello from thread one" }],
      updatedAt: new Date("2026-07-30T10:00:00")
    },
    {
      id: "t2",
      title: "Second thread",
      messages: [{ id: "m2", role: "user", content: "hello from thread two" }],
      updatedAt: new Date("2026-07-30T11:00:00")
    }
  ];
}

describe("ChatWithThreads", () => {
  it("renders the active thread's messages", () => {
    render(<ChatWithThreads threads={makeThreads()} activeThreadId="t1" onThreadChange={vi.fn()} />);
    expect(screen.getByText("hello from thread one")).toBeInTheDocument();
    expect(screen.queryByText("hello from thread two")).not.toBeInTheDocument();
  });

  it("lists every thread's title in the sidebar", () => {
    render(<ChatWithThreads threads={makeThreads()} activeThreadId="t1" onThreadChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "First thread" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Second thread" })).toBeInTheDocument();
  });

  it("calls onThreadChange when a different thread is clicked, and swaps the visible message list", () => {
    const onThreadChange = vi.fn();
    const { rerender } = render(
      <ChatWithThreads threads={makeThreads()} activeThreadId="t1" onThreadChange={onThreadChange} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Second thread" }));
    expect(onThreadChange).toHaveBeenCalledWith("t2");

    // ChatWithThreads is fully controlled — the parent must actually update
    // activeThreadId for the visible list to change.
    rerender(<ChatWithThreads threads={makeThreads()} activeThreadId="t2" onThreadChange={onThreadChange} />);
    expect(screen.getByText("hello from thread two")).toBeInTheDocument();
    expect(screen.queryByText("hello from thread one")).not.toBeInTheDocument();
  });

  it("preserves each thread's own messages across a switch — switching away and back shows the same content, untouched", () => {
    const threads = makeThreads();
    const { rerender } = render(
      <ChatWithThreads threads={threads} activeThreadId="t1" onThreadChange={vi.fn()} />
    );
    expect(screen.getByText("hello from thread one")).toBeInTheDocument();

    rerender(<ChatWithThreads threads={threads} activeThreadId="t2" onThreadChange={vi.fn()} />);
    expect(screen.getByText("hello from thread two")).toBeInTheDocument();

    rerender(<ChatWithThreads threads={threads} activeThreadId="t1" onThreadChange={vi.fn()} />);
    expect(screen.getByText("hello from thread one")).toBeInTheDocument();
    expect(threads[0]!.messages).toEqual([{ id: "m1", role: "user", content: "hello from thread one" }]);
  });

  it("calls onNewThread when the New button is clicked, and hides it when the prop is omitted", () => {
    const onNewThread = vi.fn();
    const { rerender } = render(
      <ChatWithThreads threads={makeThreads()} activeThreadId="t1" onThreadChange={vi.fn()} onNewThread={onNewThread} />
    );
    fireEvent.click(screen.getByRole("button", { name: "+ New" }));
    expect(onNewThread).toHaveBeenCalledTimes(1);

    rerender(<ChatWithThreads threads={makeThreads()} activeThreadId="t1" onThreadChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "+ New" })).not.toBeInTheDocument();
  });

  it("calls onDeleteThread with the thread id, and hides the delete affordance when omitted", () => {
    const onDeleteThread = vi.fn();
    const { rerender } = render(
      <ChatWithThreads
        threads={makeThreads()}
        activeThreadId="t1"
        onThreadChange={vi.fn()}
        onDeleteThread={onDeleteThread}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete First thread" }));
    expect(onDeleteThread).toHaveBeenCalledWith("t1");

    rerender(<ChatWithThreads threads={makeThreads()} activeThreadId="t1" onThreadChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  });

  it("renames a thread via the inline rename affordance", () => {
    const onRenameThread = vi.fn();
    render(
      <ChatWithThreads
        threads={makeThreads()}
        activeThreadId="t1"
        onThreadChange={vi.fn()}
        onRenameThread={onRenameThread}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Rename First thread" }));
    const input = screen.getByRole("textbox", { name: "Thread title" });
    fireEvent.change(input, { target: { value: "Renamed thread" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onRenameThread).toHaveBeenCalledWith("t1", "Renamed thread");
  });

  it("cancels rename on Escape without calling onRenameThread", () => {
    const onRenameThread = vi.fn();
    render(
      <ChatWithThreads
        threads={makeThreads()}
        activeThreadId="t1"
        onThreadChange={vi.fn()}
        onRenameThread={onRenameThread}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Rename First thread" }));
    const input = screen.getByRole("textbox", { name: "Thread title" });
    fireEvent.change(input, { target: { value: "Should not save" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onRenameThread).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "First thread" })).toBeInTheDocument();
  });

  it("does not switch threads when clicking to rename", () => {
    const onThreadChange = vi.fn();
    render(
      <ChatWithThreads
        threads={makeThreads()}
        activeThreadId="t1"
        onThreadChange={onThreadChange}
        onRenameThread={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Rename First thread" }));
    expect(onThreadChange).not.toHaveBeenCalled();
  });

  it("forwards onSendMessage and other ChatProps through to the inner Chat", () => {
    const onSendMessage = vi.fn();
    render(
      <ChatWithThreads
        threads={makeThreads()}
        activeThreadId="t1"
        onThreadChange={vi.fn()}
        onSendMessage={onSendMessage}
      />
    );
    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, { target: { value: "a new message" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSendMessage).toHaveBeenCalledWith("a new message");
  });

  it("shows an empty-state hint when there are no threads", () => {
    render(<ChatWithThreads threads={[]} activeThreadId="" onThreadChange={vi.fn()} />);
    expect(screen.getByText("No threads yet.")).toBeInTheDocument();
  });

  it("opens the mobile thread drawer via the header toggle", () => {
    render(<ChatWithThreads threads={makeThreads()} activeThreadId="t1" onThreadChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Open thread list" }));
    expect(screen.getByRole("heading", { name: "Threads" })).toBeInTheDocument();
  });
});
