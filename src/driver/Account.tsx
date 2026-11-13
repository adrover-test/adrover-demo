import { useState, type FormEvent } from "react";
import { api, type DriverProfile } from "./api";
import { languages, useI18n } from "./i18n";
import {
  Loader,
  PageHeading,
  Section,
  StatusBadge,
  useApi,
  useDriver,
  validImage,
} from "./ui";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="drv-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function MyVehicle() {
  const { t, formatDate } = useI18n();
  const state = useApi(() => api.getVehicle(), []);
  const vehicle = state.data;
  const good = (value: string) =>
    ["online", "approved", "assigned"].includes(value)
      ? "good"
      : ["offline", "rejected"].includes(value)
        ? "bad"
        : "wait";

  return (
    <>
      <PageHeading title={t("profile:vehicle.title")} />
      <Loader state={state}>
        {vehicle ? (
          <>
            <dl className="drv-card drv-details">
              <Row
                label={t("profile:vehicle.registration")}
                value={vehicle.registrationNumber}
              />
              <Row label={t("profile:vehicle.model")} value={vehicle.model} />
              <Row label={t("profile:vehicle.type")} value={vehicle.type} />
              <Row
                label={t("profile:vehicle.lastSync")}
                value={
                  vehicle.lastSyncAt
                    ? formatDate(vehicle.lastSyncAt, true)
                    : t("dashboard:device.neverSynced")
                }
              />
            </dl>
            <div className="drv-grid">
              {(
                [
                  ["tablet", vehicle.tabletStatus],
                  ["approval", vehicle.approvalStatus],
                  ["assignment", vehicle.assignmentStatus],
                ] as const
              ).map(([key, value]) => (
                <article className="drv-card" key={key}>
                  <span className="drv-stat-label">
                    {t(`profile:vehicle.${key}`)}
                  </span>
                  <StatusBadge tone={good(value)}>
                    {t(`profile:vehicle.${key}.${value}`)}
                  </StatusBadge>
                </article>
              ))}
            </div>
            <p className="drv-note">{t("profile:vehicle.change")}</p>
            <a className="button yellow" href="#/report">
              {t("common:nav.report")}
            </a>
          </>
        ) : (
          !state.loading && (
            <p className="drv-state">{t("profile:vehicle.none")}</p>
          )
        )}
      </Loader>
    </>
  );
}

