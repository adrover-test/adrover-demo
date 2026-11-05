import type { Advertisement } from "../lib/advertisements";
import { useState } from "react";
import { getCampaignRevenueByPeriod } from "../lib/billing";
import { moneyFormat, numberFormat } from "../lib/campaign";
import { getAdPlaysByPeriod } from "../lib/adPlays";
import { chartRanges, type ChartRange } from "../lib/chartPeriods";

const statuses = [
  "Active",
  "Pending approval",
  "Approved",
  "Completed",
] as const;
const colors = ["#087a45", "#d4a20b", "#4377ae", "#8b998b"];

export function AdminCharts({ ads }: { ads: Advertisement[] }) {
  const [range, setRange] = useState<ChartRange>("monthly");
  const selectedRange = chartRanges.find((entry) => entry.value === range)!;
  const asOf = new Date();
  const playMonths = getAdPlaysByPeriod(ads, range, asOf);
  const maxPlays = Math.max(...playMonths.map((month) => month.value), 1);
  const periodPlays = playMonths.reduce(
    (total, month) => total + month.value,
    0,
  );
  const months = getCampaignRevenueByPeriod(range, asOf);
  const maxAmount = Math.max(
    ...months.map((month) => Math.abs(month.value)),
    1,
  );
  const counts = statuses.map(
    (status) => ads.filter((ad) => ad.status === status).length,
  );
  const total = ads.length;
  let offset = 0;
  const segments = counts.map((count, index) => {
    const share = total ? (count / total) * 100 : 0;
    const segment = {
      count,
      share,
      offset,
      status: statuses[index],
      color: colors[index],
    };
    offset += share;
    return segment;
  });

  return (
    <section className="admin-charts" aria-label="Dashboard charts">
      <div className="admin-chart-controls field">
        <label htmlFor="admin-chart-range">Graph period</label>
        <select
          id="admin-chart-range"
          value={range}
          onChange={(event) => {
            const next = chartRanges.find(
              (entry) => entry.value === event.target.value,
            );
            if (next) setRange(next.value);
          }}
        >
          {chartRanges.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label} — {entry.description}
            </option>
          ))}
        </select>
        <p className="fine">
          Applies to ad plays and revenue. UTC calendar periods include the
          current partial period. No recorded history is shown as zero.
        </p>
      </div>
      <article className="dashboard-panel admin-chart-panel admin-plays-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>{selectedRange.label} ad plays</h2>
            <p>
              Delivered plays across all clients · {selectedRange.description}{" "}
              (UTC)
            </p>
          </div>
          <span className="dashboard-panel-tag">
            {numberFormat.format(periodPlays)} plays in period
          </span>
        </div>
        <p className="fine">
          Illustrative monthly history for sample ads only, not live delivery.
          New ads have no delivery history; assigned play targets are excluded.
        </p>
        <div
          className="admin-chart-scroll"
          tabIndex={0}
          role="region"
          aria-label="Ad plays graph, scroll horizontally for all periods"
        >
          <div
            className="admin-revenue-chart admin-monthly-plays"
            style={{
              gridTemplateColumns: `repeat(${playMonths.length}, minmax(48px, 1fr))`,
            }}
            role="img"
            aria-label={`${selectedRange.label} ad plays: ${playMonths
              .map(
                (month) =>
                  `${month.label}: ${numberFormat.format(month.value)} plays`,
              )
              .join("; ")}`}
          >
            {playMonths.map((month, index) => (
              <div className="admin-plays-column" key={month.key}>
                <span className="admin-revenue-value">
                  {numberFormat.format(month.value)}
                </span>
                <div className="admin-revenue-track">
                  <span
                    className="admin-revenue-bar"
                    style={{
                      height: `${(month.value / maxPlays) * 100}%`,
                      animationDelay: `${Math.min(index * 35, 300)}ms`,
                    }}
                  />
                </div>
                <span className="admin-revenue-month">{month.label}</span>
              </div>
            ))}
          </div>
        </div>
        {periodPlays === 0 && (
          <p className="fine">No recorded ad plays in this period.</p>
        )}
      </article>
      <article className="dashboard-panel admin-chart-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>{selectedRange.label} campaign revenue</h2>
            <p>
              Net collected payments after refunds · {selectedRange.description}{" "}
              (UTC)
            </p>
          </div>
          <span className="dashboard-panel-tag">INR</span>
        </div>
        <p className="fine">
          Illustrative billing records; wallet deposits and unpaid approvals
          excluded.
        </p>
        <div
          className="admin-chart-scroll"
          tabIndex={0}
          role="region"
          aria-label="Revenue graph, scroll horizontally for all periods"
        >
          <div
            className="admin-revenue-chart"
            style={{
              gridTemplateColumns: `repeat(${months.length}, minmax(60px, 1fr))`,
            }}
            role="img"
            aria-label={months
              .map(
                (month) => `${month.label}: ${moneyFormat.format(month.value)}`,
              )
              .join("; ")}
          >
            {months.map((month, index) => (
              <div className="admin-revenue-column" key={month.key}>
                <span className="admin-revenue-value">
                  {moneyFormat.format(month.value)}
                </span>
                <div className="admin-revenue-track">
                  <span
                    className={`admin-revenue-bar${month.value < 0 ? " admin-revenue-negative" : ""}`}
                    style={{
                      height: `${(Math.abs(month.value) / maxAmount) * 100}%`,
                      animationDelay: `${Math.min(index * 35, 300)}ms`,
                    }}
                  />
                </div>
                <span className="admin-revenue-month">{month.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="fine">
          Negative values indicate net refunds in that period.
        </p>
      </article>
      <article className="dashboard-panel admin-chart-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Advertisements by status</h2>
            <p>All clients · {numberFormat.format(total)} total ads</p>
          </div>
        </div>
        <div className="admin-status-chart">
          <svg
            viewBox="0 0 42 42"
            role="img"
            aria-label={segments
              .map((segment) => `${segment.status}: ${segment.count}`)
              .join("; ")}
          >
            <circle
              cx="21"
              cy="21"
              r="15.9155"
              fill="none"
              stroke="#edf1ec"
              strokeWidth="5"
            />
            {segments
              .filter((segment) => segment.count > 0)
              .map((segment) => (
                <circle
                  key={segment.status}
                  className="admin-donut-segment"
                  cx="21"
                  cy="21"
                  r="15.9155"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="5"
                  strokeDasharray={`${segment.share} ${100 - segment.share}`}
                  strokeDashoffset={25 - segment.offset}
                >
                  <title>
                    {segment.status}: {segment.count}
                  </title>
                </circle>
              ))}
            <text
              x="21"
              y="21"
              textAnchor="middle"
              className="admin-donut-number"
            >
              {total}
            </text>
            <text
              x="21"
              y="26"
              textAnchor="middle"
              className="admin-donut-label"
            >
              TOTAL ADS
            </text>
          </svg>
          <ul className="admin-chart-legend">
            {segments.map((segment) => (
              <li key={segment.status}>
                <span>
                  <i style={{ background: segment.color }} aria-hidden="true" />
                  {segment.status}
                </span>
                <strong>{segment.count}</strong>
              </li>
            ))}
          </ul>
        </div>
        {total === 0 && <p className="fine">No advertisements yet.</p>}
      </article>
    </section>
  );
}
