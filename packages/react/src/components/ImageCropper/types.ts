export interface ImageCropperProps {
  /** Image URL or data URL to crop. */
  src: string;
  /** Locks the crop rectangle to a fixed width/height ratio (e.g. 1 for square, 16/9). Freeform when omitted. */
  aspectRatio?: number;
  /** Fires only when the crop is explicitly committed via getCroppedImage() (ref) or the optional built-in confirm button — never continuously while dragging/resizing. */
  onCropComplete?: (dataUrl: string) => void;
  /** Floor on the crop rectangle's width/height, in displayed CSS pixels. @default 20 */
  minCropSize?: number;
  /**
   * Renders a built-in "Crop" button wired to getCroppedImage(). This
   * component is primarily a controlled primitive driven via its ref handle;
   * this is an opt-in convenience for the common case of not needing custom
   * confirm-button placement.
   * @default false
   */
  showConfirmButton?: boolean;
  /** Alt text for the underlying image element. @default "" */
  alt?: string;
  className?: string;
}

export interface ImageCropperHandle {
  /**
   * Draws the current crop rectangle's region of the source image onto an
   * offscreen canvas at the image's native resolution (naturalWidth/
   * naturalHeight), not its on-screen display resolution, and returns a data
   * URL. Also invokes onCropComplete with the same result.
   */
  getCroppedImage: () => string;
}
