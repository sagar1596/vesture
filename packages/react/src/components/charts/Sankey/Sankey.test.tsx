import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SankeyChart } from "./Sankey";
import { computeSankey } from "./sankey-layout";

const nodes = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }];
const links = [
  { source: "a", target: "c", value: 6 },
  { source: "b", target: "c", value: 4 },
  { source: "c", target: "d", value: 10 }
];
const opts = { width: 400, height: 200, nodeWidth: 10, nodePadding: 10, align: "justify" as const };

describe("computeSankey", () => {
  it("layers nodes by longest path", () => {
    const { nodes: ns } = computeSankey(nodes, links, opts);
    const col = Object.fromEntries(ns.map((n) => [n.key, n.column]));
    expect(col).toEqual({ a: 0, b: 0, c: 1, d: 2 });
  });
  it("sizes nodes by max(in, out) and stays inside the box", () => {
    const { nodes: ns } = computeSankey(nodes, links, opts);
    const c = ns.find((n) => n.key === "c")!;
    expect(c.value).toBe(10);
    for (const n of ns) {
      expect(n.y).toBeGreaterThanOrEqual(-1e-9);
      expect(n.y + n.height).toBeLessThanOrEqual(200 + 1e-9);
    }
  });
  it("makes link thickness proportional to value", () => {
    const { links: ls } = computeSankey(nodes, links, opts);
    expect(ls[0]!.thickness / ls[1]!.thickness).toBeCloseTo(6 / 4);
  });
  it("drops invalid and self links, and survives cycles", () => {
    const out = computeSankey(
      [{ key: "x" }, { key: "y" }],
      [
        { source: "x", target: "y", value: 1 },
        { source: "y", target: "x", value: 1 },
        { source: "x", target: "x", value: 3 },
        { source: "x", target: "zzz", value: 3 }
      ],
      opts
    );
    expect(out.links).toHaveLength(2);
    expect(out.nodes).toHaveLength(2);
  });
  it("pushes sinks right under justify but not under left", () => {
    const n2 = [{ key: "s" }, { key: "m" }, { key: "t" }, { key: "side" }];
    const l2 = [
      { source: "s", target: "m", value: 1 },
      { source: "m", target: "t", value: 1 },
      { source: "s", target: "side", value: 1 }
    ];
    const col = (align: "left" | "justify") =>
      computeSankey(n2, l2, { ...opts, align }).nodes.find((n) => n.key === "side")!.column;
    expect(col("left")).toBe(1);
    expect(col("justify")).toBe(2);
  });
});

describe("SankeyChart", () => {
  it("renders nodes and links with accessible labels", () => {
    render(<SankeyChart nodes={nodes} links={links} width={500} height={240} />);
    expect(screen.getAllByTestId("sankey-node")).toHaveLength(4);
    expect(screen.getAllByTestId("sankey-link")).toHaveLength(3);
    expect(screen.getByLabelText("c: 10")).toBeInTheDocument();
  });
  it("fires click handlers", () => {
    const onNodeClick = vi.fn();
    const onLinkClick = vi.fn();
    render(<SankeyChart nodes={nodes} links={links} width={500} height={240} onNodeClick={onNodeClick} onLinkClick={onLinkClick} />);
    fireEvent.click(screen.getByLabelText("a: 6"));
    fireEvent.keyDown(screen.getByLabelText("b: 4"), { key: "Enter" });
    fireEvent.click(screen.getAllByTestId("sankey-link")[0]!);
    expect(onNodeClick).toHaveBeenCalledTimes(2);
    expect(onLinkClick).toHaveBeenCalledTimes(1);
  });
  it("dims unrelated links on hover", () => {
    render(<SankeyChart nodes={nodes} links={links} width={500} height={240} linkOpacity={0.5} dimmedOpacity={0.1} />);
    fireEvent.mouseEnter(screen.getByLabelText("a: 6"));
    const opacities = screen.getAllByTestId("sankey-link").map((l) => l.getAttribute("opacity"));
    expect(opacities).toEqual(["0.5", "0.1", "0.1"]);
  });
  it("uses a custom link color function and gradients", () => {
    const { rerender, container } = render(
      <SankeyChart nodes={nodes} links={links} width={500} height={240} linkColor={() => "#123456"} />
    );
    expect(container.querySelector('path[stroke="#123456"]')).not.toBeNull();
    rerender(<SankeyChart nodes={nodes} links={links} width={500} height={240} linkColor="gradient" />);
    expect(container.querySelectorAll("linearGradient")).toHaveLength(3);
  });
  it("shows an empty state", () => {
    render(<SankeyChart nodes={[]} links={[]} width={300} height={100} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });
});
