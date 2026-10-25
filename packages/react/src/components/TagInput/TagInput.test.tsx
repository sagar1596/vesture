import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TagInput } from "./TagInput";

const type = (text: string) => fireEvent.change(screen.getByRole("combobox"), { target: { value: text } });
const key = (k: string) => fireEvent.keyDown(screen.getByRole("combobox"), { key: k });

describe("TagInput", () => {
  it("adds a tag on Enter and comma, and clears the input", () => {
    const onChange = vi.fn();
    render(<TagInput onChange={onChange} />);
    type("react");
    key("Enter");
    type("vue");
    key(",");
    expect(onChange).toHaveBeenLastCalledWith(["react", "vue"]);
    expect(screen.getAllByTestId("tag")).toHaveLength(2);
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
  it("rejects duplicates, over-limit and invalid tags with a message", () => {
    const onReject = vi.fn();
    render(<TagInput defaultValue={["a"]} maxTags={2} onReject={onReject} validate={(t) => (t.length < 2 ? "Too short" : null)} />);
    type("a");
    key("Enter");
    expect(screen.getByRole("alert")).toHaveTextContent("Already added");
    type("b");
    key("Enter");
    expect(screen.getByRole("alert")).toHaveTextContent("Too short");
    type("bb");
    key("Enter");
    type("cc");
    key("Enter");
    expect(screen.getByRole("alert")).toHaveTextContent("At most 2 tags");
    expect(onReject).toHaveBeenCalledWith("cc", "At most 2 tags");
    expect(screen.getAllByTestId("tag")).toHaveLength(2);
  });
  it("removes via the × button and Backspace", () => {
    const onChange = vi.fn();
    render(<TagInput defaultValue={["a", "b", "c"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove b" }));
    expect(onChange).toHaveBeenLastCalledWith(["a", "c"]);
    key("Backspace");
    expect(onChange).toHaveBeenLastCalledWith(["a"]);
  });
  it("splits pasted text on delimiters", () => {
    const onChange = vi.fn();
    render(<TagInput onChange={onChange} />);
    fireEvent.paste(screen.getByRole("combobox"), { clipboardData: { getData: () => "x, y,z\nw" } });
    expect(onChange).toHaveBeenLastCalledWith(["x", "y", "z", "w"]);
  });
  it("suggests, navigates and picks with the keyboard", () => {
    const onChange = vi.fn();
    render(<TagInput suggestions={["apple", "apricot", "banana"]} onChange={onChange} />);
    fireEvent.focus(screen.getByRole("combobox"));
    type("ap");
    expect(screen.getAllByRole("option")).toHaveLength(2);
    key("ArrowDown");
    key("Enter");
    expect(onChange).toHaveBeenLastCalledWith(["apricot"]);
  });
  it("picks a suggestion with the mouse and hides used ones", () => {
    render(<TagInput suggestions={["apple", "banana"]} />);
    fireEvent.focus(screen.getByRole("combobox"));
    fireEvent.mouseDown(screen.getByRole("option", { name: "banana" }));
    expect(screen.getAllByTestId("tag")).toHaveLength(1);
    fireEvent.focus(screen.getByRole("combobox"));
    type("");
    expect(screen.queryByRole("option", { name: "banana" })).toBeNull();
  });
  it("can restrict to suggestions, normalize, and add on Tab", () => {
    const onChange = vi.fn();
    render(<TagInput suggestions={["Red"]} allowCustom={false} normalize={(t) => t.trim()} delimiters={["Enter", "Tab"]} onChange={onChange} />);
    type("blue");
    key("Enter");
    expect(screen.getByRole("alert")).toHaveTextContent("Pick one of the suggestions");
    type("Red");
    key("Tab");
    expect(onChange).toHaveBeenLastCalledWith(["Red"]);
  });
  it("is controlled and supports custom tag rendering and disabled", () => {
    const { rerender } = render(<TagInput value={["a"]} renderTag={(t) => <em>#{t}</em>} />);
    type("b");
    key("Enter");
    expect(screen.getAllByTestId("tag")).toHaveLength(1);
    expect(screen.getByText("#a")).toBeInTheDocument();
    rerender(<TagInput value={["a"]} disabled />);
    expect(screen.queryByRole("button", { name: "Remove a" })).toBeNull();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
  it("commits leftover text on blur", () => {
    const onChange = vi.fn();
    render(<TagInput onChange={onChange} />);
    type("late");
    fireEvent.blur(screen.getByRole("combobox"));
    expect(onChange).toHaveBeenCalledWith(["late"]);
  });
});
