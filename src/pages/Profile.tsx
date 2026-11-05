import { useEffect, useRef, useState, type FormEvent } from "react";
import { PortalSidebar } from "../components/PortalSidebar";
import {
  getDemoEmail,
  getSavedProfile,
  saveProfile,
  type AdvertiserProfile,
} from "../lib/portal";

const profileDetails = [
  ["Account name", "accountName"],
  ["Business name", "businessName"],
  ["Business email", "email"],
  ["Phone number", "phone"],
  ["Primary service area", "area"],
  ["Advertiser type", "advertiserType"],
] as const;

export function Profile() {
  const [profile, setProfile] = useState<AdvertiserProfile>(() => ({
    accountName: "Advertiser",
    businessName: "Your business",
    email: getDemoEmail(),
    phone: "",
    area: "Hyderabad, Telangana",
    advertiserType: "Enterprise advertiser",
  }));
  const [draft, setDraft] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const editButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = getSavedProfile();
      if (saved) {
        setProfile(saved);
        setDraft(saved);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Saved profile could not be loaded in this browser.",
      );
    }
  }, []);

  function finishEditing() {
    setEditing(false);
    requestAnimationFrame(() => editButton.current?.focus());
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updated = {
      accountName: draft.accountName.trim(),
      businessName: draft.businessName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      area: draft.area.trim(),
      advertiserType: draft.advertiserType.trim(),
    };
    if (
      !updated.accountName ||
      !updated.businessName ||
      !updated.area ||
      !updated.advertiserType
    ) {
      setError("Required fields must contain text, not just spaces.");
      return;
    }
    try {
      saveProfile(updated);
      setProfile(updated);
      setDraft(updated);
      setError("");
      setStatus("Profile saved in this browser.");
      finishEditing();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Your profile could not be saved in this browser.",
      );
    }
  }

  const initials = profile.accountName
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
            <span className="eyebrow">ADVERTISER PORTAL</span>
            <h1>Your profile</h1>
            <p>Review and update your business and contact details.</p>
          </div>
          <div className="dashboard-heading-actions">
            <a className="button yellow small" href="dashboard.html">
              Dashboard
            </a>
          </div>
        </header>

        <div className="dashboard-sample-note" role="note">
          <strong>Profile storage</strong>
          <span>
            Changes are saved only in this browser for this sign-in. Updating
            your contact email does not change your sign-in email.
          </span>
        </div>

        <section className="dashboard-panel profile-identity">
          <span aria-hidden="true" className="profile-avatar-large">
            {initials}
          </span>
          <div className="profile-identity-copy">
            <span className="profile-overline">{profile.advertiserType}</span>
            <h2>{profile.accountName}</h2>
            <p>
              {profile.businessName} · {profile.area}
            </p>
          </div>
          <span className="campaign-status profile-demo-status">
            Advertiser account
          </span>
        </section>

        <div className="profile-panels">
          <section
            aria-labelledby="profile-details-heading"
            className="dashboard-panel profile-details"
          >
            <div className="dashboard-panel-heading">
              <div>
                <h2 id="profile-details-heading">Business details</h2>
                <p>Contact and organization information</p>
              </div>
              <button
                className="button ghost small"
                ref={editButton}
                type="button"
                disabled={editing}
                onClick={() => {
                  setDraft(profile);
                  setStatus("");
                  setEditing(true);
                }}
              >
                Edit profile
              </button>
            </div>
            {editing ? (
              <form className="profile-edit-form" onSubmit={handleSave}>
                <div className="fields">
                  {profileDetails.map(([label, field]) => (
                    <div className="field" key={field}>
                      <label htmlFor={`profile-${field}`}>
                        {label}
                        {field !== "phone" ? " *" : ""}
                      </label>
                      <input
                        autoFocus={field === "accountName"}
                        id={`profile-${field}`}
                        name={field}
                        type={
                          field === "email"
                            ? "email"
                            : field === "phone"
                              ? "tel"
                              : "text"
                        }
                        maxLength={
                          field === "phone" ? 30 : field === "email" ? 254 : 150
                        }
                        pattern={
                          field === "phone"
                            ? "[+0-9\\(\\) .\\-]{7,30}"
                            : undefined
                        }
                        title={
                          field === "phone"
                            ? "Use 7–30 characters: digits, spaces, +, parentheses, dots or hyphens."
                            : undefined
                        }
                        required={field !== "phone"}
                        value={draft[field]}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="profile-edit-actions">
                  <button className="button yellow small" type="submit">
                    Save changes
                  </button>
                  <button
                    className="button ghost small"
                    type="button"
                    onClick={() => {
                      setDraft(profile);
                      setStatus("");
                      finishEditing();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className="profile-details-grid">
                {profileDetails.map(([label, field]) => (
                  <div className="profile-detail" key={field}>
                    <dt>{label}</dt>
                    <dd>{profile[field] || "Not provided"}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="error" role="alert">
              {error}
            </p>
            <p className="fine" role="status">
              {status}
            </p>
          </section>

          <section
            aria-labelledby="profile-access-heading"
            className="dashboard-panel profile-access"
          >
            <div className="dashboard-panel-heading">
              <div>
                <h2 id="profile-access-heading">Account access</h2>
                <p>Workspace and storage information</p>
              </div>
              <span aria-hidden="true" className="profile-panel-icon">
                ✓
              </span>
            </div>
            <ul className="profile-access-list">
              <li>
                <span>Portal mode</span>
                <strong>Browser-local</strong>
              </li>
              <li>
                <span>Sign-in verification</span>
                <strong>Not connected</strong>
              </li>
              <li>
                <span>Profile updates</span>
                <strong>Saved in this browser</strong>
              </li>
              <li>
                <span>Campaign metrics</span>
                <strong>Illustrative</strong>
              </li>
            </ul>
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
      </div>
    </section>
  );
}
