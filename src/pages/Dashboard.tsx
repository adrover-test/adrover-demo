import { useState } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import { getAdvertiserAdvertisements } from "../lib/portal";

const dailyPlays = [
  ["23", 7200],
  ["24", 8400],
  ["25", 9100],
  ["26", 10000],
  ["27", 9600],
  ["28", 11600],
  ["29", 12200],
  ["30", 10800],
  ["31", 13400],
  ["01", 14200],
  ["02", 13800],
  ["03", 15100],
  ["04", 16000],
  ["Today", 14800],
] as const;

const numberFormat = new Intl.NumberFormat("en-IN");
const shortDate = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function Dashboard() {
  const [activeSection, setActiveSection] = useState("#overview");
  const [allAds] = useState(getAdvertiserAdvertisements);
  const pendingCount = allAds.filter(
    (advertisement) => advertisement.status === "Pending approval",
  ).length;
  const totalPlays = allAds.reduce(
    (total, advertisement) => total + advertisement.plays,
    0,
  );
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
              Here&apos;s a simple overview of how your campaigns could perform
              across Hyderabad.
            </p>
          </div>
          <div className="dashboard-heading-actions">
            <a className="button yellow small" href="create-ad.html">
              Create new ad
            </a>
          </div>
        </header>

        <div className="dashboard-sample-note" role="note">
          <strong>Campaign overview</strong>
          <span>
            All campaign, cab and play figures below are illustrative—not live
            account data.
          </span>
        </div>

        <section className="dashboard-stats" aria-label="Campaign summary">
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon ads" aria-hidden="true">
              AD
            </span>
            <span className="dashboard-stat-label">Total advertisements</span>
            <strong>{allAds.length}</strong>
            <span className="dashboard-stat-foot">
              <span>
                {allAds.filter((ad) => ad.status === "Active").length} active
              </span>
              <span>{pendingCount} pending</span>
            </span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon plays" aria-hidden="true">
              ↗
            </span>
            <span className="dashboard-stat-label">Total ad plays</span>
            <strong>{numberFormat.format(totalPlays)}</strong>
            <span className="dashboard-stat-foot dashboard-stat-positive">
              Up 18.4% this week
            </span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon cabs" aria-hidden="true">
              CAB
            </span>
            <span className="dashboard-stat-label">Active cabs</span>
            <strong>342</strong>
            <span className="dashboard-stat-foot">Across 4 routes</span>
          </article>
          <article className="dashboard-stat">
            <span className="dashboard-stat-icon pending" aria-hidden="true">
              !
            </span>
            <span className="dashboard-stat-label">Pending approvals</span>
            <strong>{pendingCount} ads</strong>
            <span className="dashboard-stat-foot">Needs a review</span>
          </article>
        </section>

        <div className="dashboard-insights">
          <section className="dashboard-panel plays-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Daily ad plays</h2>
                <p>Campaign activity over the last 14 days</p>
              </div>
              <span className="dashboard-panel-tag">14-day trend</span>
            </div>
            <div
              aria-label="Daily plays rise from 7,200 to 14,800 over 14 days"
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
                {dailyPlays.map(([day, plays], index) => (
                  <div className="plays-bar-column" key={`${day}-${index}`}>
                    <span className="plays-bar-value">
                      {index === dailyPlays.length - 1
                        ? "14.8k"
                        : index === 0
                          ? "7.2k"
                          : ""}
                    </span>
                    <span
                      className={
                        index === dailyPlays.length - 1
                          ? "plays-bar plays-bar-today"
                          : "plays-bar"
                      }
                      style={{
                        height: `${(plays / 17000) * 100}%`,
                        animationDelay: `${index * 45}ms`,
                      }}
                    />
                    <span className="plays-bar-day">{day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="plays-chart-footer">
              <span>Daily plays</span>
              <strong>14,800 today</strong>
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
              Billing tools are not part of this preview. Payment records will
              appear here when account services are connected.
            </p>
            <span className="dashboard-coming-soon">Not connected</span>
            <a className="dashboard-profile-link" href="payments.html">
              View billing history →
            </a>
          </section>
          <section className="dashboard-panel dashboard-profile-panel">
            <span className="dashboard-bottom-icon" aria-hidden="true">
              DA
            </span>
            <h2>Your profile</h2>
            <p>Enterprise advertiser</p>
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
