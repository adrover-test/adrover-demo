import { useEffect } from "react";
import { CampaignPlanner } from "../components/CampaignPlanner";
import { VideoPreview } from "../components/VideoPreview";

export function Pricing() {
  useEffect(() => {
    function redirectRegistration() {
      if (window.location.hash === "#registration")
        window.location.replace("register.html");
    }
    redirectRegistration();
    window.addEventListener("hashchange", redirectRegistration);
    return () => window.removeEventListener("hashchange", redirectRegistration);
  }, []);

  return (
    <>
      <section className="campaign-heading wrap">
        <h1>Plan your campaign</h1>
        <p>Preview your video and estimate your budget. No payment required.</p>
      </section>
      <CampaignPlanner />
      <VideoPreview />
      <section
        className="wrap section tight"
        aria-labelledby="pricing-note-title"
      >
        <div className="callout">
          <h3 id="pricing-note-title">Before you book</h3>
          <p>
            Prices are illustrative. Confirm availability, taxes and creative
            requirements before booking. Select your video again on Register;
            preview files are not transferred between pages.
          </p>
          <a className="button" href="register.html">
            Register your ad
          </a>
        </div>
      </section>
    </>
  );
}
