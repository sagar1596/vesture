import type { ReactElement } from "react";
import {
  connector,
  content,
  description,
  header,
  list,
  marker,
  markerColumn,
  row,
  timestamp,
  title,
} from "./Timeline.css";
import type { TimelineProps } from "./types";

export function Timeline({ items, orientation = "vertical", className }: TimelineProps): ReactElement {
  return (
    <ol className={[list, className].filter(Boolean).join(" ")} data-orientation={orientation}>
      {items.map((item) => (
        <li key={item.id} className={row} data-orientation={orientation}>
          <div className={markerColumn} data-orientation={orientation}>
            <span className={marker} data-status={item.status ?? "default"}>
              {item.icon ?? null}
            </span>
            <span className={connector} data-orientation={orientation} />
          </div>
          <div className={content}>
            <div className={header}>
              <span className={title}>{item.title}</span>
              {item.timestamp ? <span className={timestamp}>{item.timestamp}</span> : null}
            </div>
            {item.description ? <p className={description}>{item.description}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
