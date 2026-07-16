import { forwardRef, useState } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { avatar, image, size, statusColor, statusDot, wrapper } from "./Avatar.css";

export type AvatarSize = keyof typeof size;
export type AvatarStatus = keyof typeof statusColor;

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { src, name, size: sizeProp = "md", status, className, ...rest },
  ref
): ReactElement {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = src && !imageFailed;

  return (
    <div ref={ref} className={[wrapper, className].filter(Boolean).join(" ")} {...rest}>
      <div className={[avatar, size[sizeProp]].join(" ")}>
        {showImage ? (
          <img
            src={src}
            alt={name ?? ""}
            className={image}
            onError={() => setImageFailed(true)}
          />
        ) : name ? (
          <span aria-hidden="true">{getInitials(name)}</span>
        ) : null}
      </div>
      {status ? (
        <span
          className={[statusDot, statusColor[status]].join(" ")}
          role="status"
          aria-label={status}
        />
      ) : null}
    </div>
  );
});
