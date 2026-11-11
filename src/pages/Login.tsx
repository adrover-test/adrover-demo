import { useState, type FormEvent } from "react";
import { LoginJourney } from "../components/LoginJourney";
import { getDemoRedirect, startDemoSession } from "../lib/portal";

const demoOtp = "123456";

export function Login() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setOtp("");
    setOtpRequested(true);
    setError(`Demo OTP: ${demoOtp}. This code is shown locally; no SMS was sent.`);
  }

  function handleVerify() {
    if (otp !== demoOtp) {
      setError(`Incorrect demo OTP. Enter ${demoOtp} to continue.`);
      return;
    }

    const identity = `phone-91${phone}@demo.adrover.local`;
    startDemoSession(identity);
    window.location.assign(getDemoRedirect(window.location.search));
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
              <div className="login-phone-input">
                <span aria-hidden="true">+91</span>
                <input
                  autoComplete="tel-national"
                  id="login-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                    setOtp("");
                    setOtpRequested(false);
                    setError("");
                  }}
                  aria-describedby="login-phone-guidance"
                  required
                />
              </div>
              <p className="fine" id="login-phone-guidance">
                Country code +91 is fixed. Enter your 10-digit phone number.
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
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value);
                  setError("");
                }}
                disabled={!otpRequested}
              />
            </div>

            <div className="login-options">
              <span className="fine">Demo sign-in; no SMS is sent</span>
              <a href="contact.html#launch-notes">Need help signing in?</a>
            </div>

            <button className="button yellow login-submit" type="submit">
              Generate demo OTP
            </button>
            <button
              className="button ghost login-submit"
              type="button"
              onClick={handleVerify}
              disabled={!otpRequested || otp.length !== 6}
            >
              Verify demo OTP and sign in
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
            Demo only: use OTP 123456 to sign in. The code is fixed in the
            browser, no SMS is sent, and this does not verify your identity.
            Production sign-in requires server-side OTP verification.
          </p>
          <a className="text-link" href="admin-login.html">
            Website admin sign in
          </a>
        </div>
      </div>
    </section>
  );
}
