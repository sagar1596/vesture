import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AIPrompt } from "./AIPrompt";

const meta: Meta<typeof AIPrompt> = {
  title: "Components/AIPrompt",
  component: AIPrompt,
  decorators: [
    (Story) => (
      <div style={{ width: "560px" }}>
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof AIPrompt>;

export const Default: Story = {
  args: {
    onSubmit: (prompt) => console.log("submit", prompt)
  }
};

export const AIPromptWithSuggestionCards: Story = {
  render: (args) => {
    function Demo() {
      const [submitted, setSubmitted] = useState<string[]>([]);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <AIPrompt
            {...args}
            onSubmit={(prompt) => setSubmitted((prev) => [...prev, prompt])}
            suggestions={[
              { id: "1", title: "Summarize", description: "Summarize the current page", prompt: "Summarize this page for me." },
              { id: "2", title: "Explain code", description: "Explain a selected snippet", prompt: "Explain this code snippet." },
              { id: "3", title: "Write tests", description: "Draft unit tests", prompt: "Write unit tests for this function." }
            ]}
          />
          <ul>
            {submitted.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      );
    }
    return <Demo />;
  }
};

export const AIPromptWithSlashCommands: Story = {
  args: {
    onSubmit: (prompt) => console.log("submit", prompt),
    commands: [
      { id: "1", label: "/summarize", template: "Summarize the following: " },
      { id: "2", label: "/translate", template: "Translate the following into French: " },
      { id: "3", label: "/fix", template: "Fix the bug in the following code: " }
    ],
    placeholder: 'Type "/" for commands…'
  }
};

export const Disabled: Story = {
  args: {
    onSubmit: (prompt) => console.log("submit", prompt),
    disabled: true
  }
};
