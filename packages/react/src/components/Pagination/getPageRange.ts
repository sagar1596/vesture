export type PageRangeItem = number | "ellipsis";

function range(start: number, end: number): number[] {
  const output: number[] = [];
  for (let i = start; i <= end; i++) {
    output.push(i);
  }
  return output;
}

export function getPageRange(page: number, totalPages: number, siblingCount = 1): PageRangeItem[] {
  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPageNumbers >= totalPages) {
    return range(1, totalPages);
  }

  const leftSiblingIndex = Math.max(page - siblingCount, 1);
  const rightSiblingIndex = Math.min(page + siblingCount, totalPages);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftItemCount = 3 + siblingCount * 2;
    return [...range(1, leftItemCount), "ellipsis", totalPages];
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightItemCount = 3 + siblingCount * 2;
    return [1, "ellipsis", ...range(totalPages - rightItemCount + 1, totalPages)];
  }

  return [1, "ellipsis", ...range(leftSiblingIndex, rightSiblingIndex), "ellipsis", totalPages];
}
