import { PortalSidebar } from "../components/PortalSidebar";
import { AdLocationHistory } from "../components/AdLocationHistory";
import type { Advertisement } from "../lib/advertisements";
import { moneyFormat, numberFormat } from "../lib/campaign";
import { requestDownload } from "../lib/download";
import { getAdvertiserAdvertisements } from "../lib/portal";

function getAdvertisement(): Advertisement | undefined {
  const id = new URLSearchParams(window.location.search).get("id");
  return getAdvertiserAdvertisements().find((ad) => ad.id === id);
}

export function ViewAd({
  admin = false,
  advertisement,
}: { admin?: boolean; advertisement?: Advertisement } = {}) {
  const ad = advertisement ?? getAdvertisement();
  if (!ad) {
    return (
      <section className="wrap section view-ad-not-found">
        <span className="eyebrow">ADVERTISER PORTAL</span>
        <h1>Advertisement not found</h1>
        <p className="muted">
          Select an advertisement from the campaign list to view its details.
        </p>
        <a className="button yellow" href="advertisements.html">
          Back to advertisements
        </a>
      </section>
    );
  }

  const campaign = ad;
  const isPending = ad.status === "Pending approval";
  const isApproved = ad.status === "Approved";
  const elapsedDays =
    ad.status === "Completed"
      ? ad.totalDays
      : isPending || isApproved
        ? 0
        : Math.min(Math.max(ad.elapsedDays, 0), ad.totalDays);
  const remainingDays = Math.max(ad.totalDays - elapsedDays, 0);
  const pendingPlays = Math.max(ad.target - ad.plays, 0);

  function downloadReport() {
    const report = [
      "ADROVER / SAMPLE CAMPAIGN REPORT",
      `Campaign ID: DEMO-${campaign.id.toUpperCase()}`,
      `Advertisement: ${campaign.name}`,
      `Brand: ${campaign.brand}`,
      `Status: ${campaign.status}`,
      `Target area: ${campaign.area}`,
      `Campaign period: ${campaign.dates}`,
      `Sample plays delivered: ${numberFormat.format(campaign.plays)}`,
      `Sample play target: ${numberFormat.format(campaign.target)}`,
      `Sample pending plays: ${numberFormat.format(pendingPlays)}`,
      `Sample fleet: ${campaign.cabs} cabs`,
      ...(campaign.approval
        ? [
            `Approved total amount (INR): ${moneyFormat.format(campaign.approval.amount)}`,
            "Awaiting payment/scheduling. No payment has been collected.",
          ]
        : []),
      "",
      "Illustrative report only. No live telemetry or account data is included.",
    ].join("\n");
    requestDownload(`Adrover-${campaign.id}-sample-report.txt`, report);
  }

  return (
    <section
      className={
        admin ? "admin-ad-content" : "wrap dashboard-page view-ad-page"
      }
    >
      {!admin && (
        <PortalSidebar
          activeSection="advertisements"
          currentPage="advertisements"
        />
      )}
      <div className="dashboard-content">
        <div className="view-ad-breadcrumb">
          <a
            href={
              admin ? "admin.html?section=approvals" : "advertisements.html"
            }
          >
            {admin ? "Ad approvals" : "My advertisements"}
          </a>
          <span aria-hidden="true">/</span>
          <span>{ad.name}</span>
        </div>

        <header className="dashboard-heading view-ad-heading">
          <div>
            <span className="eyebrow">
              CAMPAIGN ID · DEMO-{ad.id.toUpperCase()}
            </span>
            <h1>{ad.name}</h1>
            <p>
              {ad.brand} · {ad.area}
            </p>
          </div>
          <div className="dashboard-heading-actions">
            <button
              className="button ghost small"
              onClick={downloadReport}
              type="button"
            >
              Download report
            </button>
            {!admin && (
              <a className="button yellow small" href="create-ad.html">
                Create new ad
              </a>
            )}
          </div>
        </header>

        <div className="dashboard-sample-note" role="note">
          <strong>Campaign information</strong>
          <span>
            Included campaigns are illustrative. Campaigns you create stay in
            this browser and are not sent for real approval.
          </span>
        </div>

        <section
          className="dashboard-panel view-ad-status-bar"
          aria-label="Campaign status and days remaining"
        >
          <div className="view-ad-status-heading">
            <div>
              <span className="eyebrow">AD STATUS</span>
              <span
                className={`campaign-status campaign-status-${ad.status
                  .toLowerCase()
                  .replaceAll(" ", "-")}`}
              >
                {ad.status}
              </span>
            </div>
            <strong>
              {isPending || isApproved
                ? `${ad.totalDays} days requested`
                : `${remainingDays} days remaining`}
            </strong>
          </div>
          <progress
            aria-label="Campaign days completed"
            max={Math.max(ad.totalDays, 1)}
            value={elapsedDays}
          />
          <p className="view-ad-pending-plays">
            <strong>Pending plays: {numberFormat.format(pendingPlays)}</strong>
            {" · "}
            {numberFormat.format(ad.plays)} delivered of{" "}
            {numberFormat.format(ad.target)}{" "}
            {isPending ? "requested" : "target"} plays
          </p>
          <p>
            {isPending
              ? "Awaiting approval. Your campaign has not started."
              : isApproved
                ? "Approved — awaiting payment/scheduling. Your campaign has not started."
                : ad.status === "Completed"
                  ? `Campaign completed · ${ad.totalDays} of ${ad.totalDays} days`
                  : `${elapsedDays} of ${ad.totalDays} days completed`}
          </p>
        </section>

        <section className="view-ad-top-grid">
          <article className="dashboard-panel view-ad-summary">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Campaign overview</h2>
                <p>Key details at a glance</p>
              </div>
              <span className="dashboard-panel-tag">OVERVIEW</span>
            </div>
            <dl className="view-ad-meta">
              <div>
                <dt>Pending plays</dt>
                <dd>{numberFormat.format(pendingPlays)}</dd>
              </div>
              <div>
                <dt>Delivered plays</dt>
                <dd>{numberFormat.format(ad.plays)}</dd>
              </div>
              <div>
                <dt>Play target</dt>
                <dd>{numberFormat.format(ad.target)}</dd>
              </div>
              <div>
                <dt>Campaign period</dt>
                <dd>{ad.dates}</dd>
              </div>
              <div>
                <dt>Target area</dt>
                <dd>{ad.area}</dd>
              </div>
              <div>
                <dt>Advertisement</dt>
                <dd>{ad.name}</dd>
              </div>
              <div>
                <dt>Fleet status</dt>
                <dd>{ad.fleet}</dd>
              </div>
              {ad.approval && (
                <>
                  <div>
                    <dt>Assigned plays</dt>
                    <dd>{numberFormat.format(ad.approval.plays)}</dd>
                  </div>
                  <div>
                    <dt>Total campaign amount (INR)</dt>
                    <dd>{moneyFormat.format(ad.approval.amount)}</dd>
                  </div>
                  <div>
                    <dt>Approved on</dt>
                    <dd>
                      {new Date(ad.approval.approvedAt).toLocaleString("en-IN")}
                    </dd>
                  </div>
                  {admin && (
                    <div>
                      <dt>Approval recorded by</dt>
                      <dd>{ad.approval.approvedBy}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </article>

          <aside className="dashboard-panel view-ad-creative">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Creative preview</h2>
                <p>Campaign screen concept</p>
              </div>
              <span className="dashboard-panel-tag">TEXT PREVIEW</span>
            </div>
            <div className="view-ad-screen">
              <span>{ad.brand}</span>
              <strong>{ad.name}</strong>
              <small>Hyderabad · {ad.area}</small>
              <span className="view-ad-screen-button">Campaign creative</span>
            </div>
            <p className="fine">
              Text preview only. The original video asset is not stored here.
            </p>
          </aside>
        </section>
        {admin && <AdLocationHistory advertisement={ad} />}
      </div>
    </section>
  );
}
