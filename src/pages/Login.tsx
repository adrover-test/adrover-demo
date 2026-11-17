import { useState, type FormEvent } from "react";
import { LoginJourney } from "../components/LoginJourney";
import { loginClient } from "../lib/clientAuth";
import { getDemoRedirect, startDemoSession } from "../lib/portal";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setBusy(true);
    setError("");
    try {
      const username = email.trim();
      await loginClient(username, password);
      startDemoSession(username);
      window.location.assign(getDemoRedirect(window.location.search));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not sign in.");
    } finally {
      setBusy(false);
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
              <label htmlFor="login-email">Email address</label>
              <input
                autoComplete="username"
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input
                autoComplete="current-password"
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => { setPassword(event.target.value); setError(""); }}
                required
              />
            </div>

            <div className="login-options">
              <a href="contact.html#launch-notes">Need help signing in?</a>
            </div>

            <button className="button yellow login-submit" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
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
            Use the email address and password for your client account.
          </p>
          <a className="text-link" href="driver-login.html">
            Driver sign in
          </a>
          <a className="text-link" href="admin-login.html">
            Website admin sign in
          </a>
        </div>
      </div>
    </section>
  );
}
