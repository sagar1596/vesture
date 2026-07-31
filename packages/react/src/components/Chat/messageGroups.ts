import type { ChatMessage, ChatMessageRole } from "./types";

export interface ChatMessageGroup {
  /** Stable key for the group — the id of its first message, never regenerated. */
  key: string;
  role: ChatMessageRole;
  senderName: string | undefined;
  senderAvatarUrl: string | undefined;
  messages: ChatMessage[];
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function sameSender(a: ChatMessage, b: ChatMessage): boolean {
  if (a.role !== b.role) return false;
  return (a.sender?.name ?? null) === (b.sender?.name ?? null);
}

/** No timestamp on either side means "don't split on time" — the grouping decision falls back to sender identity alone. */
function withinGroupWindow(a: ChatMessage, b: ChatMessage): boolean {
  if (!a.timestamp || !b.timestamp) return true;
  return Math.abs(b.timestamp.getTime() - a.timestamp.getTime()) <= GROUP_WINDOW_MS;
}

/**
 * Groups consecutive messages from the same sender (matching role + sender
 * name, within a 5-minute timestamp window when timestamps are present) so
 * the rendered UI can show the avatar/sender name once per group instead of
 * once per message. Pure and independent of rendering — order of `messages`
 * is preserved, nothing is reordered or dropped.
 */
export function groupMessages(messages: ChatMessage[]): ChatMessageGroup[] {
  const groups: ChatMessageGroup[] = [];

  for (const message of messages) {
    const currentGroup = groups[groups.length - 1];
    const lastMessage = currentGroup?.messages[currentGroup.messages.length - 1];

    if (currentGroup && lastMessage && sameSender(lastMessage, message) && withinGroupWindow(lastMessage, message)) {
      currentGroup.messages.push(message);
    } else {
      groups.push({
        key: message.id,
        role: message.role,
        senderName: message.sender?.name,
        senderAvatarUrl: message.sender?.avatarUrl,
        messages: [message]
      });
    }
  }

  return groups;
}
