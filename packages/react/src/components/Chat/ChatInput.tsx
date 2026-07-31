import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import { Button } from "../Button";
import { FileUpload } from "../FileUpload";
import type { UploadFile } from "../FileUpload";
import { Textarea } from "../Textarea";
import {
  attachmentsPanel,
  chatInputRoot,
  inputArea,
  inputControls,
  micActive,
  speechErrorText,
  textarea as textareaClass,
  textareaWrapper
} from "./Chat.css";

// Minimal shape of the browser-native Web Speech API this component uses —
// SpeechRecognition isn't in TypeScript's default DOM lib, and pulling in a
// full @types/dom-speech-recognition package for four members isn't worth
// it. Declared locally (not globally) so it can't leak into or collide with
// a consumer's own ambient types.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike> & { length: number };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

// Chrome's own error codes — mapped to short, user-facing text so a failed
// recognition attempt (denied permission, no mic hardware, a mid-session
// network blip) is visibly explained instead of the mic button just
// silently reverting with no indication anything happened at all.
function describeSpeechError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was denied.";
    case "no-speech":
      return "No speech detected — try again.";
    case "audio-capture":
      return "No microphone was found.";
    case "network":
      return "A network error interrupted voice input.";
    default:
      return "Voice input failed. Please try again.";
  }
}

export interface ChatInputHandle {
  focus(): void;
}

export interface ChatInputProps {
  onSend: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isGenerating?: boolean;
  onFilesAdded?: (files: File[]) => void;
  /**
   * The current user's most recently sent message content, if any. Powers
   * the Arrow-Up prefill shortcut below — kept separate from the phase-2
   * Edit action: Edit mutates a specific past message in place via
   * onEditMessage, while this only prefills the compose box with a copy of
   * the last sent text for the user to tweak and (re)send as a brand new
   * message. The original message in history is never touched.
   */
  lastUserMessageContent?: string;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  { onSend, placeholder, disabled, isGenerating, onFilesAdded, lastUserMessageContent },
  ref
): ReactElement {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<UploadFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported = useRef(getSpeechRecognitionConstructor() !== undefined).current;

  useImperativeHandle(ref, () => ({
    focus() {
      textareaRef.current?.focus();
    }
  }));

  // A recognition session left running past unmount would keep the
  // microphone open indefinitely with nothing left to receive its results —
  // abort() tears it down immediately (unlike stop(), it discards any
  // pending result rather than waiting to finalize one last time).
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // Textarea.tsx has no built-in auto-resize (it's a plain forwardRef native
  // wrapper) — grow-with-content is done here via scrollHeight measurement.
  // Resetting height to "auto" first is required before reading scrollHeight,
  // otherwise a shrinking edit (e.g. deleting a line) never shrinks the box
  // back down, since scrollHeight only ever reflects the *larger* of the two.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled && !isGenerating;

  function send() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    setQueuedFiles([]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
      return;
    }
    // Only when the input is empty — an Arrow-Up in the middle of typed
    // text should move the caret like it normally does, not clobber what's
    // being written. Distinct from the phase-2 Edit action (see
    // lastUserMessageContent's doc comment above): this never touches
    // message history, it only prefills a fresh compose box.
    if (event.key === "ArrowUp" && value === "" && lastUserMessageContent) {
      event.preventDefault();
      setValue(lastUserMessageContent);
    }
  }

  // FileUpload is a controlled-queue UI with no upload logic of its own —
  // this component follows the same contract for the compose-time queue:
  // it doesn't know how (or whether) the consumer uploads these files, it
  // just tracks "attached, ready to send" locally (status "success" — there
  // is no real progress to report at this layer) and forwards the raw
  // `File[]` to the consumer via onFilesAdded for them to do with as they wish.
  function handleFilesAdded(files: File[]) {
    setQueuedFiles((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), file, status: "success" as const, progress: 100 }))
    ]);
    onFilesAdded?.(files);
  }

  function handleRemoveQueuedFile(id: string) {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function toggleRecording() {
    if (!speechSupported) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) return;
    setSpeechError(null);
    // Defensively tear down any session this component still thinks is
    // live — calling start() while the browser considers a previous
    // session still active throws InvalidStateError *synchronously*,
    // before isRecording/recognitionRef ever get set, which made voice
    // input look completely dead with zero feedback (not even an error):
    // the click just silently did nothing.
    recognitionRef.current?.abort();
    const recognition = new Ctor();
    recognition.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
    // continuous + interimResults, not the single-shot config this started
    // with: with `continuous: false`, the browser auto-ends the whole
    // session the moment it detects the first pause — the mic button still
    // read "Stop voice input" as if actively listening, but the native
    // session underneath had already silently finished, so anything said
    // after that first pause was never captured. Continuous mode keeps the
    // session open (and interim results give live feedback while speaking)
    // until the user explicitly clicks the button again to stop it.
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalTranscript = "";
    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      // Still replaces whatever was typed before recording started, rather
      // than appending — the more predictable default when a user re-records
      // after a mistake instead of having to manually clear stale text first.
      setValue(`${finalTranscript}${interimTranscript}`.trim());
    };
    recognition.onerror = (event) => {
      setSpeechError(describeSpeechError(event.error));
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    try {
      recognition.start();
    } catch {
      // start() throws synchronously (not via onerror) when the browser
      // still considers a previous session active — the abort() above
      // covers the common case, but this is the fallback so a throw here
      // is surfaced instead of silently doing nothing.
      setSpeechError("Voice input failed to start. Please try again.");
      return;
    }
    recognitionRef.current = recognition;
    setIsRecording(true);
  }

  return (
    <div className={chatInputRoot}>
      {showAttachments ? (
        <div className={attachmentsPanel}>
          <FileUpload files={queuedFiles} onFilesAdded={handleFilesAdded} onRemove={handleRemoveQueuedFile} />
        </div>
      ) : null}
      <div className={inputArea}>
        <div className={textareaWrapper}>
          <Textarea
            ref={textareaRef}
            className={textareaClass}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            // Live confirmation that recording actually started — before
            // this, the only feedback was the mic icon's color, easy to
            // miss, and with the input still empty (nothing said yet) there
            // was nothing else on screen suggesting anything was happening.
            placeholder={isRecording ? "Listening…" : (placeholder ?? "Send a message…")}
            disabled={disabled}
            rows={1}
            aria-label="Message"
          />
          {speechError ? (
            <span className={speechErrorText} role="alert">
              {speechError}
            </span>
          ) : null}
        </div>
        <div className={inputControls}>
          <Button
            type="button"
            variant="ghost"
            aria-pressed={showAttachments}
            aria-label="Attach files"
            onClick={() => setShowAttachments((v) => !v)}
            disabled={disabled}
          >
            📎
          </Button>
          {speechSupported ? (
            <Button
              type="button"
              variant="ghost"
              className={isRecording ? micActive : undefined}
              aria-pressed={isRecording}
              aria-label={isRecording ? "Stop voice input" : "Start voice input"}
              onClick={toggleRecording}
              disabled={disabled}
            >
              🎤
            </Button>
          ) : null}
          <Button type="button" onClick={send} disabled={!canSend}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
});
