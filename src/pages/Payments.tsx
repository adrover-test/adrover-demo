import { useMemo, useState } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import { requestDownload } from "../lib/download";
import { transactions } from "../lib/billing";

const filters = [
  "All transactions",
  "Successful",
  "Pending",
  "Refunded",
] as const;
type TransactionFilter = (typeof filters)[number];

const moneyFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function Payments() {
  const [filter, setFilter] = useState<TransactionFilter>("All transactions");
  const [search, setSearch] = useState("");

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return transactions.filter(
      (transaction) =>
        (filter === "All transactions" || transaction.status === filter) &&
        (!query ||
          `${transaction.id} ${transaction.ad} ${transaction.method}`
            .toLocaleLowerCase()
            .includes(query)),
    );
  }, [filter, search]);

  const counts = {
    "All transactions": transactions.length,
    Successful: transactions.filter((item) => item.status === "Successful")
      .length,
    Pending: transactions.filter((item) => item.status === "Pending").length,
    Refunded: transactions.filter((item) => item.status === "Refunded").length,
  };

  function downloadStatement() {
    const statement = [
      "ADROVER / SAMPLE BILLING STATEMENT",
      "Illustrative data only. This is not a tax invoice or payment receipt.",
      "",
      "Sample amount paid: INR 345000",
      "Sample campaign spending: INR 282500",
      "Sample available balance: INR 62500",
      "",
      ...transactions.map(
        (item) =>
          `${item.id},${item.date},${item.ad},${item.status},INR ${item.amount},${item.method}`,
      ),
      "",
      "No payment information or live account data is included.",
    ].join("\n");
    requestDownload("Adrover-sample-billing-statement.txt", statement);
  }

  return (
    <section className="wrap dashboard-page payments-page">
      <PortalSidebar activeSection="payments" currentPage="payments" />
      <div className="dashboard-content">
        <header className="dashboard-heading">
          <div>
            <span className="eyebrow">ADVERTISER PORTAL</span>
            <h1>Payments &amp; billing</h1>
            <p>Review your account totals and transaction history.</p>
          </div>
          <div className="dashboard-heading-actions">
            <button
              className="button yellow small"
              onClick={downloadStatement}
              type="button"
            >
              Download statement
            </button>
          </div>
        </header>

        <div className="dashboard-sample-note" role="note">
          <strong>Billing information</strong>
          <span>
            These example amounts are not a balance, invoice, payment request or
            tax document. No payments are processed here.
          </span>
        </div>

        <section
          aria-label="Billing summary"
          className="dashboard-stats billing-summary"
        >
          <article className="dashboard-stat billing-stat">
            <span className="dashboard-stat-icon ads" aria-hidden="true">
              ₹
            </span>
            <span className="dashboard-stat-label">Total amount paid</span>
            <strong>{moneyFormat.format(345000)}</strong>
            <span className="dashboard-stat-foot">All-time payments</span>
            <div className="billing-stat-bar">
              <span />
            </div>
          </article>
          <article className="dashboard-stat billing-stat">
            <span className="dashboard-stat-icon plays" aria-hidden="true">
              ◷
            </span>
            <span className="dashboard-stat-label">
              Total campaign spending
            </span>
            <strong>{moneyFormat.format(282500)}</strong>
            <span className="dashboard-stat-foot">Campaign allocation</span>
            <div className="billing-stat-bar billing-stat-bar-yellow">
              <span />
            </div>
          </article>
          <article className="dashboard-stat billing-balance">
            <span className="dashboard-stat-icon pending" aria-hidden="true">
              ₹
            </span>
            <span className="dashboard-stat-label">Available balance</span>
            <strong>{moneyFormat.format(62500)}</strong>
            <span className="dashboard-stat-foot">
              Example unallocated amount
            </span>
            <a href="contact.html">Ask about billing →</a>
          </article>
        </section>

        <section className="dashboard-panel billing-transactions">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Tax invoices &amp; transaction history</h2>
            </div>
            <span className="dashboard-panel-tag">SAMPLE HISTORY</span>
          </div>

          <div className="billing-controls">
            <label className="ad-list-search">
              <span aria-hidden="true">⌕</span>
              <span className="visually-hidden">Search transactions</span>
              <input
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ID, campaign or method"
                type="search"
                value={search}
              />
            </label>
            <label className="ad-list-sort">
              <span className="visually-hidden">
                Filter by transaction status
              </span>
              <select
                onChange={(event) =>
                  setFilter(event.target.value as TransactionFilter)
                }
                value={filter}
              >
                {filters.map((status) => (
                  <option key={status} value={status}>
                    {status} ({counts[status]})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="dashboard-table-scroll">
            <table className="dashboard-table billing-table">
              <thead>
                <tr>
                  <th scope="col">Transaction ID</th>
                  <th scope="col">Advertisement</th>
                  <th scope="col">Payment date</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Payment method</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <th scope="row">
                      <strong>{transaction.id}</strong>
                      <span>{transaction.reference}</span>
                    </th>
                    <td>{transaction.ad}</td>
                    <td>
                      {dateFormat.format(
                        new Date(`${transaction.date}T00:00:00`),
                      )}
                    </td>
                    <td>
                      {transaction.status === "Refunded" ? "−" : ""}
                      {moneyFormat.format(transaction.amount)}
                    </td>
                    <td>{transaction.method}</td>
                    <td>
                      <span
                        className={`billing-status billing-status-${transaction.status.toLowerCase()}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <p className="billing-empty">
                No transactions match that search.
              </p>
            )}
          </div>
          <div className="dashboard-table-footer">
            <span>
              Showing {filteredTransactions.length} of {transactions.length}{" "}
              entries
            </span>
            <span>All amounts shown in Indian rupees (INR)</span>
          </div>
        </section>

        <section className="billing-help">
          <span aria-hidden="true">₹</span>
          <div>
            <h2>Need help with an invoice or tax details?</h2>
            <p>
              Billing support is not connected in this preview. Contact Adrover
              to discuss account or documentation questions.
            </p>
          </div>
          <a className="text-link" href="contact.html">
            Contact us →
          </a>
        </section>
      </div>
    </section>
  );
}
