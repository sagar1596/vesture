import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { MentionsInput } from "./MentionsInput";
import type { MentionOption } from "./types";

const TEAM: MentionOption[] = [
  { id: "u1", label: "Ada Lovelace" },
  { id: "u2", label: "Alan Turing" },
  { id: "u3", label: "Grace Hopper" },
  { id: "u4", label: "Katherine Johnson" },
  { id: "u5", label: "Margaret Hamilton" },
  { id: "u6", label: "Barbara Liskov" }
];

const meta: Meta<typeof MentionsInput> = {
  title: "Components/MentionsInput",
  component: MentionsInput
};

export default meta;
type Story = StoryObj<typeof MentionsInput>;

// Type "@" then a few letters to filter the static team list.
export const StaticOptions: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <Stack gap="sm">
        <MentionsInput aria-label="Comment" options={TEAM} value={value} onChange={setValue} placeholder="Write a comment… try @ada" />
      </Stack>
    );
  }
};

// Simulates a server-side search: the promise resolves after a short delay,
// filtered by whatever was typed after "@".
export const AsyncSearch: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const search = (query: string): Promise<MentionOption[]> =>
      new Promise((resolve) => {
        setTimeout(() => {
          const q = query.trim().toLowerCase();
          resolve(q ? TEAM.filter((opt) => opt.label.toLowerCase().includes(q)) : TEAM);
        }, 300);
      });

    return (
      <Stack gap="sm">
        <p>Options resolve asynchronously (300ms simulated network delay).</p>
        <MentionsInput aria-label="Comment" options={search} value={value} onChange={setValue} placeholder="Write a comment… try @grace" />
      </Stack>
    );
  }
};

// The trigger character defaults to "@" but can be any string — here it's
// changed to "#" for tagging topics instead of people.
export const CustomTriggerCharacter: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const topics: MentionOption[] = [
      { id: "t1", label: "engineering" },
      { id: "t2", label: "design" },
      { id: "t3", label: "roadmap" },
      { id: "t4", label: "incident" }
    ];
    return (
      <Stack gap="sm">
        <MentionsInput
          aria-label="Note"
          options={topics}
          trigger="#"
          value={value}
          onChange={setValue}
          placeholder="Type # to tag a topic…"
        />
      </Stack>
    );
  }
};

// onMentionsChange reflects the current, deduplicated set of entities
// actually present in the text — including dropping one the moment its chip
// is deleted (select the chip and press Backspace/Delete to try it).
export const ShowingMentionsChangeCallback: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const [mentions, setMentions] = useState<MentionOption[]>([]);
    return (
      <Stack gap="sm">
        <MentionsInput
          aria-label="Comment"
          options={TEAM}
          value={value}
          onChange={setValue}
          onMentionsChange={setMentions}
          placeholder="Mention teammates with @…"
        />
        <div>
          <strong>Currently mentioned:</strong>{" "}
          {mentions.length === 0 ? "none" : mentions.map((m) => m.label).join(", ")}
        </div>
      </Stack>
    );
  }
};
