import { useCallback, useState } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  getClientCampaign,
  getCampaignCreative,
  getCampaignPlayback,
} from "../lib/clientCampaignApi";
import { useClientResource } from "../lib/useClientResource";
import { moneyFormat, numberFormat } from "../lib/campaign";
import { requestDownload } from "../lib/download";
import { getDashboardDraftUrl } from "../lib/portal";
import { payForCampaign } from "../lib/campaignPaymentApi";
import {
  uploadAdvertisementImage,
  uploadAdvertisementVideo,
} from "../lib/advertisementApi";

export function ClientViewAd() {
  const id = new URLSearchParams(location.search).get("id") ?? "";
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const loadCampaign = useCallback(() => getClientCampaign(id), [id]);
  const loadCreative = useCallback(() => getCampaignCreative(id), [id]);
  const loadPlayback = useCallback(
    () => getCampaignPlayback(id, date, page),
    [id, date, page],
  );
  const campaign = useClientResource(loadCampaign);
  const creative = useClientResource(loadCreative);
  const playback = useClientResource(loadPlayback);
  const ad = campaign.data;

  async function upload(file: File | undefined, kind: "video" | "banner") {
    if (!file || uploading) return;
    setUploadError("");
    setUploadStatus("");
    const allowed =
      kind === "video" ? /\.(mp4|webm|mov)$/i : /\.(png|jpe?g|webp)$/i;
    if (
      !allowed.test(file.name) ||
      !file.size ||
      file.size > (kind === "video" ? 100 : 5) * 1024 * 1024
    ) {
      setUploadError(
        kind === "video"
          ? "Choose a non-empty MP4, WebM or MOV of 100 MB or less."
          : "Choose a non-empty PNG, JPEG or WebP of 5 MB or less.",
      );
      return;
    }
    setUploading(true);
    try {
      if (kind === "video") await uploadAdvertisementVideo(id, file);
      else await uploadAdvertisementImage(id, file);
      setUploadStatus(
        kind === "video" ? "Your video is saved." : "Your banner is saved.",
      );
      campaign.refresh();
      creative.refresh();
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Could not upload this file. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  function downloadReport() {
    if (!ad) return;
    requestDownload(
      `Adrover-${ad.id}-report.txt`,
      [
        "ADROVER / CAMPAIGN REPORT",
        `Downloaded: ${new Date().toISOString()}`,
        `Advertisement: ${ad.name}`,
        `Brand: ${ad.brand}`,
        `Status: ${ad.status}`,
        `Target area: ${ad.area}`,
        `Campaign period: ${ad.dates}`,
        `Plays delivered: ${ad.plays}`,
        `Target plays: ${ad.target}`,
        `Requested cab placements: ${ad.cabs}`,
        `Campaign amount (INR): ${ad.amount}`,
        `Amount paid (INR): ${ad.paidAmount}`,
      ].join("\n"),
    );
  }
  async function pay() {
    if (!ad || paying) return;
    setPaying(true);
    setPaymentMessage("");
    setPaymentError("");
    try {
      const result = await payForCampaign(ad.id, ad.amount);
      setPaymentMessage(
        result === "completed"
          ? "Payment confirmed. Thank you."
          : result === "processing"
            ? "Your payment is processing. Check its status before trying again."
            : "Checkout closed. You can continue when you are ready.",
      );
      campaign.refresh();
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Could not check your payment. Please try again.",
      );
    } finally {
      setPaying(false);
    }
  }
  return (
    <section className="wrap dashboard-page view-ad-page">
      <PortalSidebar
        currentPage="advertisements"
        activeSection="advertisements"
      />
      <div className="dashboard-content">
        <a className="dashboard-profile-link" href="advertisements.html">
          Back to my advertisements
        </a>
        {!ad && <h1>Campaign details</h1>}
        {campaign.loading && <p role="status">Loading your campaign...</p>}
        {campaign.error && (
          <div role="alert" className="error">
            <p>{campaign.error}</p>
            <button className="button ghost small" onClick={campaign.refresh}>
              Try again
            </button>
          </div>
        )}
        {ad && (
          <>
            <header className="dashboard-heading">
              <div>
                <span className="eyebrow">YOUR CAMPAIGN</span>
                <h1>{ad.name}</h1>
                <p>
                  {ad.brand} · {ad.area}
                </p>
              </div>
              <button
                type="button"
                className="button ghost small"
                onClick={downloadReport}
              >
                Download report
              </button>
            </header>
            <section
              className="dashboard-panel view-ad-status-bar"
              aria-label="Campaign status"
            >
              <span
                className={`campaign-status campaign-status-${ad.status.toLowerCase().replaceAll(" ", "-")}`}
              >
                {ad.status}
              </span>
              <p>
                {ad.status === "Draft"
                  ? "Your campaign is saved. Complete setup to submit it for review."
                  : ad.status === "Pending approval"
                    ? "Your campaign is awaiting review."
                    : ad.status === "Approved"
                      ? "Your campaign is approved. Scheduling will be confirmed before it starts."
                      : ad.status === "Rejected"
                        ? ad.rejectionReason ||
                          "Your campaign needs changes. Please contact us for help."
                        : ad.status === "Cancelled"
                          ? "This campaign has been cancelled."
                          : ad.status === "Completed"
                            ? "Your campaign has finished."
                            : "Your campaign is active."}
              </p>
              {ad.status === "Draft" && (
                <a
                  className="button yellow small"
                  href={getDashboardDraftUrl(ad.id)}
                >
                  Continue setup
                </a>
              )}
              {ad.status === "Approved" && ad.paidAmount < ad.amount && (
                <button
                  className="button yellow small"
                  disabled={paying}
                  onClick={() => void pay()}
                >
                  {paying ? "Checking payment..." : "Check payment / continue"}
                </button>
              )}
              {paymentMessage && <p role="status">{paymentMessage}</p>}
              {paymentError && (
                <p className="error" role="alert">
                  {paymentError}
                </p>
              )}
            </section>
            {ad.status === "Pending approval" &&
              ad.paidAmount === 0 &&
              (!ad.hasVideo || !ad.hasBanner) && (
                <section
                  className="dashboard-panel client-creative-retry"
                  aria-label="Finish creative upload"
                >
                  <h2>Finish your creative</h2>
                  <p>
                    Files already saved are kept. Add any remaining files here.
                  </p>
                  {!ad.hasVideo && (
                    <label>
                      Upload campaign video
                      <input
                        type="file"
                        accept=".mp4,.webm,.mov"
                        disabled={uploading}
                        onChange={(event) => {
                          void upload(event.target.files?.[0], "video");
                          event.target.value = "";
                        }}
                      />
                    </label>
                  )}
                  {!ad.hasBanner && (
                    <label>
                      Upload optional banner
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        disabled={uploading}
                        onChange={(event) => {
                          void upload(event.target.files?.[0], "banner");
                          event.target.value = "";
                        }}
                      />
                    </label>
                  )}
                  {uploading && (
                    <p role="status">
                      Uploading your creative. Keep this page open...
                    </p>
                  )}
                  {uploadError && (
                    <p className="error" role="alert">
                      {uploadError}
                    </p>
                  )}
                </section>
              )}
            {uploadStatus && <p role="status">{uploadStatus}</p>}
            <section className="view-ad-top-grid">
              <article className="dashboard-panel view-ad-summary">
                <h2>Campaign overview</h2>
                <dl className="view-ad-meta">
                  <div>
                    <dt>Delivered plays</dt>
                    <dd>{numberFormat.format(ad.plays)}</dd>
                  </div>
                  <div>
                    <dt>Target plays</dt>
                    <dd>{numberFormat.format(ad.target)}</dd>
                  </div>
                  <div>
                    <dt>Remaining plays</dt>
                    <dd>
                      {numberFormat.format(Math.max(0, ad.target - ad.plays))}
                    </dd>
                  </div>
                  <div>
                    <dt>Campaign period</dt>
                    <dd>{ad.dates}</dd>
                  </div>
                  <div>
                    <dt>Requested cab placements</dt>
                    <dd>{numberFormat.format(ad.cabs)}</dd>
                  </div>
                  <div>
                    <dt>Campaign amount</dt>
                    <dd>{moneyFormat.format(ad.amount)}</dd>
                  </div>
                  <div>
                    <dt>Amount paid</dt>
                    <dd>{moneyFormat.format(ad.paidAmount)}</dd>
                  </div>
                </dl>
                <p>{ad.note}</p>
              </article>
              <aside className="dashboard-panel view-ad-creative">
                <h2>Your creative</h2>
                {creative.loading && (
                  <p role="status">Loading your creative...</p>
                )}
                {(creative.error || mediaError) && (
                  <div className="error" role="alert">
                    <p>{creative.error || mediaError}</p>
                    <button
                      className="button ghost small"
                      onClick={() => {
                        setMediaError("");
                        creative.refresh();
                      }}
                    >
                      Reload creative
                    </button>
                  </div>
                )}
                {creative.data?.videoUrl && (
                  <video
                    className="view-ad-video"
                    src={creative.data.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    onError={() =>
                      setMediaError(
                        "The video could not be played. Try reloading it.",
                      )
                    }
                  />
                )}
                {creative.data?.imageUrl && (
                  <img
                    className="registration-review-banner"
                    src={creative.data.imageUrl}
                    alt={`Banner for ${ad.name}`}
                    onError={() =>
                      setMediaError(
                        "The banner could not be displayed. Try reloading it.",
                      )
                    }
                  />
                )}
                {creative.data &&
                  !creative.data.videoUrl &&
                  !creative.data.imageUrl && (
                    <p>No creative has been uploaded yet.</p>
                  )}
              </aside>
            </section>
            <section
              className="dashboard-panel"
              aria-labelledby="playback-heading"
            >
              <div className="dashboard-panel-heading">
                <div>
                  <h2 id="playback-heading">Playback history</h2>
                  <p>
                    Recorded plays and cab locations. Times are shown in your
                    local time.
                  </p>
                </div>
                <label>
                  Playback date (UTC)
                  <input
                    type="date"
                    value={date}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => {
                      if (event.target.value) {
                        setDate(event.target.value);
                        setPage(1);
                      }
                    }}
                  />
                </label>
              </div>
              {playback.loading && (
                <p role="status">Loading playback history...</p>
              )}
              {playback.error && (
                <div className="error" role="alert">
                  <p>{playback.error}</p>
                  <button
                    className="button ghost small"
                    onClick={playback.refresh}
                  >
                    Try again
                  </button>
                </div>
              )}
              {playback.data && (
                <>
                  <div className="dashboard-table-scroll">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Played at</th>
                          <th>Cab</th>
                          <th>Location</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playback.data.items.map((play) => (
                          <tr key={play.id}>
                            <td>
                              {new Date(play.playedAt).toLocaleString("en-IN")}
                            </td>
                            <td>{play.vehicleNumber || "Not recorded"}</td>
                            <td>
                              {play.latitude.toFixed(5)},{" "}
                              {play.longitude.toFixed(5)}
                            </td>
                            <td>{play.durationSeconds} seconds</td>
                          </tr>
                        ))}
                        {!playback.data.items.length && (
                          <tr>
                            <td colSpan={4}>
                              No plays recorded for this date.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="dashboard-table-footer">
                    <button
                      className="button ghost small"
                      disabled={page === 1}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      Page {page} · {numberFormat.format(playback.data.total)}{" "}
                      recorded plays
                    </span>
                    <button
                      className="button ghost small"
                      disabled={page * 25 >= playback.data.total}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  );
}
