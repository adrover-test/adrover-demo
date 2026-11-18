import { useEffect, useState } from "react";
import {
  getRegistrationDrafts,
  type RegistrationDraft,
} from "../lib/advertisementApi";
import { getDashboardDraftUrl } from "../lib/portal";
import { AdvertiserRegistration } from "./AdvertiserRegistration";

type DraftStep = "creative" | "plan" | "review" | "payment";

const steps: { id: DraftStep; label: string }[] = [
  { id: "creative", label: "Creative" },
  { id: "plan", label: "Plan" },
  { id: "review", label: "Review" },
  { id: "payment", label: "Payment" },
];

function getNextStep(draft: RegistrationDraft) {
  if (draft.paidAmount > 0) {
    return {
      current: "payment" as DraftStep,
      title: "Payment verified",
      description: "Your campaign is saved and waiting for review.",
      action: "View campaign status",
      complete: true,
    };
  }
  if (draft.paymentStarted) {
    return {
      current: "payment" as DraftStep,
      title: "Check payment status",
      description: "We will check your payment before continuing checkout.",
      action: "Check payment / continue",
      complete: false,
    };
  }
  if (!draft.hasVideo || !draft.hasBanner) {
    const missing = [!draft.hasVideo && "video", !draft.hasBanner && "banner"]
      .filter(Boolean)
      .join(" and ");
    return {
      current: "creative" as DraftStep,
      title: "Finish creative upload",
      description: `Select the ${missing} to continue. Files already uploaded are saved.`,
      action: "Continue setup",
      complete: false,
    };
  }
  if (draft.progress.step === "payment") {
    return {
      current: "payment" as DraftStep,
      title: "Ready for payment",
      description:
        "Your plan and files are saved. Continue with secure checkout.",
      action: "Continue to payment",
      complete: false,
    };
  }
  if (draft.progress.step === "review") {
    return {
      current: "review" as DraftStep,
      title: "Review campaign details",
      description: "Confirm your requested start date and campaign terms.",
      action: "Continue review",
      complete: false,
    };
  }
  return {
    current: "plan" as DraftStep,
    title: "Choose your campaign plan",
    description: "Set the campaign length, daily plays and requested cabs.",
    action: "Continue setup",
    complete: false,
  };
}

export function SavedRegistrations({
  resumeInDashboard = false,
  onChanged,
}: {
  resumeInDashboard?: boolean;
  onChanged?: () => void;
}) {
  const [drafts, setDrafts] = useState<RegistrationDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [activeDraftId, setActiveDraftId] = useState(() =>
    resumeInDashboard
      ? new URLSearchParams(location.search).get("draft")
      : null,
  );

  function closeSetup() {
    setActiveDraftId(null);
    const url = new URL(location.href);
    if (url.searchParams.has("draft")) {
      url.searchParams.delete("draft");
      history.replaceState(history.state, "", url);
    }
    setAttempt((value) => value + 1);
    onChanged?.();
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getRegistrationDrafts()
      .then((items) => {
        if (!cancelled)
          setDrafts(
            items.filter(
              (draft) =>
                draft.status === "Draft" || draft.status === "PendingApproval",
            ),
          );
      })
      .catch((failure) => {
        if (!cancelled)
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not load saved campaigns.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <section
      className="saved-campaigns"
      aria-labelledby="saved-campaigns-title"
    >
      <header className="saved-campaigns-heading">
        <div>
          <span className="saved-campaigns-eyebrow">YOUR WORKSPACE</span>
          <h2 id="saved-campaigns-title">Pick up where you left off</h2>
          <p>
            Your saved campaigns and their next steps are here after you sign
            in.
          </p>
        </div>
        {!loading && !error && drafts.length > 0 && (
          <span className="saved-campaigns-count">
            {drafts.length} saved{" "}
            {drafts.length === 1 ? "campaign" : "campaigns"}
          </span>
        )}
      </header>
      {loading && (
        <p className="saved-campaigns-message" role="status">
          Loading your saved campaigns...
        </p>
      )}
      {error && (
        <div className="saved-campaigns-error" role="alert">
          <p>{error}</p>
          <button
            className="button ghost small"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry loading campaigns
          </button>
        </div>
      )}
      {!loading && !error && drafts.length === 0 && (
        <div className="saved-campaigns-empty">
          <span className="saved-campaigns-empty-icon" aria-hidden="true">
            ↗
          </span>
          <div>
            <h3>Your next campaign starts here</h3>
            <p>
              Create a campaign draft. It will be saved here so you can return
              to it later.
            </p>
          </div>
          <a className="button yellow small" href="register.html">
            Create a campaign
          </a>
        </div>
      )}
      {drafts.length > 0 && (
        <div className="saved-campaign-list">
          {drafts.map((draft) => {
            const next = getNextStep(draft);
            const currentIndex = steps.findIndex(
              (step) => step.id === next.current,
            );
            return (
              <article className="saved-campaign-card" key={draft.id}>
                <div className="saved-campaign-main">
                  <div className="saved-campaign-title-row">
                    <div>
                      <span className="saved-campaign-label">CAMPAIGN</span>
                      <h3>{draft.progress.name}</h3>
                      <p className="saved-campaign-brand">
                        {draft.progress.brand}
                      </p>
                    </div>
                    <span
                      className={`saved-campaign-status ${next.complete ? "is-complete" : draft.paymentStarted ? "is-waiting" : "is-progress"}`}
                    >
                      <span aria-hidden="true" />
                      {next.title}
                    </span>
                  </div>
                  <ol
                    className="saved-campaign-steps"
                    aria-label={`Progress for ${draft.progress.name}`}
                  >
                    {steps.map((step, index) => (
                      <li
                        key={step.id}
                        className={
                          index < currentIndex || next.complete
                            ? "is-complete"
                            : index === currentIndex
                              ? "is-current"
                              : ""
                        }
                      >
                        <span
                          className="saved-campaign-step-dot"
                          aria-hidden="true"
                        >
                          {index < currentIndex || next.complete
                            ? "✓"
                            : index + 1}
                        </span>
                        <span>{step.label}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="saved-campaign-next">
                    <span
                      className="saved-campaign-next-icon"
                      aria-hidden="true"
                    >
                      {next.complete ? "✓" : "→"}
                    </span>
                    <div>
                      <strong>Next step: {next.title}</strong>
                      <p>{next.description}</p>
                    </div>
                  </div>
                </div>
                <aside className="saved-campaign-action">
                  <span>
                    {draft.hasVideo ? "Video saved" : "Video missing"} ·{" "}
                    {draft.hasBanner ? "Banner saved" : "Banner missing"}
                  </span>
                  {resumeInDashboard ? (
                    <button
                      className="button yellow small"
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => setActiveDraftId(draft.id)}
                    >
                      {next.action}
                    </button>
                  ) : (
                    <a
                      className="button yellow small"
                      href={getDashboardDraftUrl(draft.id)}
                    >
                      {next.action}
                    </a>
                  )}
                </aside>
              </article>
            );
          })}
        </div>
      )}
      {activeDraftId && (
        <AdvertiserRegistration
          key={activeDraftId}
          draftId={activeDraftId}
          onBack={closeSetup}
          onDismiss={closeSetup}
        />
      )}
    </section>
  );
}
