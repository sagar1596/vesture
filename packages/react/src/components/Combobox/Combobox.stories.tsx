import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { Combobox } from "./Combobox";
import type { ComboboxOption } from "./types";

const fruitOptions: ComboboxOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "durian", label: "Durian", disabled: true },
  { value: "elderberry", label: "Elderberry" },
  { value: "fig", label: "Fig" },
  { value: "grape", label: "Grape" }
];

const meta: Meta<typeof Combobox> = {
  title: "Components/Combobox",
  component: Combobox
};

export default meta;
type Story = StoryObj<typeof Combobox>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <Combobox
        aria-label="Fruit"
        options={fruitOptions}
        value={value}
        onChange={(next) => setValue(next as string | null)}
        placeholder="Search fruit…"
      />
    );
  }
};

export const MultiSelect: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["apple", "fig"]);
    return (
      <Stack gap="sm">
        <p>Selected: {value.join(", ") || "none"}</p>
        <Combobox
          aria-label="Fruit"
          options={fruitOptions}
          multiple
          value={value}
          onChange={(next) => setValue(next as string[])}
          placeholder="Add fruit…"
        />
      </Stack>
    );
  }
};

export const AsyncFiltering: Story = {
  render: () => {
    const [options, setOptions] = useState<ComboboxOption[]>(fruitOptions);
    const [value, setValue] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (text: string) => {
      setLoading(true);
      setTimeout(() => {
        const query = text.trim().toLowerCase();
        setOptions(query ? fruitOptions.filter((opt) => opt.label.toLowerCase().includes(query)) : fruitOptions);
        setLoading(false);
      }, 300);
    };

    return (
      <Stack gap="sm">
        <p>Simulates server-side filtering with a debounce-style delay.</p>
        <Combobox
          aria-label="Fruit"
          options={options}
          value={value}
          onChange={(next) => setValue(next as string | null)}
          onInputChange={handleInputChange}
          filterOptions={(opts) => opts}
          loading={loading}
          placeholder="Search fruit…"
        />
      </Stack>
    );
  }
};

export const Disabled: Story = {
  render: () => <Combobox aria-label="Fruit" options={fruitOptions} defaultValue="apple" disabled />
};

export const Invalid: Story = {
  render: () => <Combobox aria-label="Fruit" options={fruitOptions} invalid placeholder="Required field" />
};
