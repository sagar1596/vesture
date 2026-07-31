import type { ReactElement } from "react";
import { Button } from "../Button";
import { DropdownMenu } from "../DropdownMenu";
import { actionsButton, actionsButtonAlign } from "./Chat.css";
import type { ChatMessage } from "./types";
import { htmlToPlainText } from "./textUtils";

// Reply/Pin were considered alongside Copy/Edit/Delete/Regenerate but
// deferred — this library has no thread/pinned-message data model anywhere
// else to hang them off of (no `replyToId`, no pinned-list surface in
// ChatProps), so adding the menu items now would be UI with nowhere for the
// resulting event to go. Add them once a consumer need defines that shape.

export interface ChatMessageActionsProps {
  message: ChatMessage;
  html: string;
  align: "user" | "assistant" | "system";
  onEdit?: () => void;
  onDeleteMessage?: (id: string) => void;
  onRegenerateMessage?: (id: string) => void;
  onRetryMessage?: (id: string) => void;
}

async function copyPlainText(html: string) {
  const text = htmlToPlainText(html);
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}

export function ChatMessageActions({
  message,
  html,
  align,
  onEdit,
  onDeleteMessage,
  onRegenerateMessage,
  onRetryMessage
}: ChatMessageActionsProps): ReactElement | null {
  const canEdit = message.role === "user" && Boolean(onEdit);
  const canRegenerate = message.role === "assistant" && Boolean(onRegenerateMessage);
  const canRetry = message.status === "error" && Boolean(onRetryMessage);
  const canDelete = Boolean(onDeleteMessage);

  return (
    <DropdownMenu
      placement={align === "user" ? "bottom-end" : "bottom-start"}
      trigger={
        <Button
          type="button"
          variant="ghost"
          className={[actionsButton, actionsButtonAlign[align]].join(" ")}
          aria-label="Message actions"
          data-chat-actions
        >
          ⋯
        </Button>
      }
    >
      <DropdownMenu.Item onSelect={() => void copyPlainText(html)}>Copy</DropdownMenu.Item>
      {canEdit ? <DropdownMenu.Item onSelect={onEdit}>Edit</DropdownMenu.Item> : null}
      {canRegenerate ? (
        <DropdownMenu.Item onSelect={() => onRegenerateMessage?.(message.id)}>Regenerate</DropdownMenu.Item>
      ) : null}
      {canRetry ? <DropdownMenu.Item onSelect={() => onRetryMessage?.(message.id)}>Retry</DropdownMenu.Item> : null}
      {canDelete ? <DropdownMenu.Item onSelect={() => onDeleteMessage?.(message.id)}>Delete</DropdownMenu.Item> : null}
    </DropdownMenu>
  );
}
