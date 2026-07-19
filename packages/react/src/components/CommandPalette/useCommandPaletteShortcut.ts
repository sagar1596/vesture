import { useEffect } from "react";

export interface UseCommandPaletteShortcutOptions {
  key?: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
}

function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? navigator.userAgent ?? "");
}

/**
 * Attaches a document-level Cmd+K (Mac) / Ctrl+K (elsewhere) listener that
 * calls onOpenChange(true). Separate from CommandPalette so consumers can
 * wire their own trigger instead.
 */
export function useCommandPaletteShortcut(
  onOpenChange: (open: boolean) => void,
  options: UseCommandPaletteShortcutOptions = {}
): void {
  const { key = "k", metaKey, ctrlKey } = options;

  useEffect(() => {
    const explicit = metaKey !== undefined || ctrlKey !== undefined;
    const useMeta = explicit ? Boolean(metaKey) : isMac();
    const useCtrl = explicit ? Boolean(ctrlKey) : !isMac();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (event.metaKey !== useMeta) return;
      if (event.ctrlKey !== useCtrl) return;

      event.preventDefault();
      onOpenChange(true);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, key, metaKey, ctrlKey]);
}
