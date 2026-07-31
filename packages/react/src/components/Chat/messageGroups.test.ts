import { describe, expect, it } from "vitest";
import { groupMessages } from "./messageGroups";
import type { ChatMessage } from "./types";

function msg(overrides: Partial<ChatMessage> & Pick<ChatMessage, "id" | "role">): ChatMessage {
  return { content: "", ...overrides };
}

describe("groupMessages", () => {
  it("groups consecutive messages from the same role and sender into one group", () => {
    const messages: ChatMessage[] = [
      msg({ id: "1", role: "assistant", sender: { name: "Bot" } }),
      msg({ id: "2", role: "assistant", sender: { name: "Bot" } }),
      msg({ id: "3", role: "assistant", sender: { name: "Bot" } })
    ];
    const groups = groupMessages(messages);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.messages.map((m) => m.id)).toEqual(["1", "2", "3"]);
  });

  it("starts a new group when the role changes", () => {
    const messages: ChatMessage[] = [
      msg({ id: "1", role: "user" }),
      msg({ id: "2", role: "assistant" })
    ];
    const groups = groupMessages(messages);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.messages.map((m) => m.id)).toEqual(["1"]);
    expect(groups[1]!.messages.map((m) => m.id)).toEqual(["2"]);
  });

  it("starts a new group when sender.name differs even if role matches", () => {
    const messages: ChatMessage[] = [
      msg({ id: "1", role: "assistant", sender: { name: "Bot A" } }),
      msg({ id: "2", role: "assistant", sender: { name: "Bot B" } })
    ];
    const groups = groupMessages(messages);
    expect(groups).toHaveLength(2);
  });

  it("treats an absent sender.name as consistent with itself across messages", () => {
    const messages: ChatMessage[] = [
      msg({ id: "1", role: "user" }),
      msg({ id: "2", role: "user" })
    ];
    const groups = groupMessages(messages);
    expect(groups).toHaveLength(1);
  });

  it("splits the group when more than 5 minutes pass between timestamps", () => {
    const base = new Date("2026-07-31T10:00:00");
    const messages: ChatMessage[] = [
      msg({ id: "1", role: "assistant", sender: { name: "Bot" }, timestamp: base }),
      msg({ id: "2", role: "assistant", sender: { name: "Bot" }, timestamp: new Date(base.getTime() + 4 * 60 * 1000) }),
      msg({ id: "3", role: "assistant", sender: { name: "Bot" }, timestamp: new Date(base.getTime() + 11 * 60 * 1000) })
    ];
    const groups = groupMessages(messages);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.messages.map((m) => m.id)).toEqual(["1", "2"]);
    expect(groups[1]!.messages.map((m) => m.id)).toEqual(["3"]);
  });

  it("does not split on time when timestamps are absent", () => {
    const messages: ChatMessage[] = [
      msg({ id: "1", role: "assistant", sender: { name: "Bot" } }),
      msg({ id: "2", role: "assistant", sender: { name: "Bot" } })
    ];
    const groups = groupMessages(messages);
    expect(groups).toHaveLength(1);
  });

  it("compares against the immediately preceding message, not the group start, for the time window", () => {
    const base = new Date("2026-07-31T10:00:00");
    const messages: ChatMessage[] = [
      msg({ id: "1", role: "assistant", sender: { name: "Bot" }, timestamp: base }),
      msg({ id: "2", role: "assistant", sender: { name: "Bot" }, timestamp: new Date(base.getTime() + 4 * 60 * 1000) }),
      msg({ id: "3", role: "assistant", sender: { name: "Bot" }, timestamp: new Date(base.getTime() + 8 * 60 * 1000) })
    ];
    // 1->2 is 4 min apart (within window), 2->3 is also 4 min apart (within window),
    // even though 1->3 is 8 min apart — grouping should still succeed since each
    // consecutive pair is compared, not every message against the group's first.
    const groups = groupMessages(messages);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.messages).toHaveLength(3);
  });

  it("returns an empty array for an empty message list", () => {
    expect(groupMessages([])).toEqual([]);
  });

  it("preserves message order within and across groups", () => {
    const messages: ChatMessage[] = [
      msg({ id: "1", role: "user" }),
      msg({ id: "2", role: "user" }),
      msg({ id: "3", role: "assistant" }),
      msg({ id: "4", role: "user" })
    ];
    const groups = groupMessages(messages);
    expect(groups.map((g) => g.messages.map((m) => m.id))).toEqual([["1", "2"], ["3"], ["4"]]);
  });
});
