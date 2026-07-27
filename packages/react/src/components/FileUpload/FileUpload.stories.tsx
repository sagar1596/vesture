import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileUpload } from "./FileUpload";
import type { UploadFile } from "./types";

const meta: Meta<typeof FileUpload> = {
  title: "Components/FileUpload",
  component: FileUpload,
  args: {
    files: []
  }
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

function makeFile(name: string, size: number, type = "text/plain"): File {
  return new File([new Uint8Array(size)], name, { type });
}

export const Empty: Story = {
  render: (args) => {
    function EmptyDemo() {
      const [files, setFiles] = useState<UploadFile[]>([]);
      return (
        <FileUpload
          {...args}
          files={files}
          onFilesAdded={(added) => {
            setFiles((prev) => [
              ...prev,
              ...added.map((file) => ({
                id: crypto.randomUUID(),
                file,
                status: "pending" as const,
                progress: 0
              }))
            ]);
          }}
          onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
        />
      );
    }
    return <EmptyDemo />;
  }
};

export const WithFilesInVariousStates: Story = {
  render: (args) => {
    const files: UploadFile[] = [
      { id: "1", file: makeFile("waiting.pdf", 120_000), status: "pending", progress: 0 },
      { id: "2", file: makeFile("uploading.png", 2_400_000), status: "uploading", progress: 62 },
      { id: "3", file: makeFile("done.docx", 540_000), status: "success", progress: 100 },
      {
        id: "4",
        file: makeFile("broken.zip", 8_000_000),
        status: "error",
        progress: 0,
        error: "Upload failed — connection lost"
      }
    ];
    return <FileUpload {...args} files={files} />;
  }
};

export const RejectedFiles: Story = {
  args: {
    maxSize: 1_000_000,
    maxFiles: 2,
    files: [{ id: "1", file: makeFile("already-queued.pdf", 200_000), status: "pending", progress: 0 }]
  }
};

export const SingleFileOnly: Story = {
  args: {
    multiple: false,
    files: []
  }
};

// Storybook has no built-in way to simulate a real OS-level drag session
// (dragenter/dragover carry a DataTransfer that only a genuine drag gesture
// populates), so this state isn't reproducible as a static story. To verify
// manually: drag a file from your file manager over the dropzone in this
// story and confirm the border/background highlight appears, then drag back
// out (or drop) and confirm it clears.
export const DragOverState: Story = {
  args: { files: [] }
};