function EditForm({
  profile,
  onDone,
}: {
  profile: DriverProfile;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { reloadProfile } = useDriver();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = t("profile:errName");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = t("profile:errEmail");
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setMessage("");
    try {
      await api.updateProfile({
        name: name.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
      });
      await reloadProfile();
      onDone();
    } catch {
      setMessage(t("profile:saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="drv-card drv-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="p-name">{t("profile:name")}</label>
        <input
          id="p-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(errors.name)}
          maxLength={100}
        />
        {errors.name && <small role="alert">{errors.name}</small>}
      </div>
      <div className="field">
        <label htmlFor="p-email">{t("profile:email")}</label>
        <input
          id="p-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(errors.email)}
          maxLength={150}
        />
        {errors.email && <small role="alert">{errors.email}</small>}
      </div>
      <div className="field">
        <label htmlFor="p-address">{t("profile:address")}</label>
        <textarea
          id="p-address"
          value={address}
          rows={3}
          maxLength={300}
          onChange={(event) => setAddress(event.target.value)}
        />
      </div>
      {message && (
        <p className="drv-error" role="alert">
          {message}
        </p>
      )}
      <div className="drv-actions">
        <button className="button yellow" type="submit" disabled={saving}>
          {t("common:action.save")}
        </button>
        <button className="button ghost" type="button" onClick={onDone}>
          {t("common:action.cancel")}
        </button>
      </div>
    </form>
  );
}

export function Profile() {
  const { t, lang, formatDate } = useI18n();
  const { profile, changeLanguage, reloadProfile, logout } = useDriver();
  const [editing, setEditing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(
    null,
  );

  async function pickLanguage(code: (typeof languages)[number]["code"]) {
    if (code === lang) return;
    const saved = await changeLanguage(code);
    setNotice(
      saved
        ? { error: false, text: t("common:language.saved") }
        : { error: true, text: t("common:language.saveFailed") },
    );
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (!validImage(file)) {
      setNotice({ error: true, text: t("profile:photo.invalid") });
      return;
    }
    try {
      await api.uploadPhoto(file);
      await reloadProfile();
      setNotice(null);
    } catch {
      setNotice({ error: true, text: t("profile:photo.failed") });
    }
  }

  const none = t("profile:notProvided");
  const initials = profile.name.trim().slice(0, 1).toUpperCase();

  return (
    <>
      <PageHeading title={t("profile:title")} />
      {notice && (
        <p
          className={notice.error ? "drv-error" : "drv-success"}
          role={notice.error ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}

      <div className="drv-card drv-profile-head">
        {profile.photoUrl ? (
          <img className="drv-avatar" src={profile.photoUrl} alt="" />
        ) : (
          <span className="drv-avatar" aria-hidden="true">
            {initials}
          </span>
        )}
        <div>
          <strong>{profile.name}</strong>
          <span className="drv-sub">+91 {profile.mobile}</span>
          <label className="button ghost small drv-file">
            {t("profile:photo.change")}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => {
                void pickPhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <Section
        title={t("profile:title")}
        action={
          !editing && (
            <button
              className="button ghost small"
              type="button"
              onClick={() => setEditing(true)}
            >
              {t("profile:edit")}
            </button>
          )
        }
      >
        {editing ? (
          <EditForm profile={profile} onDone={() => setEditing(false)} />
        ) : (
          <dl className="drv-card drv-details">
            <Row label={t("profile:name")} value={profile.name} />
            <Row label={t("profile:mobile")} value={`+91 ${profile.mobile}`} />
            <Row label={t("profile:email")} value={profile.email ?? none} />
            <Row label={t("profile:address")} value={profile.address ?? none} />
            <Row
              label={t("profile:licenceNumber")}
              value={profile.licenceNumber ?? none}
            />
            <Row
              label={t("profile:licenceExpiry")}
              value={
                profile.licenceExpiry ? formatDate(profile.licenceExpiry) : none
              }
            />
            <Row
              label={t("profile:vehicle.registration")}
              value={profile.vehicle?.registrationNumber ?? none}
            />
            <Row
              label={t("profile:accountStatus")}
              value={t(`profile:status.${profile.accountStatus}`)}
            />
            <Row
              label={t("profile:registered")}
              value={formatDate(profile.registeredAt)}
            />
          </dl>
        )}
      </Section>

      <Section title={t("profile:documents.title")}>
        {profile.documents.length === 0 ? (
          <p className="drv-state">{t("profile:documents.empty")}</p>
        ) : (
          <ul className="drv-list">
            {profile.documents.map((document) => (
              <li className="drv-card drv-row" key={document.id}>
                <div>
                  <strong>{document.name}</strong>
                  {document.url && (
                    <a
                      className="drv-link"
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("profile:documents.view")}
                    </a>
                  )}
                </div>
                <StatusBadge
                  tone={
                    document.status === "verified"
                      ? "good"
                      : document.status === "rejected"
                        ? "bad"
                        : "wait"
                  }
                >
                  {t(`profile:documents.status.${document.status}`)}
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("profile:language.title")}>
        <div className="drv-card">
          <p>{t("profile:language.hint")}</p>
          <div className="drv-lang drv-lang-large" role="group">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                lang={language.code}
                aria-pressed={lang === language.code}
                onClick={() => void pickLanguage(language.code)}
              >
                {language.name}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t("common:nav.help")}>
        <div className="drv-actions">
          <a className="button ghost" href="#/help">
            {t("common:nav.help")}
          </a>
          <a className="button ghost" href="#/report">
            {t("common:nav.report")}
          </a>
          <a className="button ghost" href="#/issues">
            {t("common:nav.issues")}
          </a>
        </div>
      </Section>

      {confirmLogout ? (
        <div
          className="drv-card"
          role="alertdialog"
          aria-label={t("profile:logout.title")}
        >
          <p>{t("common:confirm.logout")}</p>
          <div className="drv-actions">
            <button className="button yellow" type="button" onClick={logout}>
              {t("profile:logout.confirm")}
            </button>
            <button
              className="button ghost"
              type="button"
              onClick={() => setConfirmLogout(false)}
            >
              {t("common:action.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          className="button ghost"
          type="button"
          onClick={() => setConfirmLogout(true)}
        >
          {t("profile:logout.title")}
        </button>
      )}
    </>
  );
}
