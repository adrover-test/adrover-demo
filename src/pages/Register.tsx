import { AdvertiserRegistration } from "../components/AdvertiserRegistration";

export function Register() {
  return (
    <>
      <section className="campaign-heading wrap registration-heading">
        <h1>Register your ad</h1>
        <p>Build your creative, advertiser profile and approval request.</p>
      </section>
      <AdvertiserRegistration
        onBack={() => window.location.assign("pricing.html")}
      />
    </>
  );
}
