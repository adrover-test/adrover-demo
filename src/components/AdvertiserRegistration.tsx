import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import type { Advertisement } from "../lib/advertisements";
import {
  startDemoSession,
  saveProfile,
  saveAdvertisement,
} from "../lib/portal";
import { moneyFormat, numberFormat } from "../lib/campaign";

type Step = "creative" | "client" | "verify" | "plan" | "review";

const starterPlan = { plays: 10_000, days: 7, amount: 1_000 };
const previewOtp = "123456";
const steps: { id: Step; label: string }[] = [
  { id: "creative", label: "Creative" },
  { id: "client", label: "Details" },
  { id: "verify", label: "Verify" },
  { id: "plan", label: "Plan" },
  { id: "review", label: "Review" },
];

export function AdvertiserRegistration({
  videoFile,
  videoDetails,
  onBack,
}: {
  videoFile: File;
  videoDetails: string;
  onBack: () => void;
}) {
  const [step, setStep] = useState<Step>("creative");
  const [adName, setAdName] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerError, setBannerError] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [client, setClient] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    area: "Hyderabad citywide",
  });
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

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
      setBannerError("Choose a PNG, JPEG or WebP banner.");
      return;
    }
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setBannerError("Choose a non-empty image of 5 MB or less.");
      return;
    }
    setBanner(file);
  }

  function submitClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const next = {
      name: String(data.get("client-name") ?? "").trim(),
      business: String(data.get("client-business") ?? "").trim(),
      email: String(data.get("client-email") ?? "")
        .trim()
        .toLowerCase(),
      phone: String(data.get("client-phone") ?? "").trim(),
      area: String(data.get("client-area") ?? "").trim(),
    };
    if (Object.values(next).some((value) => !value)) {
      setError("Complete all advertiser details before continuing.");
      return;
    }
    setClient(next);
    setError("");
    setStep("verify");
  }

  function verifyCode(kind: "email" | "phone") {
    const code = kind === "email" ? emailCode : phoneCode;
    if (!/^\d{6}$/.test(code)) {
      setError(`Enter the six-digit ${kind} preview code.`);
      return;
    }
    if (code !== previewOtp) {
      setError("Preview code does not match. Use the displayed preview code.");
      return;
    }
    if (kind === "email") setEmailVerified(true);
    else setPhoneVerified(true);
    setError("");
  }

  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailVerified || !phoneVerified) {
      setError("Complete both preview contact checks before registering.");
      return;
    }
    if (!consent) {
      setError(
        "Confirm that you understand this is a local preview registration.",
      );
      return;
    }
    const today = new Date();
    const advertisement: Advertisement = {
      id: crypto.randomUUID(),
      ownerEmail: client.email,
      name: adName.trim(),
      brand: client.business,
      initials:
        client.business
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((word) => word[0].toUpperCase())
          .join("") || "AD",
      area: client.area,
      submitted: today.toISOString().slice(0, 10),
      dates: "Start date pending approval",
      status: "Pending approval",
      plays: 0,
      target: starterPlan.plays,
      elapsedDays: 0,
      totalDays: starterPlan.days,
      cabs: 0,
      fleet: "Fleet allocation pending review",
      note: `Starter plan: ${numberFormat.format(starterPlan.plays)} plays over ${starterPlan.days} days · ${moneyFormat.format(starterPlan.amount)} illustrative amount. Video: ${videoFile.name} (${videoDetails}). Banner: ${banner?.name ?? "Not provided"}. No files were uploaded; price and availability require confirmation.`,
    };
    try {
      startDemoSession(client.email);
      saveProfile({
        accountName: client.name,
        businessName: client.business,
        email: client.email,
        phone: client.phone,
        area: client.area,
        advertiserType: "Business",
      });
      saveAdvertisement(advertisement);
      setError("");
      setSuccess(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The registration could not be saved in this browser.",
      );
    }
  }

  const activeIndex = steps.findIndex((entry) => entry.id === step);

  return (
    <section
      className="wrap registration-wizard"
      aria-label="Advertiser registration"
    >
      <div className="registration-progress">
        <div className="registration-progress-heading">
          <span className="eyebrow">ADVERTISER ONBOARDING</span>
          <strong>
            Step {activeIndex + 1} of {steps.length}
          </strong>
        </div>
        <div
          className="registration-road"
          aria-hidden="true"
          style={
            {
              "--road-progress": `${((activeIndex + 0.5) / steps.length) * 100}%`,
            } as CSSProperties
          }
        >
          <span className="registration-road-fill" />
          <span className="registration-road-cab">
            <svg viewBox="0 0 96 52" width="72" height="39">
              <rect x="30" y="1" width="36" height="15" rx="3" fill="#087a45" />
              <text
                x="48"
                y="12"
                textAnchor="middle"
                fontSize="9"
                fontWeight="800"
                fill="#ffd21c"
                fontFamily="Arial, sans-serif"
              >
                AD
              </text>
              <rect x="46" y="16" width="4" height="5" fill="#101814" />
              <path
                d="M10 38 L14 28 Q18 21 28 21 H66 Q76 21 81 28 L88 34 Q92 35 92 40 V42 H6 V40 Q6 38 10 38 Z"
                fill="#ffd21c"
                stroke="#101814"
                strokeWidth="2"
              />
              <path d="M24 28 Q27 24 33 24 H46 V31 H22 Z" fill="#dff1f8" />
              <path d="M50 24 H64 Q70 24 74 31 H50 Z" fill="#dff1f8" />
              <g className="registration-road-wheel">
                <circle cx="25" cy="43" r="7" fill="#101814" />
                <circle cx="25" cy="43" r="2.5" fill="#f8f7f1" />
                <rect x="24" y="37" width="2" height="3" fill="#f8f7f1" />
              </g>
              <g className="registration-road-wheel">
                <circle cx="73" cy="43" r="7" fill="#101814" />
                <circle cx="73" cy="43" r="2.5" fill="#f8f7f1" />
                <rect x="72" y="37" width="2" height="3" fill="#f8f7f1" />
              </g>
            </svg>
          </span>
        </div>
        <ol className="registration-steps" aria-label="Registration steps">
          {steps.map((entry, index) => (
            <li
              key={entry.id}
              className={[
                index < activeIndex ? "registration-step-complete" : "",
                index === activeIndex ? "registration-step-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={entry.id === step ? "step" : undefined}
            >
              <span className="registration-step-number">
                {index < activeIndex ? "✓" : index + 1}
              </span>
              <span className="registration-step-label">{entry.label}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="registration-layout">
        <main className="dashboard-panel registration-panel">
          {step === "creative" && (
            <form
              className="registration-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (adName.trim() && banner) {
                  setError("");
                  setStep("client");
                } else {
                  setError("Enter an ad name and choose a banner.");
                }
              }}
            >
              <div className="registration-step-heading">
                <span className="registration-step-kicker">01 / CREATIVE</span>
                <h2>Name your ad and add a banner</h2>
                <p>
                  Start with a campaign name and the artwork you want passengers
                  to see.
                </p>
              </div>
              <div className="registration-creative-grid">
                <div className="registration-creative-fields">
                  <div className="field">
                    <label htmlFor="registration-ad-name">
                      Advertisement name *
                    </label>
                    <input
                      id="registration-ad-name"
                      value={adName}
                      maxLength={100}
                      required
                      placeholder="For example, Summer launch"
                      onChange={(event) => setAdName(event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="registration-banner">Ad banner *</label>
                    <label
                      className="registration-upload"
                      htmlFor="registration-banner"
                    >
                      <span
                        className="registration-upload-icon"
                        aria-hidden="true"
                      >
                        ↑
                      </span>
                      <span className="registration-upload-copy">
                        <strong>
                          {banner
                            ? "Change banner image"
                            : "Choose a banner image"}
                        </strong>
                        <small>PNG, JPEG or WebP · up to 5 MB</small>
                        {banner && (
                          <span className="registration-file-name">
                            {banner.name}
                          </span>
                        )}
                      </span>
                      <span className="registration-upload-action">Browse</span>
                      <input
                        id="registration-banner"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                        required={!banner}
                        onChange={(event) =>
                          selectBanner(event.target.files?.[0])
                        }
                      />
                    </label>
                    {bannerError && (
                      <p className="error registration-error" role="alert">
                        {bannerError}
                      </p>
                    )}
                  </div>
                  <div className="registration-source">
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      muted
                      aria-label="Previously selected campaign video"
                    />
                    <div className="registration-source-copy">
                      <span className="registration-asset-label">
                        SELECTED VIDEO
                      </span>
                      <strong>{videoFile.name}</strong>
                      <span>{videoDetails}</span>
                    </div>
                  </div>
                </div>
                <section
                  className="registration-live-preview"
                  aria-label="Live creative preview"
                >
                  <div className="registration-live-preview-heading">
                    <div>
                      <span>LIVE PREVIEW</span>
                      <strong>Your ad, on the move.</strong>
                    </div>
                    <span className="registration-live-preview-tag">
                      HYDERABAD
                    </span>
                  </div>
                  <div className="registration-preview-screen">
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      muted
                      aria-label="Live advertisement video preview"
                    />
                    <div className="registration-preview-title">
                      <span className="registration-asset-label">
                        {adName || "YOUR BRAND"}
                      </span>
                      <strong>{adName || "Your campaign headline"}</strong>
                    </div>
                  </div>
                  <div className="registration-live-banner">
                    <span>CAMPAIGN BANNER</span>
                    {bannerUrl ? (
                      <img
                        src={bannerUrl}
                        alt={`Banner preview for ${adName || "your advertisement"}`}
                      />
                    ) : (
                      <strong>Your banner preview will appear here</strong>
                    )}
                  </div>
                  <p>Concept placement · Files stay in this browser</p>
                </section>
              </div>
              <p className="error registration-error" role="alert">
                {error}
              </p>
              <p className="registration-privacy-note">
                <span aria-hidden="true">i</span>
                Video and banner previews are temporary. Nothing is uploaded.
              </p>
              <div className="registration-actions">
                <button className="button ghost" type="button" onClick={onBack}>
                  Back
                </button>
                <button
                  className="button yellow"
                  type="submit"
                  disabled={!adName.trim() || !banner}
                >
                  Continue to advertiser details
                </button>
              </div>
            </form>
          )}
          {step === "client" && (
            <form className="registration-form" onSubmit={submitClient}>
              <div className="registration-step-heading">
                <span className="registration-step-kicker">
                  02 / YOUR DETAILS
                </span>
                <h2>Who should we contact?</h2>
                <p>
                  Share your details so the team can follow up about your
                  campaign.
                </p>
              </div>
              <div className="fields registration-fields">
                <div className="field">
                  <label htmlFor="client-name">Full name *</label>
                  <input
                    id="client-name"
                    name="client-name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    defaultValue={client.name}
                  />
                </div>
                <div className="field">
                  <label htmlFor="client-business">Business / brand *</label>
                  <input
                    id="client-business"
                    name="client-business"
                    autoComplete="organization"
                    required
                    maxLength={150}
                    defaultValue={client.business}
                  />
                </div>
                <div className="field">
                  <label htmlFor="client-email">Email *</label>
                  <input
                    id="client-email"
                    name="client-email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    defaultValue={client.email}
                  />
                </div>
                <div className="field">
                  <label htmlFor="client-phone">Mobile number *</label>
                  <input
                    id="client-phone"
                    name="client-phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    maxLength={25}
                    defaultValue={client.phone}
                  />
                </div>
                <div className="field full">
                  <label htmlFor="client-area">Preferred service area *</label>
                  <input
                    id="client-area"
                    name="client-area"
                    required
                    maxLength={120}
                    defaultValue={client.area}
                  />
                </div>
              </div>
              <p className="registration-privacy-note">
                <span aria-hidden="true">i</span>
                Your information is saved locally in this browser preview only.
              </p>
              <div className="registration-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep("creative")}
                >
                  Back
                </button>
                <button className="button yellow" type="submit">
                  Continue
                </button>
              </div>
            </form>
          )}
          {step === "verify" && (
            <div className="registration-form">
              <div className="registration-step-heading">
                <span className="registration-step-kicker">
                  03 / CONTACT CHECK
                </span>
                <h2>Preview email and mobile verification</h2>
                <p>Check the contact details attached to your campaign.</p>
              </div>
              <p className="registration-disclosure" role="note">
                <strong>Preview mode</strong>
                No email or SMS is sent and no real contact details are
                verified. Use the sample code shown below.
              </p>
              <div className="registration-verify-card">
                <div className="registration-verify-heading">
                  <span className="registration-verify-icon" aria-hidden="true">
                    @
                  </span>
                  <div>
                    <strong>Email address</strong>
                    <span>{client.email}</span>
                  </div>
                  {emailVerified && (
                    <span className="registration-verified">Checked</span>
                  )}
                </div>
                <p className="registration-code-hint">
                  Preview code <b>123456</b>
                </p>
                <label htmlFor="email-preview-code">
                  Enter email preview code
                </label>
                <div className="registration-code-row">
                  <input
                    id="email-preview-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={emailCode}
                    onChange={(event) => {
                      setEmailCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      setEmailVerified(false);
                    }}
                  />
                  <button
                    className="button small"
                    type="button"
                    onClick={() => verifyCode("email")}
                  >
                    {emailVerified ? "Checked" : "Verify"}
                  </button>
                </div>
              </div>
              <div className="registration-verify-card">
                <div className="registration-verify-heading">
                  <span className="registration-verify-icon" aria-hidden="true">
                    #
                  </span>
                  <div>
                    <strong>Mobile number</strong>
                    <span>{client.phone}</span>
                  </div>
                  {phoneVerified && (
                    <span className="registration-verified">Checked</span>
                  )}
                </div>
                <p className="registration-code-hint">
                  Preview code <b>123456</b>
                </p>
                <label htmlFor="phone-preview-code">
                  Enter mobile preview code
                </label>
                <div className="registration-code-row">
                  <input
                    id="phone-preview-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={phoneCode}
                    onChange={(event) => {
                      setPhoneCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      );
                      setPhoneVerified(false);
                    }}
                  />
                  <button
                    className="button small"
                    type="button"
                    onClick={() => verifyCode("phone")}
                  >
                    {phoneVerified ? "Checked" : "Verify"}
                  </button>
                </div>
              </div>
              <p className="error registration-error" role="alert">
                {error}
              </p>
              <div className="registration-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep("client")}
                >
                  Back
                </button>
                <button
                  className="button yellow"
                  type="button"
                  disabled={!emailVerified || !phoneVerified}
                  onClick={() => {
                    setError("");
                    setStep("plan");
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          {step === "plan" && (
            <div className="registration-form">
              <div className="registration-step-heading">
                <span className="registration-step-kicker">
                  04 / CAMPAIGN PLAN
                </span>
                <h2>Choose your campaign plan</h2>
                <p>One starter package is available in this preview.</p>
              </div>
              <label className="registration-plan">
                <input type="radio" name="starter-plan" checked readOnly />
                <span className="registration-plan-details">
                  <span className="registration-plan-topline">
                    <strong>Starter reach</strong>
                    <span className="registration-plan-badge">
                      SELECTED PLAN
                    </span>
                  </span>
                  <span className="registration-plan-metrics">
                    <strong>{numberFormat.format(starterPlan.plays)}</strong>{" "}
                    plays <i /> <strong>{starterPlan.days} days</strong>
                  </span>
                  <span className="registration-plan-price">
                    {moneyFormat.format(starterPlan.amount)}{" "}
                    <small>illustrative</small>
                  </span>
                </span>
              </label>
              <p className="registration-disclosure">
                <strong>Before you continue</strong>No payment is collected.
                Final pricing, placements and availability require confirmation.
              </p>
              <div className="registration-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep("verify")}
                >
                  Back
                </button>
                <button
                  className="button yellow"
                  type="button"
                  onClick={() => setStep("review")}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          {step === "review" && (
            <form className="registration-form" onSubmit={register}>
              <div className="registration-step-heading">
                <span className="registration-step-kicker">
                  05 / FINAL REVIEW
                </span>
                <h2>Review your registration</h2>
                <p>
                  Make sure everything looks right before adding your ad to the
                  review queue.
                </p>
              </div>
              <div className="registration-review">
                <div>
                  <span>Advertisement</span>
                  <strong>{adName}</strong>
                </div>
                <div>
                  <span>Video</span>
                  <strong>
                    {videoFile.name} · {videoDetails}
                  </strong>
                </div>
                <div>
                  <span>Banner</span>
                  <strong>{banner?.name}</strong>
                </div>
                <div>
                  <span>Advertiser</span>
                  <strong>
                    {client.name} · {client.business}
                  </strong>
                </div>
                <div>
                  <span>Contact</span>
                  <strong>
                    {client.email} · {client.phone}
                  </strong>
                </div>
                <div>
                  <span>Plan</span>
                  <strong>
                    {numberFormat.format(starterPlan.plays)} plays ·{" "}
                    {starterPlan.days} days ·{" "}
                    {moneyFormat.format(starterPlan.amount)}
                  </strong>
                </div>
              </div>
              {bannerUrl && (
                <img
                  className="registration-review-banner"
                  src={bannerUrl}
                  alt="Campaign banner preview"
                />
              )}
              <label className="registration-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                <span>
                  I understand this is a browser-local preview. Files are not
                  uploaded, OTP is not genuinely verified, and the displayed
                  amount is not a quote or charge.
                </span>
              </label>
              <p className="error registration-error" role="alert">
                {error}
              </p>
              <div className="registration-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep("plan")}
                >
                  Back
                </button>
                <button className="button yellow" type="submit">
                  Submit for review
                </button>
              </div>
            </form>
          )}
        </main>
        <aside className="dashboard-panel registration-sidebar">
          <span className="registration-summary-kicker">YOUR CAMPAIGN</span>
          <h2>{adName || "Your advertisement"}</h2>
          <div className="registration-summary-art">
            {bannerUrl ? (
              <img src={bannerUrl} alt="" />
            ) : (
              <span aria-hidden="true">
                adrover<span>.</span>
              </span>
            )}
          </div>
          <div className="registration-summary-details">
            <div>
              <span>Reach</span>
              <strong>{numberFormat.format(starterPlan.plays)} plays</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{starterPlan.days} days</strong>
            </div>
            <div>
              <span>Plan amount</span>
              <strong>{moneyFormat.format(starterPlan.amount)}</strong>
            </div>
          </div>
          <div className="registration-summary-status">
            <span aria-hidden="true" />
            Preview · Pending approval
          </div>
          <p>Nothing is uploaded or charged during this preview.</p>
        </aside>
      </div>
      {success && (
        <div className="registration-modal-backdrop">
          <section
            className="registration-success"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-success-title"
          >
            <span className="registration-success-icon" aria-hidden="true">
              ✓
            </span>
            <span className="eyebrow">LOCAL REGISTRATION COMPLETE</span>
            <h2 id="registration-success-title">
              Your ad is in the approval queue
            </h2>
            <p>
              {adName} has been added to this browser’s advertiser workspace for
              review. No files or messages were sent.
            </p>
            <div className="registration-success-plan">
              {numberFormat.format(starterPlan.plays)} plays ·{" "}
              {starterPlan.days} days · {moneyFormat.format(starterPlan.amount)}{" "}
              illustrative
            </div>
            <a className="button yellow" href="dashboard.html">
              Go to advertiser dashboard
            </a>
          </section>
        </div>
      )}
    </section>
  );
}
