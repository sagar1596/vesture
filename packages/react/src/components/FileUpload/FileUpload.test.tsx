import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileUpload } from "./FileUpload";
import type { UploadFile } from "./types";

function makeFile(name: string, size: number, type = "text/plain"): File {
  return new File([new Uint8Array(size)], name, { type });
}

function dropzoneEl() {
  return screen.getByRole("button", { name: /drag and drop files here/i });
}

describe("FileUpload", () => {
  it("fires onFilesAdded with the dropped File objects", () => {
    const onFilesAdded = vi.fn();
    render(<FileUpload files={[]} onFilesAdded={onFilesAdded} />);
    const file = makeFile("photo.png", 1000, "image/png");

    fireEvent.drop(dropzoneEl(), { dataTransfer: { files: [file] } });

    expect(onFilesAdded).toHaveBeenCalledTimes(1);
    expect(onFilesAdded).toHaveBeenCalledWith([file]);
  });

  it("fires onFilesAdded via the hidden file input picker path", () => {
    const onFilesAdded = vi.fn();
    const { container } = render(<FileUpload files={[]} onFilesAdded={onFilesAdded} />);
    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = makeFile("doc.pdf", 2000, "application/pdf");

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesAdded).toHaveBeenCalledTimes(1);
    expect(onFilesAdded).toHaveBeenCalledWith([file]);
  });

  it("rejects files exceeding maxSize without calling onFilesAdded", () => {
    const onFilesAdded = vi.fn();
    render(<FileUpload files={[]} onFilesAdded={onFilesAdded} maxSize={1000} />);
    const tooBig = makeFile("huge.png", 5000, "image/png");

    fireEvent.drop(dropzoneEl(), { dataTransfer: { files: [tooBig] } });

    expect(onFilesAdded).not.toHaveBeenCalled();
    expect(screen.getByText(/exceeds/i)).toBeInTheDocument();
    expect(screen.getByText("huge.png")).toBeInTheDocument();
  });

  it("rejects files that would exceed maxFiles", () => {
    const onFilesAdded = vi.fn();
    const existing: UploadFile[] = [
      { id: "1", file: makeFile("a.txt", 10), status: "success", progress: 100 }
    ];
    render(<FileUpload files={existing} onFilesAdded={onFilesAdded} maxFiles={1} />);
    const extra = makeFile("b.txt", 10);

    fireEvent.drop(dropzoneEl(), { dataTransfer: { files: [extra] } });

    expect(onFilesAdded).not.toHaveBeenCalled();
    expect(screen.getByText(/maximum 1 files allowed/i)).toBeInTheDocument();
  });

  it("calls onRemove with the correct id when a file is removed", () => {
    const onRemove = vi.fn();
    const files: UploadFile[] = [
      { id: "abc", file: makeFile("a.txt", 10), status: "pending", progress: 0 }
    ];
    render(<FileUpload files={files} onRemove={onRemove} />);

    fireEvent.click(screen.getByRole("button", { name: /remove a.txt/i }));

    expect(onRemove).toHaveBeenCalledWith("abc");
  });

  it("is keyboard-focusable and opens the file picker on Enter/Space", () => {
    render(<FileUpload files={[]} />);
    const dropzone = dropzoneEl();
    expect(dropzone).toHaveAttribute("tabIndex", "0");

    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    dropzone.focus();
    expect(dropzone).toHaveFocus();

    fireEvent.keyDown(dropzone, { key: "Enter" });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(dropzone, { key: " " });
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it("renders an indeterminate progressbar for pending files", () => {
    const files: UploadFile[] = [
      { id: "1", file: makeFile("a.txt", 10), status: "pending", progress: 0 }
    ];
    render(<FileUpload files={files} />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });

  it("renders a determinate progressbar reflecting progress while uploading", () => {
    const files: UploadFile[] = [
      { id: "1", file: makeFile("a.txt", 10), status: "uploading", progress: 42 }
    ];
    render(<FileUpload files={files} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
  });

  it("renders a full progressbar for successful files", () => {
    const files: UploadFile[] = [
      { id: "1", file: makeFile("a.txt", 10), status: "success", progress: 100 }
    ];
    render(<FileUpload files={files} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("renders the error message instead of a progressbar for failed files", () => {
    const files: UploadFile[] = [
      {
        id: "1",
        file: makeFile("a.txt", 10),
        status: "error",
        progress: 0,
        error: "Network error"
      }
    ];
    render(<FileUpload files={files} />);
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
