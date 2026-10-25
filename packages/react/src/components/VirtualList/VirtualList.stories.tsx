import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { VirtualList } from "./VirtualList";

const meta: Meta = { title: "Components/VirtualList" };
export default meta;
type Story = StoryObj;

const rows = Array.from({ length: 100_000 }, (_, i) => ({ id: i, text: `Item ${i + 1}` }));

export const HundredThousandRows: Story = {
  render: () => (
    <VirtualList
      items={rows}
      height={360}
      itemHeight={36}
      getKey={(r) => r.id}
      renderItem={(r) => <div style={{ padding: "8px 12px", borderBottom: "1px solid #eee" }}>{r.text}</div>}
    />
  )
};

const lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore. ";
export const MeasuredHeights: Story = {
  render: () => (
    <VirtualList
      items={Array.from({ length: 2000 }, (_, i) => ({ id: i, body: lorem.repeat(1 + (i % 4)) }))}
      height={360}
      getKey={(r) => r.id}
      gap={4}
      renderItem={(r) => (
        <div style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6 }}>
          <strong>#{r.id}</strong> {r.body}
        </div>
      )}
    />
  )
};

export const InfiniteScroll: Story = {
  render: () => {
    const [count, setCount] = useState(30);
    const [loading, setLoading] = useState(false);
    const items = Array.from({ length: count }, (_, i) => `Post ${i + 1}`);
    return (
      <VirtualList
        items={items}
        height={360}
        itemHeight={44}
        loading={loading}
        onEndReached={() => {
          setLoading(true);
          setTimeout(() => {
            setCount((c) => c + 30);
            setLoading(false);
          }, 700);
        }}
        renderItem={(t) => <div style={{ padding: 12 }}>{t}</div>}
      />
    );
  }
};
