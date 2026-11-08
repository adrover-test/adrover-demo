import { useState, type FormEvent } from "react";
import { LoginJourney } from "../components/LoginJourney";

export function Login() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setError(
      "SMS login is not configured yet. No OTP has been generated or sent. Contact Adrover for assistance.",
    );
  }

  return (
    <section className="wrap login-section">
      <div className="login-card">
        <aside className="login-intro">
          <span className="login-badge">HYDERABAD, FIRST</span>
          <h1>Bring your brand along for the ride.</h1>
          <p>
            Plan a campaign for the everyday journeys happening across
            Hyderabad.
          </p>
          <LoginJourney />
          <span className="login-note">
            Campaign tools are available to explore without an account.
          </span>
        </aside>

        <div className="login-form-panel">
          <div className="login-form-heading">
            <span className="eyebrow">CLIENT LOGIN</span>
            <h2>Welcome back</h2>
            <p>
              Sign in to manage your advertisements, campaign details and
              billing.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="login-phone">Phone number</label>
              <input
                autoComplete="tel"
                id="login-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="+91 9876543210"
                pattern="\+[1-9][0-9]{7,14}"
                maxLength={16}
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setError("");
                }}
                aria-describedby="login-phone-guidance"
                required
              />
              <p className="fine" id="login-phone-guidance">
                Include the country code, with no spaces (for example,
                +919876543210).
              </p>
            </div>

            <div className="field">
              <label htmlFor="login-otp">One-time password (OTP)</label>
              <input
                autoComplete="one-time-code"
                id="login-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="6-digit OTP"
                aria-describedby="login-availability"
                disabled
              />
            </div>

            <div className="login-options">
              <span className="fine">SMS verification not yet available</span>
              <a href="contact.html#launch-notes">Need help signing in?</a>
            </div>

            <button className="button yellow login-submit" type="submit">
              Request OTP
            </button>
            <button
              className="button ghost login-submit"
              type="button"
              disabled
            >
              Verify OTP and sign in
            </button>
            <p aria-live="polite" className="login-status" role="alert">
              {error}
            </p>
          </form>

          <div className="login-create">
            <span>New to Adrover?</span>
            <a href="pricing.html#planner">Plan a campaign</a>
          </div>

          <p className="login-disclaimer" id="login-availability">
            Phone login is awaiting SMS provider configuration. Request OTP
            currently shows an availability notice only. Your number is not
            stored or sent, and sign-in remains disabled until server-side OTP
            verification is connected.
          </p>
          <a className="text-link" href="admin-login.html">
            Website admin sign in
          </a>
        </div>
      </div>
    </section>
  );
}
