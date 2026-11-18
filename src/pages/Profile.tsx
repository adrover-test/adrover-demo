import { useEffect, useRef, useState, type FormEvent } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  getClientProfile,
  updateClientProfile,
  type ClientProfile,
} from "../lib/clientAccountApi";

export function Profile() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [draftName, setDraftName] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const editButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getClientProfile()
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((failure: unknown) => {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : "We couldn't load your profile. Please try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  function finishEditing() {
    setEditing(false);
    requestAnimationFrame(() => editButton.current?.focus());
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();
    if (name.length < 2) {
      setError("Please enter a name with at least 2 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updateClientProfile(name);
      setProfile(updated);
      setStatus("Your account name has been updated.");
      finishEditing();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "We couldn't save your changes. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const initials = (profile?.name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase();
  return (
    <section className="wrap dashboard-page">
      <PortalSidebar currentPage="profile" activeSection="profile" />
      <div className="dashboard-content profile-content">
        <header className="dashboard-heading">
          <div>
            <span className="eyebrow">CLIENT ACCOUNT</span>
            <h1>Your profile</h1>
            <p>Review your account details and update your name.</p>
          </div>
          <div className="dashboard-heading-actions">
            <a className="button yellow small" href="dashboard.html">
              Dashboard
            </a>
          </div>
        </header>

        {loading ? (
          <p role="status">Loading your profile…</p>
        ) : error && !profile ? (
          <div className="dashboard-panel" role="alert">
            <p>{error}</p>
            <button
              className="button yellow small"
              onClick={() => setRetry((value) => value + 1)}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : profile ? (
          <>
            <div className="dashboard-sample-note" role="note">
              <strong>Account details</strong>
              <span>
                Your account name can be changed here. Contact details are shown
                as listed on your account.
              </span>
            </div>

            <section className="dashboard-panel profile-identity">
              <span aria-hidden="true" className="profile-avatar-large">
                {initials || "A"}
              </span>
              <div className="profile-identity-copy">
                <span className="profile-overline">Client account</span>
                <h2>{profile.name || "Name not provided"}</h2>
                <p>{profile.email || "Email not provided"}</p>
              </div>
            </section>

            <div className="profile-panels">
              <section
                aria-labelledby="profile-details-heading"
                className="dashboard-panel profile-details"
              >
                <div className="dashboard-panel-heading">
                  <div>
                    <h2 id="profile-details-heading">Account details</h2>
                    <p>
                      Your name can be changed here. Contact details are
                      read-only.
                    </p>
                  </div>
                  {!editing && (
                    <button
                      className="button ghost small"
                      ref={editButton}
                      type="button"
                      onClick={() => {
                        setDraftName(profile.name);
                        setError("");
                        setStatus("");
                        setEditing(true);
                      }}
                    >
                      Edit name
                    </button>
                  )}
                </div>
                {editing ? (
                  <form className="profile-edit-form" onSubmit={handleSave}>
                    <div className="fields">
                      <div className="field">
                        <label htmlFor="profile-name">Account name</label>
                        <input
                          autoFocus
                          id="profile-name"
                          name="name"
                          maxLength={100}
                          minLength={2}
                          required
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="profile-edit-actions">
                      <button
                        className="button yellow small"
                        type="submit"
                        disabled={saving}
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        className="button ghost small"
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setDraftName(profile.name);
                          setError("");
                          finishEditing();
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <dl className="profile-details-grid">
                    <div className="profile-detail">
                      <dt>Account name</dt>
                      <dd>{profile.name || "Not provided"}</dd>
                    </div>
                    <div className="profile-detail">
                      <dt>Email address</dt>
                      <dd>{profile.email || "Not provided"}</dd>
                    </div>
                    <div className="profile-detail">
                      <dt>Phone number</dt>
                      <dd>{profile.phone || "Not provided"}</dd>
                    </div>
                  </dl>
                )}
                <p className="error" role="alert">
                  {error}
                </p>
                <p className="fine" role="status">
                  {status}
                </p>
              </section>
            </div>

            <section className="profile-help-card">
              <span aria-hidden="true" className="profile-help-mark">
                ?
              </span>
              <div>
                <h2>Need help with your account?</h2>
                <p>
                  Contact Adrover to discuss campaign requirements or profile
                  information.
                </p>
              </div>
              <a className="button yellow small" href="contact.html">
                Contact us
              </a>
            </section>
          </>
        ) : (
          <div className="dashboard-panel" role="status">
            <p>Your profile details aren't available yet.</p>
            <button
              className="button yellow small"
              onClick={() => setRetry((value) => value + 1)}
              type="button"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
