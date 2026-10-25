import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProductTour } from "./ProductTour";

const meta: Meta = { title: "Components/ProductTour" };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 40, display: "grid", gap: 32, justifyItems: "start" }}>
        <button onClick={() => setOpen(true)}>Start tour</button>
        <div style={{ display: "flex", gap: 16 }}>
          <button id="tour-new">New project</button>
          <button id="tour-search">Search</button>
          <button id="tour-profile">Profile</button>
        </div>
        <ProductTour
          open={open}
          onOpenChange={setOpen}
          showDots
          steps={[
            { target: "#tour-new", title: "Create", content: "Start a new project from here." },
            { target: "#tour-search", title: "Find anything", content: "Search across every project.", placement: "right" },
            { target: "#tour-profile", title: "Your account", content: "Settings and billing live here.", placement: "top" },
            { title: "You're set", content: "That's the whole tour." }
          ]}
        />
      </div>
    );
  }
};
