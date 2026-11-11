import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import type { Advertisement } from "../lib/advertisements";
import {
  startDemoSession,
  saveProfile,
  saveAdvertisement,
} from "../lib/portal";
import {
  cabCountOptions,
  calculate,
  campaignDescription,
  isSupportedCabCount,
  minimumCampaignDays,
  minimumDailyPlays,
  moneyFormat,
  numberFormat,
} from "../lib/campaign";
import { payWithRazorpay, razorpayConfigured } from "../lib/razorpay";
import { saveAdVideo } from "../lib/adVideos";
import { CampaignPlanner, defaultCampaignSelection } from "./CampaignPlanner";

type Step = "creative" | "client" | "verify" | "plan" | "review" | "payment";

const previewOtp = "123456";
const steps: { id: Step; label: string }[] = [
  { id: "creative", label: "Creative" },
  { id: "client", label: "Details" },
  { id: "verify", label: "Verify" },
  { id: "plan", label: "Plan" },
  { id: "review", label: "Review" },
  { id: "payment", label: "Payment" },
];

export function AdvertiserRegistration({ onBack }: { onBack: () => void }) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDetails, setVideoDetails] = useState("");
  const [videoError, setVideoError] = useState("");
  const [step, setStep] = useState<Step>("creative");
  const [selection, setSelection] = useState(defaultCampaignSelection);
  const calculation = calculate(
    selection.vehicles,
    selection.days,
    selection.dailyPlays,
    "Cabs",
  );
  const plan = calculation.ok ? calculation.estimate : null;
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
  const [paying, setPaying] = useState(false);
  const [paymentId, setPaymentId] = useState("");

  useEffect(() => {
    if (!videoFile) {
      setVideoUrl("");
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  function selectVideo(file?: File) {
    setVideoFile(null);
    setVideoDetails("");
    setVideoError("");
    if (!file) return;
    if (!["video/mp4", "video/webm"].includes(file.type)) {
      setVideoError("Choose an MP4 or WebM video.");
      return;
    }
    if (!file.size || file.size > 100 * 1024 * 1024) {
      setVideoError("Choose a non-empty video of 100 MB or less.");
      return;
    }
    setVideoFile(file);
  }

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

  function validateRegistration(): boolean {
    if (!plan) {
      setError("Select a valid campaign plan before registering.");
      setStep("plan");
      return false;
    }
    if (!videoFile || !videoDetails || videoError) {
      setError("Choose a playable video before registering.");
      setStep("creative");
      return false;
    }
    if (!emailVerified || !phoneVerified) {
      setError("Complete both preview contact checks before registering.");
      return false;
    }
    if (!consent) {
      setError(
        "Confirm that you understand the preview limits and refund terms.",
      );
      return false;
    }
    return true;
  }

  function goToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateRegistration()) return;
    setError("");
    setStep("payment");
  }

  async function pay() {
    if (!plan || paying || !validateRegistration()) return;
    setError("");
    setPaying(true);
    try {
      const result = await payWithRazorpay({
        amountInr: plan.cost,
        description: `Adrover campaign: ${adName.trim()}`,
        customer: {
          name: client.name,
          email: client.email,
          contact: client.phone,
        },
        reference: adName.trim(),
      });
      if (result.status === "cancelled") {
        setError("Payment was cancelled. You have not been charged.");
        return;
      }
      completeRegistration(result.paymentId);
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "The payment could not be completed.",
      );
    } finally {
      setPaying(false);
    }
  }

  function completeRegistration(razorpayPaymentId: string) {
    if (!plan || !videoFile) return;
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
      target: plan.plays,
      elapsedDays: 0,
      totalDays: plan.days,
      cabs: 0,
      fleet: "Fleet allocation pending review",
      note: `Campaign plan: ${campaignDescription(plan)} Requested cabs: ${plan.vehicles}. Video: ${videoFile.name} (${videoDetails}). Banner: ${banner?.name ?? "Not provided"}. Payment ${razorpayPaymentId} received; refunded if there is an issue with the ad video or content.`,
      payment: {
        id: razorpayPaymentId,
        amount: plan.cost,
        paidAt: today.toISOString(),
      },
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
      void saveAdVideo(advertisement.id, videoFile).catch(() => undefined);
      setError("");
      setPaymentId(razorpayPaymentId);
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
                if (adName.trim() && banner && videoDetails && !videoError) {
                  setError("");
                  setStep("client");
                } else {
                  setError(
                    "Enter an ad name, choose a banner and a playable video.",
                  );
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
                  <div className="field">
                    <label htmlFor="registration-video">Campaign video *</label>
                    <input
                      id="registration-video"
                      type="file"
                      accept="video/mp4,video/webm,.mp4,.webm"
                      aria-describedby="registration-video-guidance"
                      onChange={(event) => selectVideo(event.target.files?.[0])}
                    />
                    <p className="fine" id="registration-video-guidance">
                      MP4 or WebM · up to 100 MB. Local preview only.
                    </p>
                    {videoError && (
                      <p className="error" role="alert">
                        {videoError}
                      </p>
                    )}
                  </div>
                  {videoFile && (
                    <div className="registration-source">
                      <video
                        key={videoUrl}
                        src={videoUrl}
                        controls
                        playsInline
                        muted
                        aria-label="Previously selected campaign video"
                        onLoadedMetadata={(event) => {
                          const video = event.currentTarget;
                          if (video.videoWidth > 0 && video.videoHeight > 0) {
                            setVideoDetails(
                              `${video.videoWidth} × ${video.videoHeight}`,
                            );
                          } else {
                            setVideoError(
                              "This video could not be played. Choose another file.",
                            );
                          }
                        }}
                        onError={() => {
                          setVideoDetails("");
                          setVideoError(
                            "This video could not be played. Choose another file.",
                          );
                        }}
                      />
                      <div className="registration-source-copy">
                        <span className="registration-asset-label">
                          SELECTED VIDEO
                        </span>
                        <strong>{videoFile.name}</strong>
                        <span>{videoDetails}</span>
                      </div>
                    </div>
                  )}
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
                    {videoUrl ? (
                      <video
                        key={videoUrl}
                        src={videoUrl}
                        controls
                        playsInline
                        muted
                        aria-label="Live advertisement video preview"
                      />
                    ) : (
                      <p className="registration-empty-video">
                        Choose a video to preview it on this screen.
                      </p>
                    )}
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
                  disabled={
                    !adName.trim() ||
                    !banner ||
                    !videoDetails ||
                    Boolean(videoError)
                  }
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
                <p>
                  Choose your cab count, daily plays and campaign duration to
                  estimate your budget. Cab count does not affect the price.
                </p>
              </div>
              <CampaignPlanner
                selection={selection}
                onSelectionChange={setSelection}
                embedded
              />
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
                  disabled={!plan}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          {step === "review" && (
            <form className="registration-form" onSubmit={goToPayment}>
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
                    {videoFile?.name} · {videoDetails}
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
                    {plan
                      ? campaignDescription(plan)
                      : "Select a valid campaign plan"}
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
                  I understand this is a browser-local preview: files are not
                  uploaded and OTP is not genuinely verified. I agree to pay
                  the plan amount, which is refunded if there is an issue with
                  the ad video or content.
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
                  Continue to payment
                </button>
              </div>
            </form>
          )}
          {step === "payment" && (
            <div className="registration-form">
              <div className="registration-step-heading">
                <span className="registration-step-kicker">06 / PAYMENT</span>
                <h2>Pay for your campaign</h2>
                <p>
                  Complete the payment securely with Razorpay. Your ad is
                  submitted for review once the payment succeeds.
                </p>
              </div>
              <div className="registration-payment-amount">
                <span>Amount payable</span>
                <strong>{plan ? moneyFormat.format(plan.cost) : "—"}</strong>
                <small>{plan ? campaignDescription(plan) : ""}</small>
              </div>
              <p className="registration-payment-refund">
                If there is any issue with your ad video or content, your
                payment will be refunded.
              </p>
              {!razorpayConfigured && (
                <p className="registration-payment-refund">
                  Demo mode: no Razorpay key is set, so a dummy payment is
                  simulated. No money is charged.
                </p>
              )}
              <p className="error registration-error" role="alert">
                {error}
              </p>
              <div className="registration-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep("review")}
                  disabled={paying}
                >
                  Back
                </button>
                <button
                  className="button yellow"
                  type="button"
                  onClick={pay}
                  disabled={paying || !plan}
                >
                  {paying
                    ? razorpayConfigured
                      ? "Opening Razorpay…"
                      : "Processing demo payment…"
                    : `Pay ${plan ? moneyFormat.format(plan.cost) : ""}${razorpayConfigured ? " with Razorpay" : " (demo)"}`}
                </button>
              </div>
            </div>
          )}
        </main>
        <aside className="dashboard-panel registration-sidebar">
          <span className="registration-summary-kicker">YOUR CAMPAIGN</span>
          <h2>{adName || "Your advertisement"}</h2>
          <div className="registration-summary-art">
            {bannerUrl ? (
              <img src={bannerUrl} alt="" />
            ) : (
              <span aria-hidden="true">AdRover</span>
            )}
          </div>
          <div className="registration-summary-details">
            <div>
              <span>Estimated plays</span>
              <strong id="summary-plays">
                {plan ? numberFormat.format(plan.plays) : "—"}
              </strong>
            </div>
            <div>
              <label htmlFor="summary-days">Campaign days (minimum 7)</label>
              <input
                id="summary-days"
                type="number"
                min={minimumCampaignDays}
                step="1"
                value={selection.days}
                onChange={(event) =>
                  setSelection({ ...selection, days: event.target.value })
                }
                aria-describedby="summary-pricing-note summary-pricing-error"
              />
            </div>
            <div>
              <label htmlFor="summary-daily-plays">
                Plays per day (minimum 1,000)
              </label>
              <input
                id="summary-daily-plays"
                type="number"
                min={minimumDailyPlays}
                step="1"
                value={selection.dailyPlays}
                onChange={(event) =>
                  setSelection({
                    ...selection,
                    dailyPlays: event.target.value,
                  })
                }
                aria-describedby="summary-pricing-note summary-pricing-error"
              />
            </div>
            <div>
              <label htmlFor="summary-cabs">Requested cabs</label>
              <select
                id="summary-cabs"
                value={selection.vehicles}
                onChange={(event) =>
                  setSelection({ ...selection, vehicles: event.target.value })
                }
                aria-describedby="summary-pricing-error"
                aria-invalid={!isSupportedCabCount(selection.vehicles)}
              >
                {cabCountOptions.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </div>
            <div className="registration-summary-total">
              <span>Plan amount</span>
              <strong role="status" aria-live="polite" id="summary-price">
                {plan ? moneyFormat.format(plan.cost) : "—"}
              </strong>
            </div>
          </div>
          <p
            id="summary-pricing-error"
            className="error"
            role="alert"
            hidden={calculation.ok}
          >
            {!calculation.ok && calculation.error}
          </p>
          <p id="summary-pricing-note">
            Estimated plays = plays per day × campaign days; cab count does not
            affect the estimate. Each play is 30 seconds at ₹0.30. Minimums are
            1,000 plays per day and 7 days.
          </p>
          <div className="registration-summary-status">
            <span aria-hidden="true" />
            Preview · Pending approval
          </div>
          <p>Files are not uploaded. Payment is taken via Razorpay.</p>
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
            <span className="eyebrow">PAYMENT DONE</span>
            <h2 id="registration-success-title">
              Payment received. Your ad has been submitted for review
            </h2>
            <p>
              {adName} is in the approval queue. Payment ID: {paymentId}. If
              there is any issue with your ad video or content, your payment
              will be refunded.
            </p>
            <div className="registration-success-plan">
              {plan && campaignDescription(plan)} illustrative
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
