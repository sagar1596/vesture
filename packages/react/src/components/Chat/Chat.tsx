import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Button } from "../Button";
import { EmptyState } from "../EmptyState";
import { ChatInput } from "./ChatInput";
import type { ChatInputHandle } from "./ChatInput";
import { ChatMessageItem } from "./ChatMessageItem";
import {
  conversationArea,
  emptyStateWrapper,
  messageGroup,
  root,
  scrollArea,
  scrollToBottomButton,
  suggestionChip,
  suggestions as suggestionsRow,
  typingDot,
  typingIndicator,
  visuallyHidden
} from "./Chat.css";
import { isEditableElementFocused, matchesShortcut } from "./focusShortcut";
import { groupMessages } from "./messageGroups";
import { htmlToPlainText, truncate } from "./textUtils";
import type { ChatProps } from "./types";

const NEAR_BOTTOM_THRESHOLD_PX = 80;
const ANNOUNCEMENT_MAX_LENGTH = 160;
const DEFAULT_FOCUS_SHORTCUT = "/";

// No windowing/virtualization: typical chat sessions run to hundreds of
// messages, not the thousands where TreeView/DataGrid's flatten-and-window
// approach earns its complexity. Revisit only if a real use case needs a
// much longer-lived session history rendered at once.

export function Chat({
  messages,
  onSendMessage,
  isGenerating,
  placeholder,
  disabled,
  emptyState,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  onRetryMessage,
  suggestions,
  onFilesAdded,
  renderToolCall,
  focusShortcut = DEFAULT_FOCUS_SHORTCUT,
  className
}: ChatProps): ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const previousStreamingRef = useRef<Map<string, boolean>>(new Map());
  const chatInputRef = useRef<ChatInputHandle>(null);

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    const el = scrollRef.current;
    if (!el) return;
    // jsdom (used by this component's tests) doesn't implement Element.scrollTo
    // as a real function on all versions — fall back to a direct scrollTop
    // assignment so tests don't need a browser to exercise this path.
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom);
  }

  // Auto-scroll to bottom only if the user was already near the bottom —
  // yanking scroll position out from under someone reading history is the
  // exact complaint Kendo's own docs call out for this feature. The
  // dependency signal below deliberately reduces `messages` to
  // count+total-content-length rather than depending on the array reference
  // directly, since a streaming update appends characters to an existing
  // message's `content` far more often than it appends a whole new message.
  const scrollSignal = `${messages.length}:${messages.reduce((sum, m) => sum + m.content.length, 0)}`;
  useLayoutEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    } else {
      handleScroll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollSignal]);

  // Announce once per message when its streaming flag flips from true to
  // false — not on every token, which would be unusable with a screen
  // reader. A brand-new, already-complete message (streaming never true)
  // is announced the moment it appears instead.
  useEffect(() => {
    const previous = previousStreamingRef.current;
    for (const message of messages) {
      const wasStreaming = previous.get(message.id);
      const justFinished = wasStreaming === true && !message.streaming;
      const justArrivedComplete = wasStreaming === undefined && !message.streaming && message.role !== "user";
      if (justFinished || justArrivedComplete) {
        setAnnouncement(
          `${message.sender?.name ?? message.role}: ${truncate(htmlToPlainText(message.content), ANNOUNCEMENT_MAX_LENGTH)}`
        );
      }
      previous.set(message.id, message.streaming ?? false);
    }
  }, [messages]);

  // Global "jump to the message input" shortcut — skipped entirely while
  // any editable element (including this Chat's own textarea, so typing the
  // shortcut character as message text isn't hijacked) already has focus.
  // Disabled outright when focusShortcut is null, since a consuming app may
  // already use "/" or Cmd/Ctrl+K for its own global shortcut.
  useEffect(() => {
    if (!focusShortcut) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableElementFocused()) return;
      if (!focusShortcut || !matchesShortcut(event, focusShortcut)) return;
      event.preventDefault();
      chatInputRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusShortcut]);

  const lastStreamingMessage = [...messages].reverse().find((m) => m.streaming);
  const showTypingIndicator = Boolean(isGenerating) && !(lastStreamingMessage && lastStreamingMessage.content.length > 0);

  const hasMessages = messages.length > 0 || showTypingIndicator;
  const groups = groupMessages(messages);
  const lastUserMessageContent = [...messages].reverse().find((m) => m.role === "user")?.content;

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      <div className={conversationArea}>
        {hasMessages ? (
          <div ref={scrollRef} className={scrollArea} role="log" aria-live="polite" aria-relevant="additions" onScroll={handleScroll}>
            {groups.map((group) => (
              <div key={group.key} className={messageGroup}>
                {group.messages.map((message, index) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    isGroupStart={index === 0}
                    onEditMessage={onEditMessage}
                    onDeleteMessage={onDeleteMessage}
                    onRegenerateMessage={onRegenerateMessage}
                    onRetryMessage={onRetryMessage}
                    renderToolCall={renderToolCall}
                  />
                ))}
              </div>
            ))}
            {showTypingIndicator ? (
              <div className={typingIndicator} role="status" aria-label="Assistant is typing">
                <span className={typingDot} style={{ animationDelay: "0ms" }} />
                <span className={typingDot} style={{ animationDelay: "160ms" }} />
                <span className={typingDot} style={{ animationDelay: "320ms" }} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className={emptyStateWrapper}>
            {emptyState ?? <EmptyState title="No messages yet" description="Start the conversation below." />}
          </div>
        )}

        {showScrollButton ? (
          <Button
            type="button"
            variant="secondary"
            className={scrollToBottomButton}
            onClick={() => {
              scrollToBottom("smooth");
              isNearBottomRef.current = true;
              setShowScrollButton(false);
            }}
          >
            ↓ New messages
          </Button>
        ) : null}
      </div>

      <span className={visuallyHidden} aria-live="polite" aria-atomic="true">
        {announcement}
      </span>

      {suggestions && suggestions.length > 0 ? (
        <div className={suggestionsRow}>
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="secondary"
              className={suggestionChip}
              onClick={() => onSendMessage?.(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      ) : null}

      <ChatInput
        ref={chatInputRef}
        onSend={(content) => onSendMessage?.(content)}
        placeholder={placeholder}
        disabled={disabled}
        isGenerating={isGenerating}
        onFilesAdded={onFilesAdded}
        lastUserMessageContent={lastUserMessageContent}
      />
    </div>
  );
}
