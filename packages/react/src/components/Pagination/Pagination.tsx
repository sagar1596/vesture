import type { ReactElement } from "react";
import { getPageRange } from "./getPageRange";
import { ellipsis, list, pageButton } from "./Pagination.css";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1
}: PaginationProps): ReactElement {
  const items = getPageRange(page, totalPages, siblingCount);

  return (
    <nav aria-label="Pagination">
      <ul className={list}>
        <li>
          <button
            type="button"
            className={pageButton}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            ‹
          </button>
        </li>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${index}`} className={ellipsis} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={pageButton}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </button>
            </li>
          )
        )}
        <li>
          <button
            type="button"
            className={pageButton}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </li>
      </ul>
    </nav>
  );
}
