import { useRef, useState, type FormEvent } from "react";
import { api, ApiError, type IssueCategory, type IssueStatus } from "./api";
import { useI18n } from "./i18n";
import {
  isValidMobile,
  Loader,
  PageHeading,
  Section,
  StatusBadge,
  useApi,
  useDriver,
  validImage,
} from "./ui";

const categories: IssueCategory[] = [
  "ad_not_playing",
  "tablet_not_working",
  "internet",
  "wrong_schedule",
  "payment_not_received",
  "earnings_mismatch",
  "vehicle",
  "login_otp",
  "other",
];

const statusTone: Record<IssueStatus, string> = {
  submitted: "wait",
  under_review: "info",
  in_progress: "info",
  resolved: "good",
  rejected: "bad",
};

export function ReportIssue({ adId }: { adId: string }) {
  const { t, lang, formatDate } = useI18n();
  const { profile } = useDriver();
  const ads = useApi(() => api.getTodayAds(), []);
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [description, setDescription] = useState("");
  const [advertisementId, setAdvertisementId] = useState(adId);
  const [contact, setContact] = useState(profile.mobile);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<{ id: string; ticketId: string } | null>(
    null,
  );
  const [openedAt] = useState(() => new Date().toISOString());
  const requestId = useRef(crypto.randomUUID());

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const next: Record<string, string> = {};
    if (!category) next.category = t("support:report.errCategory");
    if (description.trim().length < 10)
      next.description = t("support:report.errDescription");
    if (!isValidMobile(contact)) next.contact = t("support:report.errContact");
    if (attachment && !validImage(attachment))
      next.attachment = t("support:report.errAttachment");
    setErrors(next);
    setError("");
    if (Object.keys(next).length || !category) return;

    setSubmitting(true);
    try {
      const result = await api.submitIssue(
        {
          category,
          description: description.trim(),
          advertisementId,
          vehicleId: profile.vehicle?.id ?? "",
          occurredAt: openedAt,
          contactMobile: contact,
          language: lang,
          attachment,
        },
        requestId.current,
      );
      setTicket(result);
    } catch (failure) {
      setError(
        failure instanceof ApiError && failure.status === 409
          ? t("support:report.duplicate")
          : t("support:report.failed"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (ticket)
    return (
      <>
        <PageHeading title={t("support:report.title")} />
        <div className="drv-card" role="status">
          <p className="drv-success">
            {t("support:report.success", { ticket: ticket.ticketId })}
          </p>
          <div className="drv-actions">
            <a
              className="button yellow"
              href={`#/issues/${encodeURIComponent(ticket.id)}`}
            >
              {t("support:report.viewTicket")}
            </a>
            <button
              className="button ghost"
              type="button"
              onClick={() => {
                requestId.current = crypto.randomUUID();
                setTicket(null);
                setCategory("");
                setDescription("");
                setAttachment(null);
              }}
            >
              {t("support:report.another")}
            </button>
          </div>
        </div>
      </>
    );

  return (
    <>
      <PageHeading
        title={t("support:report.title")}
        subtitle={t("support:report.intro")}
      />
      <form className="drv-card drv-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="r-category">{t("support:report.category")}</label>
          <select
            id="r-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as IssueCategory | "")
            }
            aria-invalid={Boolean(errors.category)}
          >
            <option value="">{t("support:report.categoryPlaceholder")}</option>
            {categories.map((key) => (
              <option key={key} value={key}>
                {t(`support:category.${key}`)}
              </option>
            ))}
          </select>
          {errors.category && <small role="alert">{errors.category}</small>}
        </div>

        <div className="field">
          <label htmlFor="r-description">
            {t("support:report.description")}
          </label>
          <textarea
            id="r-description"
            rows={5}
            maxLength={2000}
            value={description}
            placeholder={t("support:report.descriptionPlaceholder")}
            onChange={(event) => setDescription(event.target.value)}
            aria-invalid={Boolean(errors.description)}
          />
          <small>{t("support:report.descriptionHelp")}</small>
          {errors.description && (
            <small role="alert">{errors.description}</small>
          )}
        </div>

        {(ads.data?.items.length ?? 0) > 0 && (
          <div className="field">
            <label htmlFor="r-ad">{t("support:report.ad")}</label>
            <select
              id="r-ad"
              value={advertisementId}
              onChange={(event) => setAdvertisementId(event.target.value)}
            >
              <option value="">{t("support:report.adNone")}</option>
              {ads.data?.items.map((ad) => (
                <option key={ad.id} value={ad.id}>
                  {ad.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="r-vehicle">{t("support:report.vehicle")}</label>
          <input
            id="r-vehicle"
            readOnly
            value={
              profile.vehicle?.registrationNumber ??
              t("support:report.vehicleNone")
            }
          />
        </div>

        <div className="field">
          <label htmlFor="r-time">{t("support:report.dateTime")}</label>
          <input id="r-time" readOnly value={formatDate(openedAt, true)} />
        </div>

        <div className="field">
          <label htmlFor="r-contact">{t("support:report.contact")}</label>
          <input
            id="r-contact"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={contact}
            onChange={(event) =>
              setContact(event.target.value.replace(/\D/g, "").slice(0, 10))
            }
            aria-invalid={Boolean(errors.contact)}
          />
          {errors.contact && <small role="alert">{errors.contact}</small>}
        </div>

        <div className="field">
          <label htmlFor="r-file">{t("support:report.attachment")}</label>
          <input
            id="r-file"
            type="file"
            accept="image/jpeg,image/png"
            onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
          />
          <small>{t("support:report.attachmentHelp")}</small>
          {errors.attachment && <small role="alert">{errors.attachment}</small>}
        </div>

        {error && (
          <p className="drv-error" role="alert">
            {error}
          </p>
        )}
        <button className="button yellow" type="submit" disabled={submitting}>
          {submitting
            ? t("support:report.submitting")
            : t("support:report.submit")}
        </button>
      </form>
    </>
  );
}

export function MyIssues() {
  const { t, formatDate } = useI18n();
  const state = useApi(() => api.getIssues(), []);
  const items = state.data?.items ?? [];

  return (
    <>
      <PageHeading title={t("support:issues.title")} />
      <div className="drv-actions">
        <a className="button yellow" href="#/report">
          {t("common:nav.report")}
        </a>
      </div>
      <Loader state={state}>
        {items.length === 0 ? (
          <p className="drv-state">{t("support:issues.empty")}</p>
        ) : (
          <ul className="drv-list">
            {items.map((issue) => (
              <li key={issue.id}>
                <a
                  className="drv-card drv-card-link"
                  href={`#/issues/${encodeURIComponent(issue.id)}`}
                >
                  <div className="drv-row">
                    <strong>
                      {t("support:issues.ticket", { ticket: issue.ticketId })}
                    </strong>
                    <StatusBadge tone={statusTone[issue.status]}>
                      {t(`support:status.${issue.status}`)}
                    </StatusBadge>
                  </div>
                  <span>{t(`support:category.${issue.category}`)}</span>
                  <p className="drv-clamp">{issue.description}</p>
                  <span className="drv-sub">
                    {t("support:issues.submitted")}:{" "}
                    {formatDate(issue.createdAt)} ·{" "}
                    {t("support:issues.updated")}: {formatDate(issue.updatedAt)}
                  </span>
                  {issue.adminResponse && (
                    <span className="drv-reply">
                      {t("support:issues.adminResponse")}: {issue.adminResponse}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Loader>
    </>
  );
}

export function IssueDetailPage({ id }: { id: string }) {
  const { t, formatDate } = useI18n();
  const state = useApi(() => api.getIssue(id), [id]);
  const issue = state.data;
  const [reopening, setReopening] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(run: () => Promise<void>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await run();
      setMessage({ error: false, text: success });
      setReopening(false);
      state.reload();
    } catch {
      setMessage({ error: true, text: t("support:issues.actionFailed") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <a className="drv-link" href="#/issues">
        ← {t("support:issues.title")}
      </a>
      <Loader state={state}>
        {issue && (
          <>
            <PageHeading
              title={t("support:issues.ticket", { ticket: issue.ticketId })}
            />
            <dl className="drv-card drv-details">
              <div className="drv-detail-row">
                <dt>{t("support:issues.category")}</dt>
                <dd>{t(`support:category.${issue.category}`)}</dd>
              </div>
              <div className="drv-detail-row">
                <dt>{t("payments:status")}</dt>
                <dd>
                  <StatusBadge tone={statusTone[issue.status]}>
                    {t(`support:status.${issue.status}`)}
                  </StatusBadge>
                </dd>
              </div>
              <div className="drv-detail-row">
                <dt>{t("support:issues.submitted")}</dt>
                <dd>{formatDate(issue.createdAt, true)}</dd>
              </div>
              <div className="drv-detail-row">
                <dt>{t("support:issues.updated")}</dt>
                <dd>{formatDate(issue.updatedAt, true)}</dd>
              </div>
              <div className="drv-detail-row">
                <dt>{t("support:issues.language")}</dt>
                <dd>{issue.language.toUpperCase()}</dd>
              </div>
              {issue.advertisementName && (
                <div className="drv-detail-row">
                  <dt>{t("support:issues.ad")}</dt>
                  <dd>{issue.advertisementName}</dd>
                </div>
              )}
              {issue.vehicleRegistration && (
                <div className="drv-detail-row">
                  <dt>{t("support:issues.vehicle")}</dt>
                  <dd>{issue.vehicleRegistration}</dd>
                </div>
              )}
              {issue.attachmentUrl && (
                <div className="drv-detail-row">
                  <dt>{t("support:issues.attachment")}</dt>
                  <dd>
                    <a
                      className="drv-link"
                      href={issue.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("profile:documents.view")}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <Section title={t("support:issues.description")}>
              <p className="drv-card drv-prewrap">{issue.description}</p>
            </Section>
            <Section title={t("support:issues.adminResponse")}>
              <p className="drv-card drv-prewrap">
                {issue.adminResponse ?? t("support:issues.noResponse")}
              </p>
            </Section>
            <Section title={t("support:issues.history")}>
              <ol className="drv-history">
                {issue.history.map((entry, index) => (
                  <li key={`${entry.at}-${index}`}>
                    <StatusBadge tone={statusTone[entry.status]}>
                      {t(`support:status.${entry.status}`)}
                    </StatusBadge>
                    <span className="drv-sub">
                      {formatDate(entry.at, true)} ·{" "}
                      {entry.by === "driver"
                        ? t("support:issues.byDriver")
                        : t("support:issues.byAdmin")}
                    </span>
                    {entry.note && <p className="drv-prewrap">{entry.note}</p>}
                  </li>
                ))}
              </ol>
            </Section>

            {message && (
              <p
                className={message.error ? "drv-error" : "drv-success"}
                role={message.error ? "alert" : "status"}
              >
                {message.text}
              </p>
            )}
            {(issue.canConfirm || issue.canReopen) && !reopening && (
              <div className="drv-actions">
                {issue.canConfirm && (
                  <button
                    className="button yellow"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void act(
                        () => api.confirmIssue(issue.id),
                        t("support:issues.confirmed"),
                      )
                    }
                  >
                    {t("support:issues.confirm")}
                  </button>
                )}
                {issue.canReopen && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => setReopening(true)}
                  >
                    {t("support:issues.reopen")}
                  </button>
                )}
              </div>
            )}
            {reopening && (
              <form
                className="drv-card drv-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!reason.trim()) {
                    setMessage({
                      error: true,
                      text: t("support:issues.reopenErr"),
                    });
                    return;
                  }
                  void act(
                    () => api.reopenIssue(issue.id, reason.trim()),
                    t("support:issues.reopened"),
                  );
                }}
              >
                <div className="field">
                  <label htmlFor="reopen-reason">
                    {t("support:issues.reopenReason")}
                  </label>
                  <textarea
                    id="reopen-reason"
                    rows={3}
                    maxLength={1000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>
                <div className="drv-actions">
                  <button
                    className="button yellow"
                    type="submit"
                    disabled={busy}
                  >
                    {t("support:issues.reopenSubmit")}
                  </button>
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() => setReopening(false)}
                  >
                    {t("common:action.cancel")}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </Loader>
    </>
  );
}

export function Notifications() {
  const { t, formatDate } = useI18n();
  const { refreshUnread } = useDriver();
  const state = useApi(() => api.getNotifications(), []);
  const [error, setError] = useState("");

  async function markRead(id: string) {
    setError("");
    try {
      await api.markNotificationRead(id);
      state.reload();
      refreshUnread();
    } catch {
      setError(t("common:notif.readFailed"));
    }
  }

  const items = state.data?.items ?? [];
  return (
    <>
      <PageHeading
        title={t("common:notif.title")}
        subtitle={
          state.data
            ? t("common:notif.unread", { count: state.data.unreadCount })
            : undefined
        }
      />
      {error && (
        <p className="drv-error" role="alert">
          {error}
        </p>
      )}
      <Loader state={state}>
        {items.length === 0 ? (
          <p className="drv-state">{t("common:notif.empty")}</p>
        ) : (
          <ul className="drv-list">
            {items.map((item) => (
              <li
                className={`drv-card drv-notification${item.isRead ? "" : " drv-unread"}`}
                key={item.id}
              >
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <span className="drv-sub">
                  {formatDate(item.createdAt, true)}
                </span>
                {!item.isRead && (
                  <button
                    className="button ghost small"
                    type="button"
                    onClick={() => void markRead(item.id)}
                  >
                    {t("common:notif.markRead")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Loader>
    </>
  );
}

export function Help() {
  const { t } = useI18n();
  return (
    <>
      <PageHeading title={t("support:help.title")} />
      <div className="drv-actions">
        <a className="button yellow" href="#/report">
          {t("common:nav.report")}
        </a>
        <a className="button ghost" href="#/issues">
          {t("common:nav.issues")}
        </a>
      </div>
      <Section title={t("support:help.faqTitle")}>
        <div className="drv-list">
          {[1, 2, 3, 4, 5].map((n) => (
            <details className="drv-card drv-faq" key={n}>
              <summary>{t(`support:help.q${n}`)}</summary>
              <p>{t(`support:help.a${n}`)}</p>
            </details>
          ))}
        </div>
      </Section>
      <Section title={t("support:help.contactTitle")}>
        <div className="drv-card">
          <p>{t("support:help.contactHint")}</p>
          <div className="drv-actions">
            <a className="button ghost" href="tel:+914048592100">
              {t("support:help.call")}
            </a>
            <a className="button ghost" href="mailto:admin@adrover.in">
              {t("support:help.email")}
            </a>
            <a className="button ghost" href="contact.html#launch-notes">
              {t("support:help.legal")}
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
