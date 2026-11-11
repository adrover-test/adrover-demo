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
      <div className="pricing-page">
        <section className="campaign-heading wrap">
          <span className="eyebrow">CAB SCREEN ADVERTISING · HYDERABAD</span>
          <h1>Plan your campaign</h1>
          <p>
            Choose 10, 20 or 30 cabs, daily plays and campaign duration.
            Estimate your budget using plays per day × days; cab count does not
            affect the price.
          </p>
        </section>
        <CampaignPlanner />
        <VideoPreview />
      </div>
      <section
        className="wrap section tight"
        aria-labelledby="pricing-note-title"
      >
        <div className="callout">
          <h3 id="pricing-note-title">Before you book</h3>
          <p>
            Assumes ₹0.30 per 30-second play. Taxes and final placement details
            apply at checkout. This website preview does not accept payments or
            confirm bookings. Confirm availability and creative requirements
            before booking. Select your video again on Register; preview files
            are not transferred between pages.
          </p>
          <a className="button" href="register.html">
            Register your ad
          </a>
        </div>
      </section>
    </>
  );
}
