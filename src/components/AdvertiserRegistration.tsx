import { isCampaignLocked, type SchedulingState } from "../lib/scheduling";
import { SchedulingStatus } from "./SchedulingStatus";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { getDashboardDraftUrl, startDemoSession } from "../lib/portal";
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
import { payForCampaign } from "../lib/campaignPaymentApi";
import { getClientToken, loginClient, registerClient } from "../lib/clientAuth";
import {
  getRegistrationDraft,
  saveRegistrationDraft,
  type RegistrationProgress,
  uploadAdvertisementVideo,
  uploadAdvertisementImage,
} from "../lib/advertisementApi";
import { CampaignPlanner, defaultCampaignSelection } from "./CampaignPlanner";

type Step = "creative" | "client" | "plan" | "review" | "payment";

const steps: { id: Step; label: string }[] = [
  { id: "creative", label: "Creative" },
  { id: "client", label: "Details & account" },
  { id: "plan", label: "Plan" },
  { id: "review", label: "Review" },
  { id: "payment", label: "Payment" },
];

const setupSteps = steps.filter(({ id }) => id !== "client");

function serializeProgress(value: RegistrationProgress) {
  return JSON.stringify(value, Object.keys(value).sort());
}

export function AdvertiserRegistration({
  onBack,
  draftId,
  onDismiss,
}: {
  onBack: () => void;
  draftId?: string;
  onDismiss?: () => void;
}) {
  const inDashboard = Boolean(onDismiss);
  const visibleSteps = inDashboard ? setupSteps : steps;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [advancing, setAdvancing] = useState(false);
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
  const [accountCreated, setAccountCreated] = useState(false);
  const [accountSignedIn, setAccountSignedIn] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [scheduling, setScheduling] = useState<SchedulingState>({});
  const [loadingDraft, setLoadingDraft] = useState(Boolean(draftId));
  const [startDate, setStartDate] = useState("");
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [assetsUploaded, setAssetsUploaded] = useState(false);
  const newDraftId = useRef(crypto.randomUUID());
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const saveTimer = useRef<number | undefined>(undefined);
  const lastSaved = useRef("");
  const resumeAfterCreative = useRef<RegistrationProgress["step"]>("plan");
  const [saveStatus, setSaveStatus] = useState("");

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = 0;
    if (!loadingDraft)
      body
        .querySelector<HTMLElement>(
          ".registration-step-heading h2, .campaign-setup-complete h3",
        )
        ?.focus();
  }, [step, loadingDraft, success]);

  useEffect(() => {
    if (!draftId) return;
    if (!getClientToken()) {
      window.location.replace(
        `login.html?next=${encodeURIComponent(getDashboardDraftUrl(draftId))}`,
      );
      return;
    }
    let cancelled = false;
    getRegistrationDraft(draftId)
      .then((draft) => {
        if (cancelled) return;
        setScheduling(draft);
        const p = draft.progress;
        lastSaved.current = serializeProgress(p);
        resumeAfterCreative.current = p.step;
        setCampaignId(draft.id);
        setAdName(p.name);
        setClient((previous) => ({
          ...previous,
          business: p.brand,
          area: p.targetArea,
        }));
        setSelection({
          vehicles: p.cabs,
          days: p.days,
          dailyPlays: p.dailyPlays,
        });
        setVideoDuration(p.videoDurationSeconds);
        setVideoDetails(draft.hasVideo ? "Video already uploaded" : "");
        setVideoUploaded(draft.hasVideo);
        setAssetsUploaded(draft.hasBanner);
        setAccountSignedIn(true);
        setAccountCreated(true);
        setConsent(p.consent);
        setStartDate(p.startDate);
        setPaymentStarted(draft.paymentStarted);
        setStep(
          !draft.hasVideo || !draft.hasBanner
            ? "creative"
            : draft.paymentStarted
              ? "payment"
              : p.step,
        );
        setSuccess(draft.paidAmount > 0);
        setSaveStatus("Draft restored from your account.");
      })
      .catch((failure) => {
        if (!cancelled)
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not load campaign draft.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingDraft(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const progress: RegistrationProgress = {
    id: campaignId,
    name: adName.trim(),
    brand: client.business,
    targetArea: client.area,
    videoDurationSeconds: videoDuration ?? 0,
    days: selection.days,
    dailyPlays: selection.dailyPlays,
    cabs: selection.vehicles,
    startDate,
    consent,
    step:
      step === "creative"
        ? resumeAfterCreative.current
        : step === "client"
          ? "plan"
          : step,
  };
  const serializedProgress = serializeProgress(progress);
  const canSave = Boolean(
    campaignId &&
    accountSignedIn &&
    !loadingDraft &&
    !paymentStarted &&
    !isCampaignLocked(scheduling) &&
    !success,
  );
  const busy = uploading || paying || advancing || closing;

  async function dismiss() {
    if (!onDismiss || busy) return;
    setClosing(true);
    setCloseError("");
    window.clearTimeout(saveTimer.current);
    try {
      await saveQueue.current.catch(() => {
        // Retry the latest snapshot below if the queued save failed.
      });
      if (canSave && serializedProgress !== lastSaved.current)
        await persistDraft(progress);
      dialogRef.current?.close();
      onDismiss();
    } catch (failure) {
      setCloseError(
        failure instanceof Error
          ? failure.message
          : "Could not save your changes.",
      );
      setClosing(false);
    }
  }

  useEffect(() => {
    if (!inDashboard) return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (busy || (canSave && serializedProgress !== lastSaved.current)) {
        event.preventDefault();
        event.returnValue = true;
      }
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [inDashboard, busy, canSave, serializedProgress]);

  function persistDraft(value: RegistrationProgress) {
    setSaveStatus("Saving draft...");
    const operation = saveQueue.current.then(
      () => saveRegistrationDraft(value),
      () => saveRegistrationDraft(value),
    );
    const saved = operation.then((draft) => {
      lastSaved.current = serializeProgress(value);
      setSaveStatus(
        "Draft saved to your account. You can sign in later to continue.",
      );
      return draft;
    });
    saveQueue.current = saved;
    return saved;
  }

  useEffect(() => {
    if (
      !canSave ||
      busy ||
      creatingAccount ||
      step === "creative" ||
      step === "client"
    )
      return;
    const value: RegistrationProgress = JSON.parse(serializedProgress);
    saveTimer.current = window.setTimeout(() => {
      void saveQueue.current
        .catch(() => undefined)
        .then(() => {
          if (serializedProgress !== lastSaved.current)
            return persistDraft(value);
        })
        .catch((failure) => {
          setSaveStatus("Draft changes were not saved.");
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not save your draft. Try saving again.",
          );
        });
    }, 500);
    return () => window.clearTimeout(saveTimer.current);
  }, [serializedProgress, canSave, busy, creatingAccount, step]);

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
    setVideoDuration(null);
    setVideoError("");
    if (!file) return;
    if (
      !/\.(mp4|mov)$/i.test(file.name) ||
      (file.type && !["video/mp4", "video/quicktime"].includes(file.type))
    ) {
      setVideoError("Choose an MP4 or MOV video.");
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

  async function submitClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (creatingAccount || !form.reportValidity()) return;
    if (accountSignedIn && !getClientToken()) {
      setAccountSignedIn(false);
      setError(
        "Your session is unavailable. Enter your password to sign in again.",
      );
      return;
    }
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
    const password = String(data.get("client-password") ?? "");
    if (
      !accountSignedIn &&
      password !== String(data.get("client-password-confirm") ?? "")
    ) {
      setError("Passwords do not match.");
      return;
    }
    if (!videoFile || !banner || !videoDuration || !plan) {
      setError(
        "Choose a playable video, banner and valid plan before creating your account.",
      );
      return;
    }
    setClient(next);
    setError("");
    setCreatingAccount(true);
    let created = accountCreated;
    const id = campaignId || newDraftId.current;
    try {
      if (!created) {
        await registerClient({
          email: next.email,
          phone: next.phone,
          fullName: next.name,
          password,
          advertisement: {
            ...progress,
            id,
            brand: next.business,
            targetArea: next.area,
          },
        });
        created = true;
        setAccountCreated(true);
        setCampaignId(id);
      }
      if (!accountSignedIn || !getClientToken()) {
        await loginClient(next.email, password);
        startDemoSession(next.email);
        setAccountSignedIn(true);
      }
      window.history.replaceState(
        null,
        "",
        `register.html?draft=${encodeURIComponent(id)}`,
      );
      await uploadDraftAssets(id);
      setStep("plan");
    } catch (failure) {
      const message =
        failure instanceof Error
          ? failure.message
          : "Could not create or sign in to your account.";
      setError(
        created
          ? `Your account and campaign draft are saved. ${message} Retry here, or sign in later to continue setup.`
          : message,
      );
    } finally {
      setCreatingAccount(false);
    }
  }

  function validateRegistration(): boolean {
    if (!plan) {
      setError("Select a valid campaign plan before registering.");
      setStep("plan");
      return false;
    }
    if (
      (!videoFile && !videoUploaded) ||
      !videoDetails ||
      !videoDuration ||
      videoError
    ) {
      setError(
        "Choose a playable video with a readable duration before registering.",
      );
      setStep("creative");
      return false;
    }
    if (!accountSignedIn || !getClientToken()) {
      setError("Sign in to your client account before continuing.");
      setAccountSignedIn(false);
      if (!inDashboard) setStep("client");
      return false;
    }
    if (
      (!banner && !assetsUploaded) ||
      !startDate ||
      !Number.isFinite(Date.parse(startDate))
    ) {
      setError("Choose a banner and campaign start date before continuing.");
      return false;
    }
    if (!consent) {
      setError("Confirm the upload and payment terms before continuing.");
      return false;
    }
    return true;
  }

  async function uploadDraftAssets(id: string) {
    setUploading(true);
    try {
      const draft = await getRegistrationDraft(id);
      if (!draft.hasVideo) {
        if (!videoFile)
          throw new Error("Select the video to finish its interrupted upload.");
        await uploadAdvertisementVideo(id, videoFile);
      }
      setVideoUploaded(true);
      if (!draft.hasBanner) {
        if (!banner)
          throw new Error(
            "Select the banner to finish its interrupted upload.",
          );
        await uploadAdvertisementImage(id, banner);
      }
      setAssetsUploaded(true);
    } finally {
      setUploading(false);
    }
  }

  async function goToPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      busy ||
      !event.currentTarget.reportValidity() ||
      !validateRegistration() ||
      !campaignId
    )
      return;
    setError("");
    setAdvancing(true);
    window.clearTimeout(saveTimer.current);
    try {
      if (!paymentStarted) await persistDraft({ ...progress, step: "payment" });
      setStep("payment");
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not save your registration.",
      );
    } finally {
      setAdvancing(false);
    }
  }

  async function pay() {
    if (
      !plan ||
      busy ||
      !campaignId ||
      !assetsUploaded ||
      !videoUploaded ||
      !validateRegistration()
    )
      return;
    setError("");
    setPaying(true);
    window.clearTimeout(saveTimer.current);
    try {
      if (!paymentStarted) await persistDraft({ ...progress, step: "payment" });
      setPaymentStarted(true);
      const result = await payForCampaign(
        campaignId,
        plan.cost,
        inDashboard
          ? (open) => {
              // Razorpay mounts outside the native dialog, so it needs the top layer to itself.
              const dialog = dialogRef.current;
              if (open && dialog?.open) dialog.close();
              if (!open && dialog?.isConnected && !dialog.open)
                dialog.showModal();
            }
          : undefined,
      );
      if (result === "completed") {
        setSuccess(true);
      } else {
        setError(
          result === "processing"
            ? "Your payment is processing. Check payment status here later; do not make a separate payment."
            : "Checkout closed. Your draft is saved. Check payment status before retrying.",
        );
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Could not confirm payment. Check status before retrying.",
      );
    } finally {
      setPaying(false);
    }
  }

  const activeIndex = visibleSteps.findIndex((entry) => entry.id === step);

  const wizard = (
    <section
      className={
        inDashboard ? "registration-wizard" : "wrap registration-wizard"
      }
      aria-label={
        inDashboard ? "Campaign setup steps" : "Advertiser registration"
      }
    >
      <div className="registration-progress">
        <div className="registration-progress-heading">
          <span className="eyebrow">
            {inDashboard ? "CAMPAIGN PROGRESS" : "ADVERTISER ONBOARDING"}
          </span>
          <strong>
            Step {activeIndex + 1} of {visibleSteps.length}
          </strong>
        </div>
        <div
          className="registration-road"
          aria-hidden="true"
          style={
            {
              "--road-progress": `${((activeIndex + 0.5) / visibleSteps.length) * 100}%`,
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
        <ol
          className="registration-steps"
          aria-label={inDashboard ? "Campaign stages" : "Registration steps"}
        >
          {visibleSteps.map((entry, index) => (
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
        <div className="dashboard-panel registration-panel">
          <SchedulingStatus state={scheduling} />
          {campaignId && (
            <p
              className="registration-save-status visually-hidden"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {saveStatus}
            </p>
          )}
          {step === "creative" && (
            <form
              className="registration-form"
              onSubmit={async (event) => {
                event.preventDefault();
                if (uploading) return;
                if (
                  adName.trim() &&
                  (banner || assetsUploaded) &&
                  videoDetails &&
                  !videoError
                ) {
                  setError("");
                  if (campaignId) {
                    try {
                      await uploadDraftAssets(campaignId);
                      setStep(
                        inDashboard ? resumeAfterCreative.current : "plan",
                      );
                    } catch (failure) {
                      setError(
                        failure instanceof Error
                          ? failure.message
                          : "Could not upload the missing files.",
                      );
                    }
                  } else {
                    setStep("client");
                  }
                } else {
                  setError(
                    "Enter an ad name, choose a banner and a playable video.",
                  );
                }
              }}
            >
              <div className="registration-step-heading">
                <span className="registration-step-kicker">01 / CREATIVE</span>
                <h2 tabIndex={inDashboard ? -1 : undefined}>
                  {inDashboard
                    ? "Campaign creative"
                    : "Name your ad and add a banner"}
                </h2>
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
                      readOnly={paymentStarted}
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
                        required={!banner && !assetsUploaded}
                        disabled={uploading || assetsUploaded}
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
                      disabled={uploading || videoUploaded}
                      accept="video/mp4,video/quicktime,.mp4,.mov"
                      aria-describedby="registration-video-guidance"
                      onChange={(event) => selectVideo(event.target.files?.[0])}
                    />
                    <p className="fine" id="registration-video-guidance">
                      MP4 or MOV · up to 100 MB. Uploaded immediately after
                      account registration and sign-in.
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
                          if (
                            video.videoWidth > 0 &&
                            video.videoHeight > 0 &&
                            Number.isFinite(video.duration) &&
                            video.duration > 0
                          ) {
                            setVideoDuration(video.duration);
                            setVideoDetails(
                              `${video.videoWidth} × ${video.videoHeight}`,
                            );
                          } else {
                            setVideoDuration(null);
                            setVideoError(
                              "The video or its duration could not be read. Choose another file.",
                            );
                          }
                        }}
                        onError={() => {
                          setVideoDetails("");
                          setVideoDuration(null);
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
                  <p>
                    Concept placement · Preview only until you continue to
                    payment
                  </p>
                </section>
              </div>
              <p className="error registration-error" role="alert">
                {error}
              </p>
              <p className="registration-privacy-note">
                <span aria-hidden="true">i</span>
                Creating your account also saves this campaign as a draft. Video
                and banner upload immediately after sign-in, so you can continue
                later.
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
                    (!banner && !assetsUploaded) ||
                    !videoDetails ||
                    Boolean(videoError) ||
                    uploading
                  }
                >
                  {campaignId
                    ? "Upload missing files and continue"
                    : "Continue to advertiser details"}
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
                <h2>Advertiser details and account</h2>
                <p>
                  Enter your details and create an account. Your email will be
                  your username.
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
                    minLength={2}
                    maxLength={100}
                    readOnly={accountCreated || creatingAccount}
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
                    readOnly={creatingAccount}
                    defaultValue={client.business}
                  />
                </div>
                <div className="field">
                  <label htmlFor="client-email">Email (username) *</label>
                  <input
                    id="client-email"
                    name="client-email"
                    type="email"
                    autoComplete="username"
                    required
                    maxLength={254}
                    readOnly={accountCreated || creatingAccount}
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
                    pattern="[0-9]{10,20}"
                    title="Enter 10 to 20 digits, without spaces or a plus sign."
                    maxLength={20}
                    readOnly={accountCreated || creatingAccount}
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
                    readOnly={creatingAccount}
                    defaultValue={client.area}
                  />
                </div>
                {!accountSignedIn && (
                  <>
                    <div className="field">
                      <label htmlFor="client-password">Password *</label>
                      <input
                        id="client-password"
                        name="client-password"
                        type="password"
                        autoComplete={
                          accountCreated ? "current-password" : "new-password"
                        }
                        required
                        readOnly={creatingAccount}
                        minLength={8}
                        pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&amp;*]).{8,}"
                        aria-describedby="client-password-guidance"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="client-password-confirm">
                        Confirm password *
                      </label>
                      <input
                        id="client-password-confirm"
                        name="client-password-confirm"
                        type="password"
                        autoComplete="new-password"
                        required
                        readOnly={creatingAccount}
                      />
                    </div>
                    <p className="fine full" id="client-password-guidance">
                      At least 8 characters, including uppercase, lowercase, a
                      number, and one of ! @ # $ % ^ &amp; *.
                    </p>
                  </>
                )}
              </div>
              <p className="registration-privacy-note">
                <span aria-hidden="true">i</span>
                {accountCreated
                  ? "Your account has been created."
                  : "Continuing creates your client account immediately."}{" "}
                Your campaign draft is saved with the account, then its video
                and banner upload immediately after sign-in. Contact details are
                not verified.
              </p>
              <p className="error registration-error" role="alert">
                {error}
              </p>
              <p className="fine">
                Already have an account? <a href="login.html">Sign in</a>.
              </p>
              <div className="registration-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep("creative")}
                  disabled={creatingAccount}
                >
                  Back
                </button>
                <button
                  className="button yellow"
                  type="submit"
                  disabled={creatingAccount}
                >
                  {creatingAccount ? "Creating account..." : "Continue"}
                </button>
              </div>
            </form>
          )}
          {step === "plan" && (
            <div className="registration-form">
              <div className="registration-step-heading">
                <span className="registration-step-kicker">
                  {inDashboard ? "02" : "03"} / CAMPAIGN PLAN
                </span>
                <h2 tabIndex={inDashboard ? -1 : undefined}>
                  Choose your campaign plan
                </h2>
                <p>
                  Choose your cab count, daily plays and campaign duration to
                  estimate your budget. Cab count does not affect the price.
                </p>
              </div>
              <fieldset disabled={paymentStarted || paying}>
                <CampaignPlanner
                  selection={selection}
                  onSelectionChange={setSelection}
                  embedded
                />
              </fieldset>
              <p className="registration-disclosure">
                <strong>Before you continue</strong>No payment is collected.
                Final pricing, placements and availability require confirmation.
              </p>
              <div className="registration-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => {
                    resumeAfterCreative.current = "plan";
                    setStep("creative");
                  }}
                  disabled={paymentStarted}
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
                  {inDashboard ? "03" : "04"} / FINAL REVIEW
                </span>
                <h2 tabIndex={inDashboard ? -1 : undefined}>
                  {inDashboard
                    ? "Review your campaign"
                    : "Review your registration"}
                </h2>
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
                    {videoFile
                      ? `${videoFile.name} · ${videoDetails}`
                      : videoDetails}
                  </strong>
                </div>
                <div>
                  <span>Banner</span>
                  <strong>
                    {banner?.name ??
                      (assetsUploaded
                        ? "Banner already uploaded"
                        : "Not uploaded")}
                  </strong>
                </div>
                <div>
                  <span>Advertiser</span>
                  <strong>
                    {client.name
                      ? `${client.name} · ${client.business}`
                      : client.business}
                  </strong>
                </div>
                {!inDashboard && (
                  <div>
                    <span>Contact</span>
                    <strong>
                      {client.email} · {client.phone}
                    </strong>
                  </div>
                )}
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
              <div className="field">
                <label htmlFor="registration-start-date">
                  Requested campaign start date *
                </label>
                <input
                  id="registration-start-date"
                  type="date"
                  value={startDate}
                  disabled={uploading || paymentStarted || paying}
                  required
                  onChange={(event) => setStartDate(event.target.value)}
                />
                <small>
                  The end date is calculated from your selected campaign days.
                  Scheduling requires confirmation.
                </small>
              </div>
              <label className="registration-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={uploading || paymentStarted || paying}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                <span>
                  I agree to the campaign plan and payment terms. My draft and
                  files are already saved. Continuing does not charge me.
                  Scheduling and approval require confirmation.
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
                  disabled={uploading || paymentStarted || paying}
                >
                  Back
                </button>
                <button
                  className="button yellow"
                  type="submit"
                  disabled={uploading}
                >
                  {uploading
                    ? "Uploading campaign files..."
                    : campaignId && !assetsUploaded
                      ? "Retry upload and continue to payment"
                      : "Continue to payment"}
                </button>
              </div>
            </form>
          )}
          {step === "payment" && (
            <div className="registration-form">
              <div className="registration-step-heading">
                <span className="registration-step-kicker">
                  {inDashboard ? "04" : "05"} / PAYMENT
                </span>
                <h2 tabIndex={inDashboard ? -1 : undefined}>
                  Pay for your campaign
                </h2>
                <p>
                  Your campaign, video and banner are saved in Adrover. We check
                  your payment status before checkout opens. Your campaign
                  enters review only after payment is verified.
                </p>
              </div>
              <div className="registration-payment-amount">
                <span>Amount payable</span>
                <strong>{plan ? moneyFormat.format(plan.cost) : "—"}</strong>
                <small>{plan ? campaignDescription(plan) : ""}</small>
              </div>
              <p className="registration-payment-refund">
                If checkout is interrupted, sign in again and check payment
                status here. You can continue the same checkout; do not make a
                separate payment. Refunds require separate processing.
              </p>
              <p className="error registration-error" role="alert">
                {error}
              </p>
              <div className="registration-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => setStep("review")}
                  disabled={paying || paymentStarted}
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
                    ? "Checking payment..."
                    : paymentStarted
                      ? "Check payment status / continue checkout"
                      : `Pay ${plan ? moneyFormat.format(plan.cost) : ""} with Razorpay`}
                </button>
              </div>
            </div>
          )}
        </div>
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
                disabled={uploading || paymentStarted || paying}
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
                disabled={uploading || paymentStarted || paying}
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
                disabled={uploading || paymentStarted || paying}
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
          <p>
            Planning uses a 10-hour operating day. Daily allocation begins on
            the inclusive start date; after completion, available slots may use
            a house ad. Scheduling and delivery remain subject to confirmation.
          </p>
          <p id="summary-pricing-note">
            Estimated plays = plays per day × campaign days; cab count does not
            affect the estimate. Each play is 30 seconds at ₹0.30. Minimums are
            1,000 plays per day and 7 days.
          </p>
          <div className="registration-summary-status">
            <span aria-hidden="true" />
            {campaignId ? "Saved campaign draft" : "Local preview"}
          </div>
          <p>
            {inDashboard
              ? "Your progress is saved to your client account."
              : "Your campaign is saved with your account at registration. Its video and banner upload immediately after sign-in."}
          </p>
        </aside>
      </div>
      {success && !inDashboard && (
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
            <span className="eyebrow">CHECKOUT COMPLETE</span>
            <h2 id="registration-success-title">
              Your campaign and files have been submitted
            </h2>
            <p>
              {adName} and its creative have been saved. Your payment is
              confirmed and your campaign is awaiting review.
            </p>
            <div className="registration-success-plan">
              {plan && campaignDescription(plan)}
            </div>
            <a className="button yellow" href="dashboard.html">
              Go to advertiser dashboard
            </a>
          </section>
        </div>
      )}
    </section>
  );

  const lockedNotice = (
    <section className="dashboard-panel">
      <h3>Campaign edits are locked</h3>
      <SchedulingStatus state={scheduling} />
      <a href={`view-ad.html?id=${encodeURIComponent(campaignId)}`}>
        View campaign
      </a>
    </section>
  );

  if (!inDashboard)
    return loadingDraft ? (
      <p role="status">Loading your saved campaign...</p>
    ) : isCampaignLocked(scheduling) ? (
      lockedNotice
    ) : (
      wizard
    );

  return (
    <dialog
      ref={dialogRef}
      className="campaign-setup-dialog"
      aria-labelledby="campaign-setup-title"
      onCancel={(event) => {
        event.preventDefault();
        void dismiss();
      }}
    >
      <header className="campaign-setup-header">
        <div>
          <span className="eyebrow">CLIENT DASHBOARD</span>
          <h2 id="campaign-setup-title">
            {success ? "Campaign status" : "Continue campaign setup"}
          </h2>
          {adName && <p>{adName}</p>}
        </div>
        <button
          type="button"
          className="button ghost small"
          aria-label="Close campaign setup"
          disabled={busy}
          onClick={() => void dismiss()}
        >
          Close
        </button>
      </header>
      {closeError && (
        <div className="campaign-setup-notice">
          <div className="error" role="alert">
            {closeError} Your changes are still here. Try closing again to save
            them.
          </div>
          <button
            type="button"
            className="button ghost small"
            onClick={() => {
              dialogRef.current?.close();
              onDismiss?.();
            }}
          >
            Discard unsaved changes and close
          </button>
        </div>
      )}
      <div
        className="campaign-setup-body"
        ref={bodyRef}
        inert={closing || advancing}
      >
        {loadingDraft ? (
          <p role="status">Loading your saved campaign...</p>
        ) : !campaignId ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : isCampaignLocked(scheduling) ? (
          lockedNotice
        ) : success ? (
          <section className="dashboard-panel campaign-setup-complete">
            <span className="registration-success-icon" aria-hidden="true">
              ✓
            </span>
            <h3 tabIndex={-1}>Payment verified</h3>
            <p>{adName} is awaiting review. No further payment is needed.</p>
            <button
              type="button"
              className="button yellow"
              onClick={() => void dismiss()}
            >
              Done
            </button>
          </section>
        ) : (
          wizard
        )}
      </div>
    </dialog>
  );
}
