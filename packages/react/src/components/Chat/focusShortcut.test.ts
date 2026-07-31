import { afterEach, describe, expect, it } from "vitest";
import { isEditableElementFocused, matchesShortcut } from "./focusShortcut";

function keyEvent(init: Partial<KeyboardEventInit> & { key: string }): KeyboardEvent {
  return new KeyboardEvent("keydown", init);
}

describe("matchesShortcut", () => {
  it("matches a bare single-key shortcut with no modifiers pressed", () => {
    expect(matchesShortcut(keyEvent({ key: "/" }), "/")).toBe(true);
  });

  it("does not match a bare key shortcut if an unrelated modifier is held", () => {
    expect(matchesShortcut(keyEvent({ key: "/", ctrlKey: true }), "/")).toBe(false);
  });

  it("matches an explicit ctrl+k combo only when ctrl is held", () => {
    expect(matchesShortcut(keyEvent({ key: "k", ctrlKey: true }), "ctrl+k")).toBe(true);
    expect(matchesShortcut(keyEvent({ key: "k" }), "ctrl+k")).toBe(false);
  });

  it("'mod' matches either ctrl or meta", () => {
    expect(matchesShortcut(keyEvent({ key: "k", ctrlKey: true }), "mod+k")).toBe(true);
    expect(matchesShortcut(keyEvent({ key: "k", metaKey: true }), "mod+k")).toBe(true);
    expect(matchesShortcut(keyEvent({ key: "k" }), "mod+k")).toBe(false);
  });

  it("is case-insensitive on both the shortcut string and the event key", () => {
    expect(matchesShortcut(keyEvent({ key: "K", ctrlKey: true }), "Mod+K")).toBe(true);
  });

  it("requires shift/alt to match exactly, not just be a superset", () => {
    expect(matchesShortcut(keyEvent({ key: "k", ctrlKey: true, shiftKey: true }), "mod+k")).toBe(false);
    expect(matchesShortcut(keyEvent({ key: "k", ctrlKey: true, shiftKey: true }), "mod+shift+k")).toBe(true);
  });
});

describe("isEditableElementFocused", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    (document.activeElement as HTMLElement | null)?.blur?.();
  });

  it("is false when nothing or the body is focused", () => {
    document.body.focus();
    expect(isEditableElementFocused()).toBe(false);
  });

  it("is true when an input, textarea, or select is focused", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    expect(isEditableElementFocused()).toBe(true);
  });

  it("is true when a contenteditable element is focused", () => {
    const div = document.createElement("div");
    // jsdom's `contentEditable` IDL property setter doesn't reflect back to
    // the attribute (a jsdom gap — real browsers keep both in sync), so the
    // attribute is set directly here to exercise the same code path a real
    // browser's isContentEditable getter would take.
    div.setAttribute("contenteditable", "true");
    div.tabIndex = 0;
    document.body.appendChild(div);
    div.focus();
    expect(isEditableElementFocused()).toBe(true);
  });

  it("is false for a focused plain button", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();
    expect(isEditableElementFocused()).toBe(false);
  });
});
