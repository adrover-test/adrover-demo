import { useEffect, useState, type FormEvent } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import { VideoPreview } from "../components/VideoPreview";
import type { Advertisement } from "../lib/advertisements";
import { moneyFormat, numberFormat } from "../lib/campaign";
import { requestDownload } from "../lib/download";
import { getDemoEmail, saveAdvertisement } from "../lib/portal";

type AdDetails = {
  name: string;
};

const initialDetails: AdDetails = {
  name: "",
};

const starterPlan = {
  plays: 10_000,
  days: 7,
  price: 1_000,
};

export function CreateAd() {
  const [details, setDetails] = useState(initialDetails);
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerError, setBannerError] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [planSelected, setPlanSelected] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

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

  function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!banner) {
      setError("Add a banner image before saving this ad.");
      return;
    }
    if (!planSelected) {
      setError("Select the campaign plan before saving this ad.");
      return;
    }
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();

    const today = new Date();
    const brand = name;
    const advertisement: Advertisement = {
      id: crypto.randomUUID(),
      ownerEmail: getDemoEmail(),
      name,
      brand,
      initials:
        brand
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((word) => word[0].toLocaleUpperCase())
          .join("") || "AD",
      area: "Hyderabad citywide",
      submitted: today.toISOString().slice(0, 10),
      dates: `Start date to be confirmed · ${starterPlan.days} days requested`,
      status: "Pending approval",
      plays: 0,
      target: starterPlan.plays,
      elapsedDays: 0,
      totalDays: starterPlan.days,
      cabs: 0,
      fleet: "Fleet reservation is not confirmed",
      note: `Starter plan: ${numberFormat.format(starterPlan.plays)} plays over ${starterPlan.days} days. Illustrative amount: ${moneyFormat.format(starterPlan.price)}; no payment collected. Banner image: ${banner.name} (local preview only). Review pending; availability and final pricing require confirmation.`,
    };

    try {
      saveAdvertisement(advertisement);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The campaign could not be saved in this browser.",
      );
      return;
    }

    window.location.assign(
      `view-ad.html?id=${encodeURIComponent(advertisement.id)}`,
    );
  }

  function downloadBrief() {
    if (!details.name.trim() || !banner) {
      setError("Add an advertisement name and banner image before downloading.");
      document
        .querySelector<HTMLFormElement>("#ad-details-form")
        ?.reportValidity();
      return;
    }
    if (!planSelected) {
      setError("Select the campaign plan before downloading the review brief.");
      return;
    }
    setError("");
    requestDownload(
      "Adrover-advertisement-review-brief.txt",
      [
        "ADROVER / ADVERTISEMENT REVIEW BRIEF",
        `Advertisement: ${details.name.trim()}`,
        `Banner image: ${banner.name} (local preview only)`,
        "Target area: Hyderabad citywide (preference; to be confirmed)",
        "Start date: To be discussed",
        "End date: To be discussed",
        `Plan: ${numberFormat.format(starterPlan.plays)} plays over ${starterPlan.days} days`,
        `Illustrative amount: ${moneyFormat.format(starterPlan.price)} (not a quote)`,
        "",
        `Creative preview: local browser preview only; banner ${banner.name} and video are not included.`,
        "",
        "LOCAL REVIEW BRIEF. Nothing has been submitted, uploaded or sent.",
        "Contact Adrover to confirm availability, requirements and final pricing.",
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
              Add your campaign details, preview your creative and select a
              plan.
            </p>
          </div>
          <div className="dashboard-heading-actions">
            <span className="dashboard-demo-pill">
              <span aria-hidden="true" />
              Draft preview
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
          <strong>Local campaign storage</strong>
          <span>
            Campaigns stay in this browser. Nothing is sent to Adrover, uploaded
            or charged.
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
            Select plan &amp; review
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
                <h2>Campaign essentials</h2>
                <p>Tell us the basics so your plan is easy to review.</p>
              </div>
              <span className="create-ad-step-number">01</span>
            </div>

            <div className="fields create-ad-fields">
              <div className="field full">
                <label htmlFor="ad-name">Advertisement name *</label>
                <input
                  autoComplete="off"
                  id="ad-name"
                  maxLength={100}
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
                <label htmlFor="ad-banner">Ad banner image *</label>
                <input
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  id="ad-banner"
                  onChange={(event) => selectBanner(event.target.files?.[0])}
                  required={!banner}
                  type="file"
                />
                <small>PNG, JPEG or WebP · up to 5 MB · previewed in this browser only.</small>
                {banner && (
                  <p className="create-ad-banner-name">
                    Selected: {banner.name} · {(banner.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
                {bannerError && <p className="create-ad-error" role="alert">{bannerError}</p>}
                {bannerUrl && (
                  <img
                    className="create-ad-banner-preview"
                    src={bannerUrl}
                    alt={`Banner preview for ${details.name || "your advertisement"}`}
                  />
                )}
              </div>
            </div>

            <p className="create-ad-fields-note">Campaign area, schedule, availability and final pricing are confirmed during review. Your banner stays in this browser and is not uploaded.</p>
          </form>

          <aside className="dashboard-panel create-ad-live-preview">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Campaign preview</h2>
                <p>Updates as you edit the details</p>
              </div>
              <span className="dashboard-panel-tag">TEXT PREVIEW</span>
            </div>
            <div aria-live="polite" className="create-ad-mock-screen">
              <span className="create-ad-mock-brand">
                {details.name.trim() || "Your brand"}
              </span>
              {bannerUrl && (
                <img
                  className="create-ad-mock-banner"
                  src={bannerUrl}
                  alt=""
                />
              )}
              <strong>{details.name.trim() || "Your campaign headline"}</strong>
              <span className="create-ad-mock-area">Hyderabad citywide</span>
            </div>
            <p className="fine">
              Text mockup only. Upload a video below to preview your actual
              creative on the cab screen.
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
                Preview a supported MP4 or WebM locally. The video is not
                uploaded or attached to your brief.
              </p>
            </div>
          </div>
          <VideoPreview />
        </section>

        <section
          aria-labelledby="create-ad-plan-heading"
          className="create-ad-plan-section"
        >
          <div className="create-ad-section-heading">
            <span className="create-ad-step-number">03</span>
            <div>
              <h2 id="create-ad-plan-heading">Select your campaign plan</h2>
              <p>Choose the available starter plan for your review request.</p>
            </div>
          </div>
          <label className={`create-ad-plan-card${planSelected ? " selected" : ""}`}>
            <input
              aria-label="Select Starter plan"
              checked={planSelected}
              name="campaign-plan"
              onChange={() => setPlanSelected(true)}
              type="radio"
              value="starter"
            />
            <span className="create-ad-plan-copy">
              <strong>Starter plan</strong>
              <span>{numberFormat.format(starterPlan.plays)} plays · {starterPlan.days} days</span>
            </span>
            <strong className="create-ad-plan-price">{moneyFormat.format(starterPlan.price)}</strong>
          </label>
          <p className="create-ad-plan-note">Illustrative price only. No payment is collected; final pricing and availability require confirmation.</p>
        </section>

        <section className="create-ad-review">
          <div>
            <span className="eyebrow">NEXT STEP</span>
            <h2>Prepare a review brief</h2>
            <p>
              Download your campaign details to review or share with the Adrover
              team.
            </p>
            <p aria-live="polite" className="create-ad-status" role="status">
              {status}
            </p>
            <p aria-live="polite" className="create-ad-error" role="alert">
              {error}
            </p>
          </div>
          <div className="create-ad-review-actions">
            <button
              className="button ghost"
              onClick={downloadBrief}
              type="button"
            >
              Download brief
            </button>
            <button
              className="button yellow"
              form="ad-details-form"
              disabled={!planSelected}
              type="submit"
            >
              Submit ad for review
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
