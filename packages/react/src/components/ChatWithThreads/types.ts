import type { ChatMessage, ChatProps } from "../Chat";

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: Date;
}

// `messages` is derived from `threads`/`activeThreadId` internally, not
// accepted directly — everything else (onSendMessage, isGenerating,
// renderToolCall, suggestions, focusShortcut, ...) passes straight through
// to the inner Chat unchanged, same controlled-component philosophy as the
// rest of this library: ChatWithThreads renders threads, it doesn't persist
// them (no localStorage, no backend) — the consumer owns `threads` state.
export interface ChatWithThreadsProps extends Omit<ChatProps, "messages"> {
  threads: ChatThread[];
  activeThreadId: string;
  onThreadChange: (id: string) => void;
  onNewThread?: () => void;
  onDeleteThread?: (id: string) => void;
  onRenameThread?: (id: string, title: string) => void;
  /** @default "Threads" */
  sidebarTitle?: string;
}
