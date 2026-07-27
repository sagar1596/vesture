export interface UploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export interface FileUploadProps {
  /**
   * Fired when files are added via drag-drop or the file picker, before any
   * upload logic runs. FileUpload is a controlled queue UI only — it has no
   * internal upload logic or network code of any kind. The consumer owns the
   * entire upload mechanism: assign each `File` an id, add a corresponding
   * `UploadFile` entry to `files`, perform the actual upload however this
   * app does it, and update that entry's `status`/`progress` in `files` as
   * the upload proceeds.
   */
  onFilesAdded?: (files: File[]) => void;
  /** The controlled list of files and their current upload state. */
  files: UploadFile[];
  /**
   * Fired when the user removes a file from the queue, regardless of its
   * status — removal is allowed at any stage; the consumer decides whether
   * to actually cancel an in-flight upload.
   */
  onRemove?: (id: string) => void;
  /** Native `accept` attribute for the file picker input, e.g. "image/*,.pdf". */
  accept?: string;
  /** @default true */
  multiple?: boolean;
  /** Files exceeding this size (in bytes) are rejected client-side. */
  maxSize?: number;
  /** Rejects files that would push the queue past this total count. */
  maxFiles?: number;
  disabled?: boolean;
}
