import { useState } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import { SavedRegistrations } from "../components/SavedRegistrations";
import {
  getClientCampaigns,
  getDashboardSummary,
} from "../lib/clientCampaignApi";
import { useClientResource } from "../lib/useClientResource";

async function loadOverview() {
  const [campaigns, summary] = await Promise.all([
    getClientCampaigns(),
    getDashboardSummary(),
  ]);
  return { campaigns, summary };
}

const numberFormat = new Intl.NumberFormat("en-IN");
const shortDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function Dashboard() {
  const [activeSection, setActiveSection] = useState("#overview");
  const { data, loading, error, refresh } = useClientResource(loadOverview);
  const allAds = data?.campaigns ?? [];
  const pendingCount = data?.summary.pendingAdvertisements;
  const dailyPlays = data?.summary.dailyPlays ?? [];
  const maxDailyPlays = Math.max(1, ...dailyPlays.map((entry) => entry.plays));
  const recentAds = [...allAds]
    .sort((left, right) => right.submitted.localeCompare(left.submitted))
    .slice(0, 4);

  return (
    <section className="wrap dashboard-page">
      <PortalSidebar
        activeSection={activeSection}
        currentPage="dashboard"
        onNavigate={setActiveSection}
      />

      <div className="dashboard-content">
        <header className="dashboard-heading" id="overview">
          <div>
            <span className="eyebrow">ADVERTISER DASHBOARD</span>
            <h1>Welcome back, Advertiser</h1>
            <p>
              Track your campaigns, completed plays and next steps in one place.
            </p>
          </div>
          <div className="dashboard-heading-actions">
            <a className="button yellow small" href="create-ad.html">
              Create new ad
            </a>
          </div>
        </header>

        <SavedRegistrations resumeInDashboard onChanged={refresh} />
        {loading && <p role="status">Loading your campaign overview...</p>}
        {error && (
          <div role="alert" className="error">
            <p>{error}</p>
            <button className="button ghost small" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        <section className="dashboard-stats" aria-label="Campaign summary">
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon ads" aria-hidden="true">
              AD
            </span>
            <span className="dashboard-stat-label">Total advertisements</span>
            <strong>{data ? data.summary.totalAdvertisements : "—"}</strong>
            <span className="dashboard-stat-foot">
              <span>
                {data ? data.summary.activeAdvertisements : "—"} active
              </span>
              <span>{pendingCount ?? "—"} pending</span>
            </span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon plays" aria-hidden="true">
              ↗
            </span>
            <span className="dashboard-stat-label">Total ad plays</span>
            <strong>
              {data ? numberFormat.format(data.summary.totalPlays) : "—"}
            </strong>
            <span className="dashboard-stat-foot">Recorded campaign plays</span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon cabs" aria-hidden="true">
              CAB
            </span>
            <span className="dashboard-stat-label">Cabs playing your ads</span>
            <strong>
              {data ? numberFormat.format(data.summary.activeCabs) : "—"}
            </strong>
            <span className="dashboard-stat-foot">
              Recorded over the last 14 days
            </span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon pending" aria-hidden="true">
              !
            </span>
            <span className="dashboard-stat-label">Pending approvals</span>
            <strong>{pendingCount ?? "—"} ads</strong>
            <span className="dashboard-stat-foot">Needs a review</span>
          </article>
        </section>

        <div className="dashboard-insights">
          <section className="dashboard-panel plays-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Daily ad plays</h2>
                <p>Recorded activity over the last 14 days (UTC)</p>
              </div>
              <span className="dashboard-panel-tag">14-day trend</span>
            </div>
            <div
              aria-label={
                data
                  ? `Daily ad plays: ${dailyPlays.map((entry) => `${entry.date}: ${entry.plays}`).join(", ")}`
                  : "Daily ad plays unavailable"
              }
              className="plays-chart"
              role="img"
            >
              <div aria-hidden="true" className="plays-chart-grid">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="plays-bars">
                {dailyPlays.map(({ date, plays }, index) => (
                  <div
                    className="plays-bar-column"
                    key={date}
                    title={`${date}: ${numberFormat.format(plays)} plays`}
                  >
                    <span className="plays-bar-value">
                      {index === dailyPlays.length - 1 || index === 0
                        ? numberFormat.format(plays)
                        : ""}
                    </span>
                    <span
                      className={
                        index === dailyPlays.length - 1
                          ? "plays-bar plays-bar-today"
                          : "plays-bar"
                      }
                      style={{
                        height: `${(plays / maxDailyPlays) * 100}%`,
                        minHeight: plays === 0 ? 0 : undefined,
                        animationDelay: `${index * 45}ms`,
                      }}
                    />
                    <span className="plays-bar-day">{date.slice(8)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="plays-chart-footer">
              <span>Daily plays</span>
              <strong>
                {data
                  ? `${numberFormat.format(dailyPlays.at(-1)?.plays ?? 0)} today`
                  : "Activity unavailable"}
              </strong>
            </div>
          </section>
        </div>

        <section
          className="dashboard-panel advertisements-panel"
          id="advertisements"
        >
          <div className="dashboard-panel-heading">
            <div>
              <h2>Recent advertisements</h2>
              <p>Your latest campaigns and delivery status</p>
            </div>
            <a className="button yellow small" href="create-ad.html">
              Create new ad
            </a>
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Ad name</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Status</th>
                  <th scope="col">Total plays</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {!loading && !error && recentAds.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      No campaigns yet. Create your first ad to get started.
                    </td>
                  </tr>
                )}
                {recentAds.map((advertisement) => (
                  <tr key={advertisement.id}>
                    <th scope="row">
                      <strong>{advertisement.name}</strong>
                      <span>Target: {advertisement.area}</span>
                    </th>
                    <td>
                      {shortDate.format(
                        new Date(`${advertisement.submitted}T00:00:00`),
                      )}
                    </td>
                    <td>
                      <span
                        className={`campaign-status campaign-status-${advertisement.status
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {advertisement.status}
                      </span>
                    </td>
                    <td>{numberFormat.format(advertisement.plays)}</td>
                    <td>
                      <a
                        className="button ghost small"
                        href={`view-ad.html?id=${encodeURIComponent(advertisement.id)}`}
                        aria-label={`View details for ${advertisement.name}`}
                      >
                        View details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dashboard-table-footer">
            <span>Showing {recentAds.length} recent advertisements</span>
            <a href="advertisements.html">View all advertisements →</a>
          </div>
        </section>

        <div className="dashboard-bottom-panels">
          <section className="dashboard-panel dashboard-quiet-panel">
            <span className="dashboard-bottom-icon" aria-hidden="true">
              ₹
            </span>
            <h2>Payments &amp; history</h2>
            <p>
              Review your payments and download a statement for your records.
            </p>
            <a className="dashboard-profile-link" href="payments.html">
              View billing history →
            </a>
          </section>
          <section className="dashboard-panel dashboard-profile-panel">
            <span className="dashboard-bottom-icon" aria-hidden="true">
              DA
            </span>
            <h2>Your profile</h2>
            <p>Your advertiser account</p>
            <span className="dashboard-profile-foot">
              Review and update your business information.
            </span>
            <a className="dashboard-profile-link" href="profile.html">
              View profile →
            </a>
          </section>
        </div>
      </div>
    </section>
  );
}
