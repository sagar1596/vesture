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
          trigger={
            <button
              type="button"
              ref={(node: HTMLButtonElement | null) => {
                triggerRefs.current[index] = node;
              }}
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
