import { useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from "@floating-ui/react";
import { Button } from "../Button";
import { Textarea } from "../Textarea";
import { useFilterableList } from "../../utils/useFilterableList";
import {
  cardsGrid,
  commandMenu,
  commandMenuEmpty,
  commandMenuItem,
  commandMenuItemLabel,
  inputRow,
  root,
  suggestionCard,
  suggestionCardDescription,
  suggestionCardTitle,
  textarea as textareaClass
} from "./AIPrompt.css";
import type { AIPromptProps, PromptCommand } from "./types";

export function AIPrompt({
  suggestions,
  onSubmit,
  placeholder,
  disabled,
  commands,
  autoSubmitOnSuggestionClick = true,
  className
}: AIPromptProps): ReactElement {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // The command menu is only ever relevant when "/" is the very first
  // character — matches the spec's "typing '/' at the start of the input"
  // trigger, not "/" appearing anywhere in the text.
  const commandQuery = value.startsWith("/") ? value.slice(1) : null;
  const menuOpen = commands !== undefined && commands.length > 0 && commandQuery !== null;

  const { filteredItems, activeIndex, setActiveIndex, moveActiveIndex, activeItem } = useFilterableList<PromptCommand>(
    commands ?? [],
    commandQuery ?? ""
  );

  const { refs, floatingStyles, context } = useFloating({
    open: menuOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })]
  });
  const { getFloatingProps } = useInteractions([
    useDismiss(context),
    useRole(context, { role: "listbox" })
  ]);

  function selectCommand(command: PromptCommand) {
    setValue(command.template);
    setActiveIndex(null);
    textareaRef.current?.focus();
  }

  const canSubmit = value.trim().length > 0 && !disabled;

  function submit() {
    if (!canSubmit) return;
    onSubmit(value.trim());
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (menuOpen && filteredItems.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActiveIndex(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActiveIndex(-1);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (activeItem) selectCommand(activeItem);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveIndex(null);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function handleSuggestionClick(prompt: string) {
    if (autoSubmitOnSuggestionClick) {
      onSubmit(prompt);
      setValue("");
    } else {
      setValue(prompt);
      textareaRef.current?.focus();
    }
  }

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      {suggestions && suggestions.length > 0 ? (
        <div className={cardsGrid}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className={suggestionCard}
              onClick={() => handleSuggestionClick(suggestion.prompt)}
            >
              <span className={suggestionCardTitle}>{suggestion.title}</span>
              {suggestion.description ? (
                <span className={suggestionCardDescription}>{suggestion.description}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className={inputRow}>
        <Textarea
          ref={(node) => {
            textareaRef.current = node;
            refs.setReference(node);
          }}
          className={textareaClass}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Ask anything…"}
          disabled={disabled}
          rows={1}
          aria-label="Prompt"
          aria-expanded={menuOpen}
          role="combobox"
          aria-controls={menuOpen ? "ai-prompt-command-menu" : undefined}
        />
        <Button type="button" onClick={submit} disabled={!canSubmit}>
          Send
        </Button>
      </div>

      {menuOpen ? (
        <FloatingPortal>
          <div
            id="ai-prompt-command-menu"
            ref={refs.setFloating}
            style={floatingStyles}
            className={commandMenu}
            role="listbox"
            aria-label="Prompt commands"
            {...getFloatingProps()}
          >
            {filteredItems.length === 0 ? (
              <div className={commandMenuEmpty}>No matching commands</div>
            ) : (
              filteredItems.map((command, index) => (
                <div
                  key={command.id}
                  role="option"
                  aria-selected={activeIndex === index}
                  data-active={activeIndex === index || undefined}
                  className={commandMenuItem}
                  onMouseEnter={() => setActiveIndex(index)}
                  // onMouseDown (not onClick) so the textarea's blur — which
                  // would otherwise fire first on click and close the menu
                  // before the selection handler runs — doesn't race this.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectCommand(command);
                  }}
                >
                  <span className={commandMenuItemLabel}>{command.label}</span>
                </div>
              ))
            )}
          </div>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
