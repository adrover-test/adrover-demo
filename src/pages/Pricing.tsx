import { useEffect, useState } from "react";
import { AdvertiserRegistration } from "../components/AdvertiserRegistration";
import { CampaignPlanner } from "../components/CampaignPlanner";
import { VideoPreview } from "../components/VideoPreview";

export function Pricing() {
  const [creative, setCreative] = useState<{
    file: File;
    details: string;
  } | null>(null);
  const [registrationNeedsVideo, setRegistrationNeedsVideo] = useState(
    () => window.location.hash === "#registration",
  );

  useEffect(() => {
    function restorePricing() {
      setCreative(null);
      setRegistrationNeedsVideo(window.location.hash === "#registration");
    }
    window.addEventListener("popstate", restorePricing);
    return () => window.removeEventListener("popstate", restorePricing);
  }, []);

  function beginRegistration(file: File, details: string) {
    setCreative({ file, details });
    setRegistrationNeedsVideo(false);
    window.history.pushState(null, "", "#registration");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function returnToPreview() {
    setCreative(null);
    setRegistrationNeedsVideo(false);
    window.history.replaceState(null, "", window.location.pathname);
  }

  function restartVideoPreview() {
    setRegistrationNeedsVideo(false);
    window.history.replaceState(null, "", window.location.pathname);
    window.setTimeout(
      () =>
        document.getElementById("video-preview")?.scrollIntoView({
          behavior: "smooth",
        }),
      0,
    );
  }

  return (
    <>
      <section
        className={`campaign-heading wrap${creative ? " registration-heading" : ""}`}
      >
        <h1>
          {creative
            ? "Register your ad"
            : registrationNeedsVideo
              ? "Continue your registration"
              : "Plan your campaign"}
        </h1>
        <p>
          {creative
            ? "Build your creative, advertiser profile and approval request."
            : registrationNeedsVideo
              ? "Your local video preview has ended. Select it again to continue."
              : "Preview your video and estimate your budget. No payment required."}
        </p>
      </section>
      {creative ? (
        <AdvertiserRegistration
          videoFile={creative.file}
          videoDetails={creative.details}
          onBack={returnToPreview}
        />
      ) : registrationNeedsVideo ? (
        <section className="wrap registration-reset">
          <div className="dashboard-panel registration-reset-card">
            <span className="registration-step-kicker">
              CREATIVE SESSION ENDED
            </span>
            <h2>Select your video again to continue</h2>
            <p>
              For privacy, video and banner files stay in the current browser
              session. They are cleared when you refresh or leave this page.
            </p>
            <button
              className="button yellow"
              type="button"
              onClick={restartVideoPreview}
            >
              Return to video preview <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      ) : (
        <>
          <CampaignPlanner />
          <VideoPreview onContinue={beginRegistration} />
          <section
            className="wrap section tight"
            aria-labelledby="pricing-note-title"
          >
            <div className="callout">
              <h3 id="pricing-note-title">Before you book</h3>
              <p>
                Prices are illustrative; ad plays are not unique viewers.
                Confirm availability, final pricing, taxes and creative
                requirements with Adrover before booking.
              </p>
              <a className="text-link" href="contact.html">
                Contact us
              </a>
            </div>
          </section>
        </>
      )}
    </>
  );
}
