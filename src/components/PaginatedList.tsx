import { useId, useState, type ReactNode } from "react";
import { numberFormat } from "../lib/campaign";

export function PaginatedList<T>({
  rows,
  label,
  filterKey = "",
  initialPageSize = 10,
  enabled = true,
  children,
}: {
  rows: readonly T[];
  label: string;
  filterKey?: string;
  initialPageSize?: number;
  enabled?: boolean;
  children: (rows: readonly T[]) => ReactNode;
}) {
  const selectId = useId();
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: initialPageSize,
    filterKey,
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / pagination.pageSize));
  const page =
    pagination.filterKey === filterKey
      ? Math.min(pagination.page, pageCount)
      : 1;
  if (page !== pagination.page || filterKey !== pagination.filterKey) {
    setPagination({ ...pagination, page, filterKey });
  }
  const start = (page - 1) * pagination.pageSize;
  const sizes = [...new Set([initialPageSize, 10, 25, 50])].sort(
    (a, b) => a - b,
  );
  const changePage = (value: number) =>
    setPagination({ ...pagination, page: value, filterKey });

  return (
    <>
      {children(
        enabled ? rows.slice(start, start + pagination.pageSize) : rows,
      )}
      {enabled && rows.length > 0 && (
        <nav className="admin-pagination" aria-label={`${label} pagination`}>
          <p role="status" aria-live="polite">
            Showing {numberFormat.format(start + 1)}-
            {numberFormat.format(
              Math.min(start + pagination.pageSize, rows.length),
            )}
            {" of "}
            {numberFormat.format(rows.length)}
          </p>
          <div className="admin-pagination-size">
            <label htmlFor={selectId}>Rows per page</label>
            <select
              id={selectId}
              value={pagination.pageSize}
              onChange={(event) =>
                setPagination({
                  page: 1,
                  pageSize: Number(event.target.value),
                  filterKey,
                })
              }
            >
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-pagination-actions">
            <button
              type="button"
              className="button ghost small"
              disabled={page === 1}
              onClick={() => changePage(1)}
            >
              First
            </button>
            <button
              type="button"
              className="button ghost small"
              disabled={page === 1}
              onClick={() => changePage(page - 1)}
            >
              Previous
            </button>
            <span>
              Page {numberFormat.format(page)} of{" "}
              {numberFormat.format(pageCount)}
            </span>
            <button
              type="button"
              className="button ghost small"
              disabled={page === pageCount}
              onClick={() => changePage(page + 1)}
            >
              Next
            </button>
            <button
              type="button"
              className="button ghost small"
              disabled={page === pageCount}
              onClick={() => changePage(pageCount)}
            >
              Last
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
