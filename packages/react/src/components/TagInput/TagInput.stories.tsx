import type { Meta, StoryObj } from "@storybook/react-vite";
import { TagInput } from "./TagInput";

const meta: Meta<typeof TagInput> = { title: "Components/TagInput", component: TagInput };
export default meta;
type Story = StoryObj<typeof TagInput>;

export const Default: Story = { render: () => <TagInput defaultValue={["design", "react"]} /> };
export const WithSuggestions: Story = {
  render: () => <TagInput suggestions={["design", "react", "typescript", "accessibility", "testing"]} maxTags={5} placeholder="Add skills…" />
};
export const EmailValidation: Story = {
  render: () => (
    <TagInput
      placeholder="Add emails…"
      delimiters={["Enter", ",", " ", "Tab"]}
      validate={(t) => (/^\S+@\S+\.\S+$/.test(t) ? null : "Not a valid email address")}
    />
  )
};
