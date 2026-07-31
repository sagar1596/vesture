import { useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { Avatar } from "../Avatar";
import { Button } from "../Button";
import { Spinner } from "../Spinner";
import { Textarea } from "../Textarea";
import { ChatMessageActions } from "./ChatMessageActions";
import { highlightCodeBlocks } from "./codeHighlight";
import {
  attachmentFileChip,
  attachmentImage,
  avatarHidden,
  bubble,
  bubbleColumn,
  bubbleColumnAlign,
  bubbleStatus,
  bubbleVariant,
  errorText,
  inputControls,
  messageAttachments,
  messageRow,
  messageRowAlign,
  metaRow,
  metaRowCompact,
  senderName,
  toolCallContainer
} from "./Chat.css";
import type { ChatMessage } from "./types";
import { useStreamingMarkdown } from "./useStreamingMarkdown";

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

export interface ChatMessageItemProps {
  message: ChatMessage;
  /** True for the first message in its visual group — controls whether the avatar/sender name render, and whether the meta row (status/timestamp) is always visible or only revealed on hover. See messageGroups.ts. */
  isGroupStart: boolean;
  onEditMessage?: (id: string, content: string) => void;
  onDeleteMessage?: (id: string) => void;
  onRegenerateMessage?: (id: string) => void;
  onRetryMessage?: (id: string) => void;
  renderToolCall?: (toolCall: { type: string; data: unknown }) => ReactNode;
}

export function ChatMessageItem({
  message,
  isGroupStart,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  onRetryMessage,
  renderToolCall
}: ChatMessageItemProps): ReactElement {
  const html = useStreamingMarkdown(message.content, message.streaming);
  const align = message.role === "user" ? "user" : message.role === "system" ? "system" : "assistant";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Runs after every markdown re-render (throttled during streaming by
  // useStreamingMarkdown above), not on every raw content change — no point
  // re-highlighting code that hasn't visually changed yet.
  useEffect(() => {
    if (bubbleRef.current) highlightCodeBlocks(bubbleRef.current);
  }, [html]);

  function startEdit() {
    setDraft(message.content);
    setIsEditing(true);
  }

  function saveEdit() {
    const trimmed = draft.trim();
    if (trimmed.length > 0) {
      onEditMessage?.(message.id, trimmed);
    }
    setIsEditing(false);
  }

  // Streaming messages skip all action chrome — the response isn't final
  // yet, so copy/edit/delete/regenerate have nothing stable to act on.
  const showActions = !message.streaming;

  // A pure tool-call message (no text content) skips the markdown bubble
  // entirely rather than rendering an empty one — but a message with both
  // `content` and `toolCall` still gets both, per the "alongside or instead
  // of" contract on ChatMessage.toolCall.
  const hasTextContent = message.content.trim().length > 0;
  const showBubble = isEditing || hasTextContent || !message.toolCall;
  const showMeta = message.status === "sending" || message.status === "error" || Boolean(message.timestamp);

  return (
    <div className={[messageRow, messageRowAlign[align]].join(" ")} data-message-id={message.id}>
      {align !== "system" ? (
        <Avatar
          size="sm"
          name={message.sender?.name ?? (message.role === "user" ? "You" : "Assistant")}
          src={message.sender?.avatarUrl}
          className={isGroupStart ? undefined : avatarHidden}
        />
      ) : null}
      <div className={[bubbleColumn, bubbleColumnAlign[align]].join(" ")}>
        {isGroupStart && message.sender?.name ? <span className={senderName}>{message.sender.name}</span> : null}

        {isEditing ? (
          <div>
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              aria-label={`Edit message`}
              autoFocus
            />
            <div className={inputControls}>
              <Button type="button" onClick={saveEdit}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : showBubble ? (
          <div
            ref={bubbleRef}
            className={[
              bubble,
              bubbleVariant[align],
              message.status ? bubbleStatus[message.status] : ""
            ]
              .filter(Boolean)
              .join(" ")}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}

        {message.toolCall && renderToolCall ? (
          <div className={toolCallContainer}>{renderToolCall(message.toolCall)}</div>
        ) : null}

        {message.attachments && message.attachments.length > 0 ? (
          <div className={messageAttachments}>
            {message.attachments.map((attachment) =>
              attachment.type.startsWith("image/") ? (
                <img key={attachment.url} src={attachment.url} alt={attachment.name} className={attachmentImage} />
              ) : (
                <a
                  key={attachment.url}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={attachmentFileChip}
                >
                  📎 {attachment.name}
                </a>
              )
            )}
          </div>
        ) : null}

        {showMeta ? (
          <div className={isGroupStart ? metaRow : [metaRow, metaRowCompact].join(" ")}>
            {message.status === "sending" ? <Spinner size="sm" label="Sending" /> : null}
            {message.status === "error" ? <span className={errorText}>Failed to send</span> : null}
            {message.timestamp ? <span>{formatTimestamp(message.timestamp)}</span> : null}
          </div>
        ) : null}
      </div>

      {showActions && !isEditing ? (
        <ChatMessageActions
          message={message}
          html={html}
          align={align}
          onEdit={onEditMessage ? startEdit : undefined}
          onDeleteMessage={onDeleteMessage}
          onRegenerateMessage={onRegenerateMessage}
          onRetryMessage={onRetryMessage}
        />
      ) : null}
    </div>
  );
}
