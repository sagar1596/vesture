import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "./index";

const meta: Meta<typeof Accordion> = {
  title: "Components/Accordion",
  component: Accordion
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Single: Story = {
  render: () => (
    <Accordion type="single" defaultValue="a" style={{ width: "480px" }}>
      <Accordion.Item value="a">
        <Accordion.Trigger>What is Vesture?</Accordion.Trigger>
        <Accordion.Content>A themeable component library built on a shared token contract.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Trigger>Is it themeable?</Accordion.Trigger>
        <Accordion.Content>Yes — every component reads from the token contract, not fixed values.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="c">
        <Accordion.Trigger>Does it support React?</Accordion.Trigger>
        <Accordion.Content>@vesture/react is the first framework binding, more to follow.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={["a"]} style={{ width: "480px" }}>
      <Accordion.Item value="a">
        <Accordion.Trigger>Section one</Accordion.Trigger>
        <Accordion.Content>Multiple sections can be open at once.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="b">
        <Accordion.Trigger>Section two</Accordion.Trigger>
        <Accordion.Content>Try opening this alongside section one.</Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )
};
