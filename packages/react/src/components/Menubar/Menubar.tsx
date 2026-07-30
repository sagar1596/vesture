import { useRef, useState } from "react";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { DropdownMenu } from "../DropdownMenu";
import { menubar, trigger as triggerClass } from "./Menubar.css";

export interface MenubarItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface MenubarProps {
  items: MenubarItem[];
}

export function Menubar({ items }: MenubarProps): ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Per-index ref callbacks, cached rather than created inline in the map()
  // below, and passed to DropdownMenu's onReferenceRef (not as a `ref` prop
  // on the trigger element itself — cloneElement's own `ref` in its config
  // fully replaces whatever ref the original element carried, it doesn't
  // merge, so a ref set directly on the trigger JSX below would just be
  // silently discarded). An inline `(node) => ...}` callback is a new
  // function identity every render; if its identity churned, floating-ui's
  // useMergeRefs (which combines this with its own refs.setReference) would
  // detach and reattach the reference element on every render, defeating
  // its position tracking — the floating menu would never get a stable
  // anchor to compute a position from. Caching keeps identity stable.
  const setTriggerRefCallbacks = useRef<Array<(node: Element | null) => void>>([]);
  const getTriggerRefCallback = (index: number) => {
    let callback = setTriggerRefCallbacks.current[index];
    if (!callback) {
      callback = (node: Element | null) => {
        triggerRefs.current[index] = node as HTMLButtonElement | null;
      };
      setTriggerRefCallbacks.current[index] = callback;
    }
    return callback;
  };

  const focusTrigger = (index: number) => {
    setFocusedIndex(index);
    triggerRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const count = items.length;
    if (count === 0) return;

    switch (event.key) {
      case "ArrowRight": {
        event.preventDefault();
        const next = (focusedIndex + 1) % count;
        if (openIndex !== null) {
          setOpenIndex(next);
        }
        focusTrigger(next);
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        const next = (focusedIndex - 1 + count) % count;
        if (openIndex !== null) {
          setOpenIndex(next);
        }
        focusTrigger(next);
        break;
      }
      case "ArrowDown": {
        if (openIndex === null) {
          event.preventDefault();
          setOpenIndex(focusedIndex);
        }
        break;
      }
      case "Escape": {
        if (openIndex !== null) {
          setOpenIndex(null);
          focusTrigger(focusedIndex);
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <div role="menubar" aria-label="Menubar" className={menubar} onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <DropdownMenu
          key={item.id}
          placement="bottom-start"
          open={openIndex === index}
          onOpenChange={(isOpen) => {
            setOpenIndex(isOpen ? index : null);
            if (isOpen) {
              setFocusedIndex(index);
            }
          }}
          onReferenceRef={getTriggerRefCallback(index)}
          trigger={
            <button
              type="button"
              className={triggerClass}
              data-open={openIndex === index || undefined}
              tabIndex={focusedIndex === index ? 0 : -1}
              aria-haspopup="menu"
              aria-expanded={openIndex === index}
              onFocus={() => setFocusedIndex(index)}
            >
              {item.label}
            </button>
          }
        >
          {item.content}
        </DropdownMenu>
      ))}
    </div>
  );
}
