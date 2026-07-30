import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { vars } from "@vesture/tokens";
import { Button } from "../Button";
import { cropRect, handle as handleClass, image, imageWrapper, root, visuallyHidden } from "./ImageCropper.css";
import {
  CORNER_RESIZE_HANDLES,
  RESIZE_HANDLES,
  computeInitialCropRect,
  cursorForHandle,
  mapDisplayRectToNatural,
  moveCropRect,
  resizeCropRect
} from "./ImageCropper.geometry";
import type { Rect, ResizeHandle, Size } from "./ImageCropper.geometry";
import type { ImageCropperHandle, ImageCropperProps } from "./types";

interface MoveDragState {
  pointerId: number;
  startX: number;
  startY: number;
  startRect: Rect;
}

interface ResizeDragState {
  pointerId: number;
  handle: ResizeHandle;
  startX: number;
  startY: number;
  startRect: Rect;
}

const EMPTY_SIZE: Size = { width: 0, height: 0 };
const EMPTY_RECT: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const ImageCropper = forwardRef<ImageCropperHandle, ImageCropperProps>(function ImageCropper(
  { src, aspectRatio, onCropComplete, minCropSize = 20, showConfirmButton = false, alt = "", className },
  ref
): ReactElement {
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<Size>(EMPTY_SIZE);
  const [displaySize, setDisplaySize] = useState<Size>(EMPTY_SIZE);
  const [crop, setCrop] = useState<Rect>(EMPTY_RECT);
  const [announcement, setAnnouncement] = useState("");

  const moveStateRef = useRef<MoveDragState | null>(null);
  const resizeStateRef = useRef<ResizeDragState | null>(null);

  const measureAndInit = () => {
    const imgEl = imgRef.current;
    if (!imgEl) return;
    const natural = { width: imgEl.naturalWidth, height: imgEl.naturalHeight };
    const rect = imgEl.getBoundingClientRect();
    const display = { width: rect.width, height: rect.height };
    setNaturalSize(natural);
    setDisplaySize(display);
    setCrop(computeInitialCropRect(display, aspectRatio, minCropSize));
  };

  const handleLoad = () => measureAndInit();

  // Cached images (already in the browser cache) can be `complete` before
  // React attaches the onLoad listener, which would otherwise never fire.
  useEffect(() => {
    const imgEl = imgRef.current;
    if (imgEl?.complete && imgEl.naturalWidth > 0) {
      measureAndInit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-measure whenever the source itself changes
  }, [src]);

  // Rescale the crop rect proportionally when the displayed image size
  // changes (e.g. a window resize reflows a max-width: 100% image) rather
  // than resetting it, so an in-progress crop selection survives a resize.
  useEffect(() => {
    const handleWindowResize = () => {
      const imgEl = imgRef.current;
      if (!imgEl || displaySize.width === 0 || displaySize.height === 0) return;
      const rect = imgEl.getBoundingClientRect();
      const nextDisplay = { width: rect.width, height: rect.height };
      if (nextDisplay.width === displaySize.width && nextDisplay.height === displaySize.height) return;
      const scaleX = nextDisplay.width / displaySize.width;
      const scaleY = nextDisplay.height / displaySize.height;
      setDisplaySize(nextDisplay);
      setCrop((prev) => ({
        x: prev.x * scaleX,
        y: prev.y * scaleY,
        width: prev.width * scaleX,
        height: prev.height * scaleY
      }));
    };
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [displaySize]);

  const handleMovePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture isn't implemented in every test/DOM environment; dragging
      // still works without it as long as the pointer stays over the element.
    }
    // preventDefault above blocks the browser's implicit click-to-focus, so
    // focus explicitly (same gotcha as Slider/Diagram/KanbanBoard in this library).
    event.currentTarget.focus();
    moveStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRect: crop
    };
  };

  const handleMovePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = moveStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    setCrop(moveCropRect(state.startRect, dx, dy, displaySize));
  };

  const endMoveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (moveStateRef.current?.pointerId !== event.pointerId) return;
    moveStateRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // See handleMovePointerDown.
    }
    setAnnouncement(
      `Crop area at ${Math.round(crop.x)}, ${Math.round(crop.y)}, ${Math.round(crop.width)} by ${Math.round(crop.height)} pixels`
    );
  };

  const handleResizePointerDown = (resizeHandle: ResizeHandle) => (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // See handleMovePointerDown.
    }
    event.currentTarget.focus();
    resizeStateRef.current = {
      pointerId: event.pointerId,
      handle: resizeHandle,
      startX: event.clientX,
      startY: event.clientY,
      startRect: crop
    };
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = resizeStateRef.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    setCrop(resizeCropRect(state.startRect, state.handle, dx, dy, displaySize, minCropSize, aspectRatio));
  };

  const endResizeDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (resizeStateRef.current?.pointerId !== event.pointerId) return;
    resizeStateRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // See handleMovePointerDown.
    }
    setAnnouncement(
      `Crop area resized to ${Math.round(crop.width)} by ${Math.round(crop.height)} pixels`
    );
  };

  const getCroppedImage = (): string => {
    const imgEl = imgRef.current;
    if (!imgEl || displaySize.width === 0 || displaySize.height === 0 || naturalSize.width === 0) {
      return "";
    }
    const nativeRect = mapDisplayRectToNatural(crop, displaySize, naturalSize);
    const canvasEl = document.createElement("canvas");
    canvasEl.width = Math.max(1, nativeRect.width);
    canvasEl.height = Math.max(1, nativeRect.height);
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(
      imgEl,
      nativeRect.x,
      nativeRect.y,
      nativeRect.width,
      nativeRect.height,
      0,
      0,
      nativeRect.width,
      nativeRect.height
    );
    const dataUrl = canvasEl.toDataURL("image/png");
    onCropComplete?.(dataUrl);
    return dataUrl;
  };

  useImperativeHandle(ref, () => ({ getCroppedImage }), [crop, displaySize, naturalSize, onCropComplete]);

  const handlesToRender = aspectRatio ? CORNER_RESIZE_HANDLES : RESIZE_HANDLES;

  return (
    <div className={[root, className].filter(Boolean).join(" ")}>
      <div className={imageWrapper}>
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={image}
          draggable={false}
          crossOrigin="anonymous"
          onLoad={handleLoad}
        />
        {displaySize.width > 0 && displaySize.height > 0 ? (
          <div
            role="group"
            aria-label="Crop area"
            tabIndex={0}
            className={cropRect}
            style={{
              left: crop.x,
              top: crop.y,
              width: crop.width,
              height: crop.height,
              boxShadow: `${vars.shadow.focus}, 0 0 0 9999px rgba(0, 0, 0, 0.5)`
            }}
            onPointerDown={handleMovePointerDown}
            onPointerMove={handleMovePointerMove}
            onPointerUp={endMoveDrag}
            onPointerCancel={endMoveDrag}
          >
            {handlesToRender.map((h) => (
              <div
                key={h}
                role="slider"
                aria-label={`Resize crop area (${h})`}
                aria-valuenow={Math.round(crop.width)}
                tabIndex={0}
                data-handle={h}
                data-cursor={cursorForHandle(h)}
                className={handleClass}
                style={handlePosition(h)}
                onPointerDown={handleResizePointerDown(h)}
                onPointerMove={handleResizePointerMove}
                onPointerUp={endResizeDrag}
                onPointerCancel={endResizeDrag}
              />
            ))}
          </div>
        ) : null}
      </div>
      {showConfirmButton ? (
        <Button type="button" variant="secondary" onClick={() => getCroppedImage()}>
          Crop
        </Button>
      ) : null}
      <div aria-live="polite" className={visuallyHidden}>
        {announcement}
      </div>
    </div>
  );
});

function handlePosition(h: ResizeHandle): { left: string; top: string } {
  const left = h.includes("w") ? "0%" : h.includes("e") ? "100%" : "50%";
  const top = h.includes("n") ? "0%" : h.includes("s") ? "100%" : "50%";
  return { left, top };
}
