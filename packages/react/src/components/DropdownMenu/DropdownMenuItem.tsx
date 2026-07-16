import { useMergeRefs } from "@floating-ui/react";
import type { ButtonHTMLAttributes, MutableRefObject, ReactElement } from "react";
import { item } from "./DropdownMenu.css";
import { useMenuContext } from "./MenuContext";

export interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onSelect?: () => void;
}

interface InternalProps {
  index?: number;
  elementsRef?: MutableRefObject<Array<HTMLElement | null>>;
}

export function DropdownMenuItem({
  onSelect,
  disabled,
  className,
  index,
  elementsRef,
  ...rest
}: DropdownMenuItemProps & InternalProps): ReactElement {
  const { activeIndex, getItemProps, closeMenu } = useMenuContext();
  const isActive = activeIndex === index;

  const itemRef = useMergeRefs([
    (node: HTMLButtonElement | null) => {
      if (elementsRef && typeof index === "number") {
        elementsRef.current[index] = node;
      }
    }
  ]);

  return (
    <button
      ref={itemRef}
      type="button"
      role="menuitem"
      disabled={disabled}
      data-active={isActive || undefined}
      className={[item, className].filter(Boolean).join(" ")}
      tabIndex={isActive ? 0 : -1}
      {...getItemProps({
        onClick: () => {
          onSelect?.();
          closeMenu();
        },
        ...rest
      })}
    />
  );
}
