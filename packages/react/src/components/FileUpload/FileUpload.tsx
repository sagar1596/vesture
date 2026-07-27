import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent, ReactElement } from "react";
import { Progress } from "../Progress";
import {
  dropzone,
  dropzoneActive,
  dropzoneHint,
  dropzoneLabel,
  errorText,
  fileName,
  fileSize,
  hiddenInput,
  progressBar,
  queue,
  removeButton,
  root,
  row,
  rowError,
  rowInfo,
  rowProgress,
  successIcon
} from "./FileUpload.css";
import type { FileUploadProps, UploadFile } from "./types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

export function FileUpload({
  onFilesAdded,
  files,
  onRemove,
  accept,
  multiple = true,
  maxSize,
  maxFiles,
  disabled = false
}: FileUploadProps): ReactElement {
  const [dragActive, setDragActive] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<UploadFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function processFiles(fileList: FileList | File[]) {
    if (disabled) return;
    const all = Array.from(fileList);
    const incoming = multiple ? all : all.slice(0, 1);

    const accepted: File[] = [];
    const rejected: UploadFile[] = [];
    const existingCount = files.length;

    for (const file of incoming) {
      if (maxSize !== undefined && file.size > maxSize) {
        rejected.push({
          id: crypto.randomUUID(),
          file,
          status: "error",
          progress: 0,
          error: `File exceeds ${formatBytes(maxSize)} limit`
        });
        continue;
      }
      if (maxFiles !== undefined && existingCount + accepted.length >= maxFiles) {
        rejected.push({
          id: crypto.randomUUID(),
          file,
          status: "error",
          progress: 0,
          error: `Maximum ${maxFiles} files allowed`
        });
        continue;
      }
      accepted.push(file);
    }

    if (rejected.length > 0) {
      setRejectedFiles((prev) => [...prev, ...rejected]);
    }
    if (accepted.length > 0) {
      onFilesAdded?.(accepted);
    }
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    dragCounter.current += 1;
    setDragActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    if (disabled) return;
    processFiles(event.dataTransfer.files);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      processFiles(event.target.files);
    }
    event.target.value = "";
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  function handleRemove(id: string) {
    const isRejected = rejectedFiles.some((f) => f.id === id);
    if (isRejected) {
      setRejectedFiles((prev) => prev.filter((f) => f.id !== id));
    } else {
      onRemove?.(id);
    }
  }

  const displayedFiles = [...files, ...rejectedFiles];

  return (
    <div className={root}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        className={[dropzone, dragActive ? dropzoneActive : null].filter(Boolean).join(" ")}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className={dropzoneLabel}>Drag and drop files here, or click to browse</span>
        {accept ? <span className={dropzoneHint}>Accepted: {accept}</span> : null}
        {maxSize !== undefined ? (
          <span className={dropzoneHint}>Max size: {formatBytes(maxSize)}</span>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className={hiddenInput}
          tabIndex={-1}
          aria-hidden
          onClick={(event) => event.stopPropagation()}
          onChange={handleInputChange}
        />
      </div>

      {displayedFiles.length > 0 ? (
        <ul className={queue}>
          {displayedFiles.map((uploadFile) => (
            <li
              key={uploadFile.id}
              className={[row, uploadFile.status === "error" ? rowError : null]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={rowInfo}>
                <span className={fileName}>{uploadFile.file.name}</span>
                <span className={fileSize}>{formatBytes(uploadFile.file.size)}</span>
              </div>
              <div className={rowProgress}>
                {uploadFile.status === "error" ? (
                  <p className={errorText}>{uploadFile.error}</p>
                ) : (
                  <>
                    <Progress
                      className={progressBar}
                      value={
                        uploadFile.status === "pending"
                          ? undefined
                          : uploadFile.status === "success"
                            ? 100
                            : uploadFile.progress
                      }
                    />
                    {uploadFile.status === "success" ? (
                      <span className={successIcon} aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </>
                )}
              </div>
              <button
                type="button"
                className={removeButton}
                aria-label={`Remove ${uploadFile.file.name}`}
                onClick={() => handleRemove(uploadFile.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
