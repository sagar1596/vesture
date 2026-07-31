import type { ReactNode } from "react";

export type ChatMessageRole = "user" | "assistant" | "system";
export type ChatMessageStatus = "sending" | "sent" | "error";

export interface ChatAttachment {
  name: string;
  url: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  /** Markdown source. Rendered via `marked` + sanitized via DOMPurify — see markdown.ts. */
  content: string;
  status?: ChatMessageStatus;
  timestamp?: Date;
  sender?: {
    name: string;
    avatarUrl?: string;
  };
  /**
   * Consumer sets this true while appending tokens to `content` from their own
   * fetch/SSE/ReadableStream handling. Chat never fetches or owns a connection
   * itself — it only re-renders efficiently as `content` grows. While true,
   * action chrome (copy/edit/delete/regenerate menu) is suppressed.
   */
  streaming?: boolean;
  attachments?: ChatAttachment[];
  /**
   * Opt-in generative-UI extension point. A message can carry a `toolCall`
   * alongside or instead of `content` — when set, `ChatProps.renderToolCall`
   * (if provided) renders it. Chat ships no built-in tool-call types of its
   * own; `type` is an arbitrary consumer-defined discriminator and `data` is
   * whatever payload that type needs.
   */
  toolCall?: {
    type: string;
    data: unknown;
  };
}

export interface ChatProps {
  messages: ChatMessage[];
  onSendMessage?: (content: string) => void;
  isGenerating?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Composes the existing EmptyState component — passed straight through when `messages` is empty. */
  emptyState?: ReactNode;

  /** Per-message action menu — Edit is offered for user messages, Regenerate for assistant messages, only when the matching handler is supplied. */
  onEditMessage?: (id: string, content: string) => void;
  onDeleteMessage?: (id: string) => void;
  onRegenerateMessage?: (id: string) => void;
  onRetryMessage?: (id: string) => void;

  /** Row of clickable quick-action chips rendered above the input; clicking one calls onSendMessage directly. */
  suggestions?: string[];

  /** Fired when the user adds files via the input area's attachment picker, before any upload logic runs — same contract as FileUpload's onFilesAdded. */
  onFilesAdded?: (files: File[]) => void;

  /**
   * Renders a message's `toolCall` (see ChatMessage). Called once per
   * message that has `toolCall` set, in place of/alongside that message's
   * normal markdown bubble. Omit entirely if no message ever sets
   * `toolCall` — Chat has no built-in tool-call rendering of its own.
   */
  renderToolCall?: (toolCall: { type: string; data: unknown }) => ReactNode;

  /**
   * Global keyboard shortcut that focuses the message input from anywhere
   * on the page, as long as nothing else editable (another input/textarea/
   * contenteditable) currently has focus. Accepts a single key ("/") or a
   * modifier combo ("mod+k" — "mod" resolves to Cmd on macOS and Ctrl
   * elsewhere; "ctrl+k", "cmd+k", "alt+k", "shift+k" are also accepted,
   * combinable with "+"). Pass `null` to disable entirely — consuming apps
   * may already use "/" or Cmd/Ctrl+K for something else.
   * @default "/"
   */
  focusShortcut?: string | null;

  className?: string;
}
