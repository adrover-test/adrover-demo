import { useEffect, useMemo, useState } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import { requestDownload } from "../lib/download";
import {
  getClientPaymentHistory,
  type ClientPayment,
} from "../lib/clientAccountApi";

const pageSize = 10;
const filters = [
  "All statuses",
  "Completed",
  "Pending",
  "Processing",
  "Failed",
  "Refunded",
] as const;
type PaymentFilter = (typeof filters)[number];
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function displayStatus(status: string): string {
  const known = filters.find(
    (filter) =>
      filter !== "All statuses" &&
      filter.toLowerCase() === status.toLowerCase(),
  );
  return known ?? status;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : dateFormat.format(date);
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-IN")} ${currency}`;
  }
}

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function exportPayments(payments: ClientPayment[], page: number) {
  const rows = [
    [
      "Payment ID",
      "Order ID",
      "Campaign",
      "Date",
      "Amount",
      "Currency",
      "Payment method",
      "Status",
    ],
    ...payments.map((payment) => [
      payment.paymentId || "",
      payment.orderId,
      payment.advertisementName || "",
      payment.createdAt,
      payment.amount,
      payment.currency,
      payment.paymentMethod,
      displayStatus(payment.status),
    ]),
  ];
  requestDownload(
    `adrover-payment-history-page-${page}.csv`,
    rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
  );
}

export function Payments() {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<{
    items: ClientPayment[];
    total: number;
    skip: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<PaymentFilter>("All statuses");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getClientPaymentHistory(page, pageSize)
      .then((result) => {
        if (active)
          setHistory({
            items: result.items,
            total: result.total,
            skip: result.skip,
          });
      })
      .catch((failure: unknown) => {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : "We couldn't load your payment history. Please try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, retry]);

  const payments = history?.items ?? [];
  const visiblePayments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return payments.filter((payment) => {
      const status = displayStatus(payment.status);
      return (
        (filter === "All statuses" || status === filter) &&
        (!query ||
          `${payment.paymentId ?? ""} ${payment.orderId} ${payment.advertisementName ?? ""} ${payment.paymentMethod} ${status}`
            .toLocaleLowerCase()
            .includes(query))
      );
    });
  }, [filter, payments, search]);
  const pageCount = history ? Math.ceil(history.total / pageSize) : 0;
  const firstItem = history && history.total > 0 ? history.skip + 1 : 0;
  const lastItem = history
    ? Math.min(history.skip + payments.length, history.total)
    : 0;

  return (
    <section className="wrap dashboard-page payments-page">
      <PortalSidebar activeSection="payments" currentPage="payments" />
      <div className="dashboard-content">
        <header className="dashboard-heading">
          <div>
            <span className="eyebrow">CLIENT ACCOUNT</span>
            <h1>Payments</h1>
            <p>
              View your payment history and download the records shown here.
            </p>
          </div>
          <div className="dashboard-heading-actions">
            <button
              className="button yellow small"
              onClick={() => exportPayments(visiblePayments, page)}
              type="button"
              disabled={loading || visiblePayments.length === 0}
            >
              Download this page
            </button>
          </div>
        </header>

        <section
          className="dashboard-panel billing-transactions"
          aria-labelledby="payments-history-heading"
        >
          <div className="dashboard-panel-heading">
            <div>
              <h2 id="payments-history-heading">Payment history</h2>
              <p>Search and filter the records on this page.</p>
            </div>
          </div>
          {loading ? (
            <p role="status">Loading your payment history…</p>
          ) : error ? (
            <div role="alert">
              <p>{error}</p>
              <button
                className="button yellow small"
                onClick={() => setRetry((value) => value + 1)}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : history && history.total === 0 ? (
            <div className="billing-empty">
              <p>No payments to show yet.</p>
              <p>Your payment records will appear here when available.</p>
            </div>
          ) : (
            <>
              <div className="billing-controls">
                <label className="ad-list-search">
                  <span aria-hidden="true">⌕</span>
                  <span className="visually-hidden">Search this page</span>
                  <input
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search this page"
                    type="search"
                    value={search}
                  />
                </label>
                <label className="ad-list-sort">
                  <span className="visually-hidden">
                    Filter this page by payment status
                  </span>
                  <select
                    onChange={(event) =>
                      setFilter(event.target.value as PaymentFilter)
                    }
                    value={filter}
                  >
                    {filters.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="dashboard-table-scroll">
                <table className="dashboard-table billing-table">
                  <thead>
                    <tr>
                      <th scope="col">Payment ID</th>
                      <th scope="col">Order ID</th>
                      <th scope="col">Campaign</th>
                      <th scope="col">Payment date</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Payment method</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePayments.map((payment) => {
                      const status = displayStatus(payment.status);
                      return (
                        <tr key={payment.id}>
                          <th scope="row">
                            <strong>
                              {payment.paymentId || "Not provided"}
                            </strong>
                          </th>
                          <td>{payment.orderId}</td>
                          <td>{payment.advertisementName || "—"}</td>
                          <td>{formatDate(payment.createdAt)}</td>
                          <td>
                            {formatAmount(payment.amount, payment.currency)}
                          </td>
                          <td>{payment.paymentMethod || "Not provided"}</td>
                          <td>
                            <span
                              className={`billing-status billing-status-${status.toLowerCase()}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {visiblePayments.length === 0 && (
                  <p className="billing-empty">
                    No payments on this page match your search.
                  </p>
                )}
              </div>
              <div className="dashboard-table-footer">
                <span>
                  Showing {firstItem}–{lastItem} of {history?.total ?? 0}{" "}
                  payments
                </span>
                <div className="billing-controls">
                  <button
                    className="button ghost small"
                    type="button"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((value) => value - 1);
                      setSearch("");
                      setFilter("All statuses");
                    }}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page} of {Math.max(pageCount, 1)}
                  </span>
                  <button
                    className="button ghost small"
                    type="button"
                    disabled={pageCount === 0 || page >= pageCount}
                    onClick={() => {
                      setPage((value) => value + 1);
                      setSearch("");
                      setFilter("All statuses");
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="billing-help">
          <span aria-hidden="true">₹</span>
          <div>
            <h2>Need help with a payment?</h2>
            <p>Contact us if you have a question about a payment record.</p>
          </div>
          <a className="text-link" href="contact.html">
            Contact us →
          </a>
        </section>
      </div>
    </section>
  );
}
