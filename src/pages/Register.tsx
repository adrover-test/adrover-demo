import { useEffect } from "react";
import { AdvertiserRegistration } from "../components/AdvertiserRegistration";
import { getDashboardDraftUrl } from "../lib/portal";

export function Register() {
  const draftId = new URLSearchParams(window.location.search).get("draft");
  useEffect(() => {
    if (draftId) window.location.replace(getDashboardDraftUrl(draftId));
  }, [draftId]);

  if (draftId) return <p className="wrap" role="status">Opening your client dashboard...</p>;

  return (
    <>
      <section className="campaign-heading wrap registration-heading">
        <h1>Register your ad</h1>
        <p>Build your creative, advertiser profile and approval request.</p>
      </section>
      <AdvertiserRegistration onBack={() => window.location.assign("pricing.html")} />
    </>
  );
}
