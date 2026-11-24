import { useEffect, useState, type FormEvent } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import { VideoPreview } from "../components/VideoPreview";
import { requestDownload } from "../lib/download";
import {
  createAdvertisement,
  uploadAdvertisementVideo,
  uploadAdvertisementImage,
} from "../lib/advertisementApi";
import { getDemoEmail } from "../lib/portal";

type PendingCampaign = {
  id: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  videoUploaded?: boolean;
  bannerName?: string;
  bannerSize?: number;
  bannerLastModified?: number;
};

type AdDetails = {
  name: string;
};

const initialDetails: AdDetails = {
  name: "",
};

export function CreateAd() {
  const [details, setDetails] = useState(initialDetails);
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerError, setBannerError] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [pendingCampaign, setPendingCampaign] =
    useState<PendingCampaign | null>(null);
  const [completedCampaignId, setCompletedCampaignId] = useState("");
  const [busy, setBusy] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const pendingKey = `adrover-pending-video:${getDemoEmail()}`;

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(pendingKey);
      if (!stored) return;
      const value: unknown = JSON.parse(stored);
      if (
        typeof value !== "object" ||
        value === null ||
        !("id" in value) ||
        typeof value.id !== "string" ||
        !("fileName" in value) ||
        typeof value.fileName !== "string" ||
        !("fileSize" in value) ||
        typeof value.fileSize !== "number" ||
        !("lastModified" in value) ||
        typeof value.lastModified !== "number" ||
        ("videoUploaded" in value &&
          typeof value.videoUploaded !== "boolean") ||
        ("bannerName" in value &&
          (typeof value.bannerName !== "string" ||
            !("bannerSize" in value) ||
            typeof value.bannerSize !== "number" ||
            !("bannerLastModified" in value) ||
            typeof value.bannerLastModified !== "number"))
      ) {
        throw new Error(
          "The pending campaign details could not be read. Contact support before creating another campaign.",
        );
      }
      const restored: PendingCampaign = {
        id: value.id,
        fileName: value.fileName,
        fileSize: value.fileSize,
        lastModified: value.lastModified,
        videoUploaded: "videoUploaded" in value && value.videoUploaded === true,
        ...("bannerName" in value &&
        typeof value.bannerName === "string" &&
        "bannerSize" in value &&
        typeof value.bannerSize === "number" &&
        "bannerLastModified" in value &&
        typeof value.bannerLastModified === "number"
          ? {
              bannerName: value.bannerName,
              bannerSize: value.bannerSize,
              bannerLastModified: value.bannerLastModified,
            }
          : {}),
      };
      setPendingCampaign(restored);
      setStatus(
        `Your campaign is saved. Select ${restored.videoUploaded ? restored.bannerName : restored.fileName} to finish uploading.`,
      );
    } catch (failure) {
      setStorageError(true);
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to read pending campaign details. Contact support before creating another campaign.",
      );
    }
  }, [pendingKey]);

  useEffect(() => {
    if (!banner) {
      setBannerUrl("");
      return;
    }
    const url = URL.createObjectURL(banner);
    setBannerUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [banner]);

  function selectBanner(file?: File) {
    setBannerError("");
    if (!file) return;
    setBanner(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setBannerError("Choose a PNG, JPEG or WebP banner image.");
      return;
    }
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setBannerError("Choose a non-empty image of 5 MB or less.");
      return;
    }
    setBanner(file);
  }

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy || completedCampaignId || storageError || !form.reportValidity())
      return;
    if (!pendingCampaign?.videoUploaded && (!videoFile || !videoDuration)) {
      setError(
        "Choose and preview a valid video before submitting the campaign.",
      );
      return;
    }

    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const brand = String(data.get("brand") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const targetArea = String(data.get("targetArea") ?? "").trim();
    const startDate = String(data.get("startDate") ?? "");
    const endDate = String(data.get("endDate") ?? "");
    const targetPlays = Number(data.get("targetPlays"));
    const assignedCabs = Number(data.get("assignedCabs"));
    const approvalAmount = Number(data.get("approvalAmount"));

    if (!pendingCampaign && (!name || !brand || !description || !targetArea)) {
      setError("Enter a name, brand, description and target area.");
      return;
    }
    if (!pendingCampaign && (!startDate || !endDate || endDate <= startDate)) {
      setError("Choose an end date later than the campaign start date.");
      return;
    }
    if (
      !pendingCampaign &&
      (!Number.isSafeInteger(targetPlays) ||
        targetPlays < 1 ||
        !Number.isInteger(assignedCabs) ||
        assignedCabs < 1 ||
        assignedCabs > 2147483647 ||
        !Number.isFinite(approvalAmount) ||
        approvalAmount <= 0)
    ) {
      setError("Enter valid positive values for plays, cabs and budget.");
      return;
    }
    if (
      pendingCampaign &&
      !pendingCampaign.videoUploaded &&
      videoFile &&
      (pendingCampaign.fileName !== videoFile.name ||
        pendingCampaign.fileSize !== videoFile.size ||
        pendingCampaign.lastModified !== videoFile.lastModified)
    ) {
      setError(
        `Select the original video ${pendingCampaign.fileName} to retry this campaign.`,
      );
      return;
    }
    if (
      pendingCampaign?.bannerName &&
      (!banner ||
        banner.name !== pendingCampaign.bannerName ||
        banner.size !== pendingCampaign.bannerSize ||
        banner.lastModified !== pendingCampaign.bannerLastModified)
    ) {
      setError(
        `Select the original banner ${pendingCampaign.bannerName} to finish uploading.`,
      );
      return;
    }
    if (bannerError) {
      setError("Choose a valid banner or remove it before continuing.");
      return;
    }

    setBusy(true);
    setStatus("");
    setError("");
    let campaign = pendingCampaign;
    let campaignCreated = Boolean(campaign);
    try {
      if (!campaign) {
        if (!videoFile || !videoDuration)
          throw new Error("Choose and preview your video before submitting.");
        const created = await createAdvertisement({
          name,
          brand,
          description,
          targetArea,
          videoDurationSeconds: videoDuration,
          startDate: new Date(`${startDate}T00:00:00`).toISOString(),
          endDate: new Date(`${endDate}T00:00:00`).toISOString(),
          targetPlays,
          assignedCabs,
          approvalAmount,
        });

        campaign = {
          id: created.id,
          fileName: videoFile.name,
          fileSize: videoFile.size,
          lastModified: videoFile.lastModified,
          ...(banner
            ? {
                bannerName: banner.name,
                bannerSize: banner.size,
                bannerLastModified: banner.lastModified,
              }
            : {}),
        };
        campaignCreated = true;
        setPendingCampaign(campaign);
      }

      sessionStorage.setItem(pendingKey, JSON.stringify(campaign));
      if (!campaign.videoUploaded) {
        if (!videoFile)
          throw new Error("Select your video to finish uploading.");
        await uploadAdvertisementVideo(campaign.id, videoFile);
        campaign = { ...campaign, videoUploaded: true };
        setPendingCampaign(campaign);
        sessionStorage.setItem(pendingKey, JSON.stringify(campaign));
      }
      if (campaign.bannerName) {
        if (!banner) throw new Error("Select your banner to finish uploading.");
        await uploadAdvertisementImage(campaign.id, banner);
      }
      setCompletedCampaignId(campaign.id);
      sessionStorage.removeItem(pendingKey);
      setPendingCampaign(null);
      setStatus(
        "Your campaign and creative are saved. You can follow its review in My advertisements.",
      );
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "The campaign could not be submitted.";
      setError(
        campaignCreated
          ? `${message} Your campaign is already saved. Retry the upload without creating another campaign.`
          : `${message} If the server may have received the request, confirm whether the campaign was created before trying again.`,
      );
      if (campaignCreated) {
        setStatus(
          "Your campaign is saved. Finish uploading its creative below.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  function downloadBrief() {
    if (!details.name.trim()) {
      setError("Enter an advertisement name before downloading the brief.");
      return;
    }
    setError("");
    requestDownload(
      "Adrover-advertisement-review-brief.txt",
      [
        "ADROVER / ADVERTISEMENT REVIEW BRIEF",
        `Advertisement: ${details.name.trim()}`,
        `Banner image: ${banner?.name ?? "Not selected"}`,
        `Video: ${videoFile?.name ?? "Not selected"}`,
        "",
        "This is a local review brief; downloading it does not submit a campaign.",
      ].join("\n"),
    );
    setStatus("Review brief downloaded to this device.");
  }

  return (
    <section className="wrap dashboard-page create-ad-page">
      <PortalSidebar currentPage="create" activeSection="create" />
      <div className="dashboard-content create-ad-content">
        <header className="dashboard-heading">
          <div>
            <span className="eyebrow">ADVERTISER PORTAL</span>
            <h1>Create a new advertisement</h1>
            <p>
              Enter your campaign details, preview the video and submit it for
              review.
            </p>
          </div>
          <div className="dashboard-heading-actions">
            <span className="dashboard-demo-pill">
              <span aria-hidden="true" />
              Campaign workspace
            </span>
            <a
              className="button ghost small"
              href="dashboard.html#advertisements"
            >
              Cancel
            </a>
          </div>
        </header>

        <div className="dashboard-sample-note" role="note">
          <strong>Campaign submission</strong>
          <span>
            Your campaign, video and optional banner are saved to your account.
            You can track review progress in My advertisements.
          </span>
        </div>

        <ol className="create-ad-steps" aria-label="Advertisement setup steps">
          <li className="create-ad-step-active">
            <span>1</span>
            Campaign details
          </li>
          <li>
            <span>2</span>
            Preview creative
          </li>
          <li>
            <span>3</span>
            Set campaign terms
          </li>
        </ol>

        <div className="create-ad-layout">
          <form
            className="dashboard-panel create-ad-form"
            id="ad-details-form"
            onSubmit={createCampaign}
          >
            <div className="dashboard-panel-heading">
              <div>
                <h2>Campaign details</h2>
                <p>Tell us what you want to advertise and where.</p>
              </div>
              <span className="create-ad-step-number">01</span>
            </div>

            <div className="fields create-ad-fields">
              <div className="field full">
                <label htmlFor="ad-name">Advertisement name *</label>
                <input
                  autoComplete="off"
                  disabled={Boolean(pendingCampaign)}
                  id="ad-name"
                  maxLength={255}
                  name="name"
                  onChange={(event) =>
                    setDetails((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="For example, Summer launch campaign"
                  required
                  value={details.name}
                />
              </div>
              <div className="field full">
                <label htmlFor="ad-brand">Brand *</label>
                <input
                  autoComplete="organization"
                  disabled={Boolean(pendingCampaign)}
                  id="ad-brand"
                  maxLength={255}
                  name="brand"
                  placeholder="Brand or business name"
                  required
                />
              </div>
              <div className="field full">
                <label htmlFor="ad-description">Campaign description *</label>
                <textarea
                  disabled={Boolean(pendingCampaign)}
                  id="ad-description"
                  maxLength={2000}
                  name="description"
                  placeholder="Describe the campaign for the review team"
                  required
                  rows={3}
                />
              </div>
              <div className="field full">
                <label htmlFor="target-area">Target area *</label>
                <input
                  disabled={Boolean(pendingCampaign)}
                  id="target-area"
                  maxLength={500}
                  name="targetArea"
                  placeholder="For example, Hyderabad citywide"
                  required
                />
              </div>
              <p className="fine">
                Planning uses a 10-hour operating day. Daily allocation begins
                on the inclusive start date; available slots may use a house ad
                after completion. Scheduling and delivery are subject to
                confirmation.
              </p>
              <div className="field">
                <label htmlFor="start-date">Start date *</label>
                <input
                  disabled={Boolean(pendingCampaign)}
                  id="start-date"
                  name="startDate"
                  required
                  type="date"
                />
              </div>
              <div className="field">
                <label htmlFor="end-date">End date *</label>
                <input
                  disabled={Boolean(pendingCampaign)}
                  id="end-date"
                  name="endDate"
                  required
                  type="date"
                />
              </div>
              <div className="field">
                <label htmlFor="target-plays">Target plays *</label>
                <input
                  disabled={Boolean(pendingCampaign)}
                  id="target-plays"
                  min="1"
                  name="targetPlays"
                  required
                  step="1"
                  type="number"
                />
              </div>
              <div className="field">
                <label htmlFor="assigned-cabs">Requested cabs *</label>
                <input
                  disabled={Boolean(pendingCampaign)}
                  id="assigned-cabs"
                  min="1"
                  name="assignedCabs"
                  required
                  step="1"
                  type="number"
                />
              </div>
              <div className="field full">
                <label htmlFor="approval-amount">
                  Requested budget (INR) *
                </label>
                <input
                  disabled={Boolean(pendingCampaign)}
                  id="approval-amount"
                  min="0.01"
                  name="approvalAmount"
                  required
                  step="0.01"
                  type="number"
                />
                <small>
                  This is a campaign request amount, not a payment or confirmed
                  quote.
                </small>
              </div>
              <div className="field full">
                <label htmlFor="ad-banner">Optional campaign banner</label>
                <input
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  disabled={
                    busy ||
                    Boolean(completedCampaignId) ||
                    Boolean(pendingCampaign && !pendingCampaign.bannerName)
                  }
                  id="ad-banner"
                  onChange={(event) => {
                    selectBanner(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                  type="file"
                />
                <small>
                  PNG, JPEG or WebP · up to 5 MB · saved with your campaign.
                </small>
                {banner && (
                  <p className="create-ad-banner-name">
                    Selected: {banner.name} ·{" "}
                    {(banner.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
                {!pendingCampaign && (banner || bannerError) && (
                  <button
                    className="text-link"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setBanner(null);
                      setBannerError("");
                    }}
                  >
                    Remove banner
                  </button>
                )}
                {bannerError && (
                  <p className="create-ad-error" role="alert">
                    {bannerError}
                  </p>
                )}
                {bannerUrl && (
                  <img
                    className="create-ad-banner-preview"
                    src={bannerUrl}
                    alt={`Banner preview for ${details.name || "your advertisement"}`}
                  />
                )}
              </div>
            </div>

            <p className="create-ad-fields-note">
              Your campaign is saved when you submit. Keep this page open until
              your selected files finish uploading.
            </p>
          </form>

          <aside className="dashboard-panel create-ad-live-preview">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Campaign preview</h2>
                <p>See how your creative looks before submitting</p>
              </div>
              <span className="dashboard-panel-tag">TEXT PREVIEW</span>
            </div>
            <div aria-live="polite" className="create-ad-mock-screen">
              <span className="create-ad-mock-brand">
                {details.name.trim() || "Your brand"}
              </span>
              {bannerUrl && (
                <img className="create-ad-mock-banner" src={bannerUrl} alt="" />
              )}
              <strong>{details.name.trim() || "Your campaign headline"}</strong>
              <span className="create-ad-mock-area">
                Campaign creative preview
              </span>
            </div>
            <p className="fine">
              Your selected creative will be saved when you submit the campaign.
            </p>
          </aside>
        </div>

        <section
          aria-labelledby="create-ad-video-heading"
          className="create-ad-creative-section"
        >
          <div className="create-ad-section-heading">
            <span className="create-ad-step-number">02</span>
            <div>
              <h2 id="create-ad-video-heading">
                Add and preview your creative
              </h2>
              <p>
                Choose an MP4 or MOV and check it plays correctly before
                submitting.
              </p>
            </div>
          </div>
          <VideoPreview
            disabled={busy}
            onVideoChange={(file, durationSeconds) => {
              setVideoFile(file);
              setVideoDuration(durationSeconds ?? null);
            }}
          />
        </section>

        <section
          aria-labelledby="create-ad-plan-heading"
          className="create-ad-plan-section"
        >
          <div className="create-ad-section-heading">
            <span className="create-ad-step-number">03</span>
            <div>
              <h2 id="create-ad-plan-heading">Review campaign terms</h2>
              <p>
                Enter the campaign schedule, requested delivery and budget
                above.
              </p>
            </div>
          </div>
          <p className="create-ad-plan-note">
            Submitting creates a pending campaign for review. It does not charge
            a payment or confirm fleet availability.
          </p>
        </section>

        <section className="create-ad-review">
          <div>
            <span className="eyebrow">NEXT STEP</span>
            <h2>Submit campaign for review</h2>
            <p>
              Save your campaign and creative for review. No payment is
              collected at this step.
            </p>
            <p aria-live="polite" className="create-ad-status" role="status">
              {status}
            </p>
            <p aria-live="polite" className="create-ad-error" role="alert">
              {error}
            </p>
          </div>
          <div className="create-ad-review-actions">
            {completedCampaignId && (
              <a
                className="button yellow"
                href={`view-ad.html?id=${encodeURIComponent(completedCampaignId)}`}
              >
                View campaign
              </a>
            )}
            <button
              className="button ghost"
              onClick={downloadBrief}
              type="button"
            >
              Download campaign brief
            </button>
            <button
              className="button yellow"
              form="ad-details-form"
              disabled={busy || storageError || Boolean(completedCampaignId)}
              type="submit"
            >
              {completedCampaignId
                ? "Campaign submitted"
                : busy
                  ? "Submitting campaign and uploading video..."
                  : pendingCampaign
                    ? pendingCampaign.videoUploaded
                      ? "Retry banner upload"
                      : "Retry video upload"
                    : "Create campaign and upload video"}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
