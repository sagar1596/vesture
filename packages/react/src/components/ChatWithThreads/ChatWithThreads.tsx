import { useState } from "react";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { Button } from "../Button";
import { Chat } from "../Chat";
import { Drawer } from "../Drawer";
import { Input } from "../Input";
import {
  chatColumn,
  emptyThreadsHint,
  layout,
  mobileHeader,
  sidebarColumn,
  sidebarHeader,
  sidebarTitle as sidebarTitleClass,
  threadList,
  threadRenameInput,
  threadRow,
  threadRowActions,
  threadTitle
} from "./ChatWithThreads.css";
import type { ChatWithThreadsProps } from "./types";

export function ChatWithThreads({
  threads,
  activeThreadId,
  onThreadChange,
  onNewThread,
  onDeleteThread,
  onRenameThread,
  sidebarTitle = "Threads",
  className,
  ...chatProps
}: ChatWithThreadsProps): ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const activeThread = threads.find((thread) => thread.id === activeThreadId);

  function startRename(id: string, currentTitle: string) {
    setRenamingId(id);
    setRenameDraft(currentTitle);
  }

  function commitRename() {
    const trimmed = renameDraft.trim();
    if (renamingId && trimmed.length > 0) {
      onRenameThread?.(renamingId, trimmed);
    }
    setRenamingId(null);
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setRenamingId(null);
    }
  }

  // Rendered twice — once in the always-in-flow desktop column, once inside
  // the mobile Drawer — since which of the two is actually visible is
  // decided purely by CSS media queries (see ChatWithThreads.css.ts), not by
  // JS breakpoint tracking. Both renders share this exact same content, so
  // there's nothing that can drift out of sync between them.
  function renderThreadList(): ReactNode {
    if (threads.length === 0) {
      return <p className={emptyThreadsHint}>No threads yet.</p>;
    }
    return (
      <ul className={threadList}>
        {threads.map((thread) => (
          <li
            key={thread.id}
            className={threadRow}
            data-active={thread.id === activeThreadId || undefined}
            onClick={() => {
              if (renamingId !== thread.id) {
                onThreadChange(thread.id);
                setMobileOpen(false);
              }
            }}
          >
            {renamingId === thread.id ? (
              <Input
                autoFocus
                className={threadRenameInput}
                value={renameDraft}
                aria-label="Thread title"
                onChange={(event) => setRenameDraft(event.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={commitRename}
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <button type="button" className={threadTitle}>
                {thread.title}
              </button>
            )}
            {renamingId !== thread.id ? (
              <div className={threadRowActions}>
                {onRenameThread ? (
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Rename ${thread.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      startRename(thread.id, thread.title);
                    }}
                  >
                    ✎
                  </Button>
                ) : null}
                {onDeleteThread ? (
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Delete ${thread.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                  >
                    ✕
                  </Button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  function renderSidebarHeader(): ReactNode {
    return (
      <div className={sidebarHeader}>
        <h2 className={sidebarTitleClass}>{sidebarTitle}</h2>
        {onNewThread ? (
          <Button type="button" variant="secondary" onClick={onNewThread}>
            + New
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={[layout, className].filter(Boolean).join(" ")}>
      <div className={sidebarColumn}>
        {renderSidebarHeader()}
        {renderThreadList()}
      </div>

      <div className={chatColumn}>
        <div className={mobileHeader}>
          <Button type="button" variant="ghost" aria-label="Open thread list" onClick={() => setMobileOpen(true)}>
            ☰
          </Button>
          <h2 className={sidebarTitleClass}>{activeThread?.title ?? sidebarTitle}</h2>
        </div>

        <Chat {...chatProps} messages={activeThread?.messages ?? []} />
      </div>

      <Drawer open={mobileOpen} onOpenChange={setMobileOpen} title={sidebarTitle} side="left">
        {onNewThread ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onNewThread();
              setMobileOpen(false);
            }}
          >
            + New thread
          </Button>
        ) : null}
        {renderThreadList()}
      </Drawer>
    </div>
  );
}
