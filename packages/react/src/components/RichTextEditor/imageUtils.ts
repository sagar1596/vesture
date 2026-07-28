// Reads a File as a base64 data URL for direct embedding when no
// onImageUpload prop is provided. This has no real backend/CDN behind it —
// consumers who want actual upload-to-server behavior (and a much smaller
// resulting HTML payload) should pass onImageUpload; falling back to
// base64-embedding here bloats the editor's HTML output significantly for
// anything beyond a small image, since base64 encoding adds ~33% overhead
// on top of the original file size and the whole thing lives inline in the
// document rather than being referenced by URL.
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
