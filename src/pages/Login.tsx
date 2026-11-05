import { useState, type FormEvent } from "react";
import { getDemoRedirect, startDemoSession } from "../lib/portal";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    try {
      startDemoSession(email);
      window.location.assign(getDemoRedirect(window.location.search));
    } catch (sessionError) {
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "The session could not be started in this browser.",
      );
    }
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
          <div className="login-highlights">
            <article>
              <span className="login-highlight-icon" aria-hidden="true">
                01
              </span>
              <div>
                <h2>Plan with clarity</h2>
                <p>Explore an illustrative campaign estimate.</p>
              </div>
            </article>
            <article>
              <span className="login-highlight-icon" aria-hidden="true">
                02
              </span>
              <div>
                <h2>Preview your creative</h2>
                <p>Try a video in your browser before you enquire.</p>
              </div>
            </article>
          </div>
          <span className="login-note">
            Campaign tools are available to explore without an account.
          </span>
        </aside>

        <div className="login-form-panel">
          <div className="login-form-heading">
            <span className="eyebrow">ADVERTISER PORTAL</span>
            <h2>Welcome back</h2>
            <p>
              Sign in to manage your advertisements, campaign details and
              billing.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="login-email">Business email</label>
              <input
                autoComplete="username"
                id="login-email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="login-password">Password</label>
              <div className="login-password-field">
                <input
                  autoComplete="current-password"
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="login-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  type="button"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-options">
              <span className="fine">Session lasts for this browser tab</span>
              <a href="contact.html#launch-notes">Need help signing in?</a>
            </div>

            <button className="button yellow login-submit" type="submit">
              Enter advertiser portal
            </button>
            <p aria-live="polite" className="login-status" role="alert">
              {error}
            </p>
          </form>

          <div className="login-create">
            <span>New to Adrover?</span>
            <a href="pricing.html#planner">Plan a campaign</a>
          </div>

          <p className="login-disclaimer">
            Preview environment: any valid email and a non-empty password opens
            this browser-local workspace. Identities are not verified; payments
            and delivery are simulated. Your password is not stored or sent. Use
            fictional information, not real credentials.
          </p>
          <a className="text-link" href="admin-login.html">
            Website admin sign in
          </a>
        </div>
      </div>
    </section>
  );
}
