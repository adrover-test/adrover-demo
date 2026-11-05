import { useState, type FormEvent } from "react";
import { getAdminRedirect, startAdminSession } from "../lib/admin";

export function AdminLogin() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      startAdminSession(String(data.get("email") ?? ""));
      window.location.assign(getAdminRedirect(window.location.search));
    } catch (sessionError) {
      setError(
        sessionError instanceof Error
          ? sessionError.message
          : "The admin session could not be started.",
      );
    }
  }

  return (
    <section className="wrap login-section">
      <div className="login-card">
        <aside className="login-intro">
          <span className="login-badge">WEBSITE OPERATIONS</span>
          <h1>Your operations. One clear view.</h1>
          <p>
            Review campaigns, connect with clients and keep your fleet
            information organized.
          </p>
          <div className="login-highlights">
            <article>
              <span className="login-highlight-icon">01</span>
              <div>
                <h2>Clients & enquiries</h2>
                <p>Follow every client from enquiry to campaign review.</p>
              </div>
            </article>
            <article>
              <span className="login-highlight-icon">02</span>
              <div>
                <h2>Review with confidence</h2>
                <p>
                  Assign campaign plays and the total amount before approval.
                </p>
              </div>
            </article>
          </div>
        </aside>
        <div className="login-form-panel">
          <div className="login-form-heading">
            <span className="eyebrow">WEBSITE ADMINISTRATION</span>
            <h2>Admin sign in</h2>
            <p>
              Sign in to manage clients, enquiries, fleet records and campaign
              approvals.
            </p>
          </div>
          <form className="login-form" onSubmit={signIn}>
            <div className="field">
              <label htmlFor="admin-email">Admin email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@example.com"
                required
                maxLength={254}
              />
            </div>
            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <div className="login-password-field">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button type="submit" className="button yellow login-submit">
              Sign in to admin portal
            </button>
            <p className="error" role="alert">
              {error}
            </p>
          </form>
          <p className="login-disclaimer">
            Preview environment: any valid email and a non-empty password opens
            this browser-local workspace. Identities are not verified; no secure
            admin access or live payments are connected. Use fictional
            information, not real credentials.
          </p>
          <div className="login-create">
            <span>Looking for your campaigns?</span>
            <a href="login.html">Advertiser sign in</a>
          </div>
        </div>
      </div>
    </section>
  );
}
