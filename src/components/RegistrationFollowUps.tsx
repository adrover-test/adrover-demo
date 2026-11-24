import { useCallback, useRef, useState, type FormEvent } from "react";
import {
  getClientFollowUps,
  getUnfinishedRegistrations,
  saveClientFollowUp,
  type FollowUpChannel,
} from "../lib/registrationFollowUpApi";
import { useClientResource } from "../lib/useClientResource";
import { moneyFormat } from "../lib/campaign";
import { PaginatedList } from "./PaginatedList";

function timestamp(value: string) {
  return new Date(value).toLocaleString("en-IN");
}

export function ClientRegistrationFollowUp({
  clientId,
  email,
  phone,
}: {
  clientId: string;
  email: string;
  phone: string;
}) {
  const [open, setOpen] = useState(false);
  const loadHistory = useCallback(
    () => (open ? getClientFollowUps(clientId) : Promise.resolve([])),
    [clientId, open],
  );
  const {
    data: history,
    loading,
    error: historyError,
    refresh,
  } = useClientResource(loadHistory);
  const [channel, setChannel] = useState<FollowUpChannel>("note");
  const [subject, setSubject] = useState(
    "Complete your Adrover campaign registration",
  );
  const [message, setMessage] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const attempt = useRef<{ fingerprint: string; id: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (!message.trim()) {
      setError("Enter a message or internal note.");
      return;
    }
    if (channel !== "note" && !confirmed) {
      setError("Confirm the recipient before sending.");
      return;
    }
    const scheduled = nextDate ? new Date(nextDate) : null;
    if (scheduled && !Number.isFinite(scheduled.getTime())) {
      setError("Choose a valid follow-up date.");
      return;
    }
    const payload = {
      channel,
      subject: channel === "email" ? subject.trim() : "",
      message: message.trim(),
      nextFollowUpAt: scheduled?.toISOString() ?? null,
    };
    const fingerprint = JSON.stringify({ clientId, ...payload });
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, id: crypto.randomUUID() };
    setBusy(true);
    try {
      const saved = await saveClientFollowUp(clientId, {
        ...payload,
        requestId: attempt.current.id,
      });
      refresh();
      if (saved.status === "Saved" || saved.status === "Accepted") {
        setNotice(
          saved.status === "Saved"
            ? "Internal note saved."
            : "Message accepted by the provider. Delivery is not yet confirmed.",
        );
        setMessage("");
        setNextDate("");
        setConfirmed(false);
        attempt.current = null;
      } else if (saved.status === "Failed") {
        setError(saved.error ?? "The provider did not accept the message.");
        attempt.current = null;
      } else {
        setError(
          saved.error ??
            "Message acceptance is unknown or still pending. Check history before sending again.",
        );
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Follow-up failed. Reload history before retrying.",
      );
      refresh();
    } finally {
      setBusy(false);
    }
  }

  const nextFollowUp = history?.find(
    (entry) => entry.nextFollowUpAt,
  )?.nextFollowUpAt;
  return (
    <details
      className="enquiry-follow-up"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Messages &amp; follow-up history</summary>
      {open && (
        <>
          <p className="fine">
            History is shared between administrators and retained per client,
            even after payment.
          </p>
          {nextFollowUp && (
            <p>Next scheduled follow-up: {timestamp(nextFollowUp)}</p>
          )}
          <form onSubmit={submit} aria-label="Client registration follow-up">
            <fieldset disabled={busy} className="fields">
              <div className="field">
                <label htmlFor={`follow-channel-${clientId}`}>
                  Follow-up action
                </label>
                <select
                  id={`follow-channel-${clientId}`}
                  value={channel}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (
                      value === "note" ||
                      value === "email" ||
                      value === "sms"
                    ) {
                      setChannel(value);
                      setConfirmed(false);
                    }
                  }}
                >
                  <option value="note">Save internal note</option>
                  <option value="email">Send email</option>
                  <option value="sms">Send SMS</option>
                </select>
              </div>
              {channel === "email" && (
                <div className="field">
                  <label htmlFor={`follow-subject-${clientId}`}>
                    Email subject
                  </label>
                  <input
                    id={`follow-subject-${clientId}`}
                    value={subject}
                    required
                    maxLength={200}
                    onChange={(event) => setSubject(event.target.value)}
                  />
                </div>
              )}
              <div className="field">
                <label htmlFor={`follow-message-${clientId}`}>
                  {channel === "note" ? "Internal note" : "Message"}
                </label>
                <textarea
                  id={`follow-message-${clientId}`}
                  value={message}
                  required
                  maxLength={channel === "sms" ? 500 : 2000}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`follow-date-${clientId}`}>
                  Next follow-up (optional, local time)
                </label>
                <input
                  id={`follow-date-${clientId}`}
                  type="datetime-local"
                  value={nextDate}
                  onChange={(event) => setNextDate(event.target.value)}
                />
              </div>
              {channel !== "note" && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    required
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  <span>
                    Send this message to the saved{" "}
                    {channel === "email"
                      ? `email: ${email}`
                      : `phone: ${phone}`}
                    . I confirm this client can be contacted about their
                    registration.
                  </span>
                </label>
              )}
              {channel === "sms" && (
                <p className="fine">
                  SMS uses the configured approved MSG91 follow-up template.
                </p>
              )}
              <button className="button yellow small" type="submit">
                {busy
                  ? "Saving..."
                  : channel === "note"
                    ? "Save follow-up"
                    : `Send ${channel === "email" ? "email" : "SMS"}`}
              </button>
            </fieldset>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {notice && <p role="status">{notice}</p>}
          </form>
          <button
            className="button ghost small"
            type="button"
            onClick={refresh}
          >
            Reload history
          </button>
          {loading && <p role="status">Loading follow-up history...</p>}
          {historyError && (
            <p role="alert" className="error">
              {historyError}
            </p>
          )}
          {!loading && !historyError && history?.length === 0 && (
            <p>No follow-ups recorded yet.</p>
          )}
          <ol className="enquiry-note-list">
            {history?.map((entry) => (
              <li key={entry.id}>
                <strong>
                  {entry.channel === "note"
                    ? "Internal note"
                    : entry.channel.toUpperCase()}{" "}
                  - {entry.status}
                </strong>
                {entry.recipient && <p>To: {entry.recipient}</p>}
                {entry.subject && <p>{entry.subject}</p>}
                <p style={{ whiteSpace: "pre-wrap" }}>{entry.message}</p>
                {entry.error && <p className="error">{entry.error}</p>}
                {(entry.status === "Pending" || entry.status === "Unknown") && (
                  <p>
                    Acceptance is unconfirmed. Check with the provider before
                    resending.
                  </p>
                )}
                {entry.status === "Accepted" && (
                  <p className="fine">
                    Accepted by provider; delivery not confirmed.
                  </p>
                )}
                <small>
                  {entry.by} - {timestamp(entry.createdAt)}
                </small>
                {entry.nextFollowUpAt && (
                  <p>Follow up: {timestamp(entry.nextFollowUpAt)}</p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </details>
  );
}

export function UnfinishedRegistrations() {
  const { data, loading, error, refresh } = useClientResource(
    getUnfinishedRegistrations,
  );
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const clients =
    data?.filter((client) =>
      `${client.name} ${client.email} ${client.phone} ${client.drafts.map((draft) => `${draft.name} ${draft.brand}`).join(" ")}`
        .toLowerCase()
        .includes(query),
    ) ?? [];
  return (
    <section
      className="dashboard-panel admin-section"
      aria-label="Unfinished registrations"
    >
      <h2>Unpaid registration drafts</h2>
      <p>
        Clients who created an account and saved an ad registration draft but
        have not completed payment. Completed, rejected and cancelled
        registrations are excluded.
      </p>
      <div className="field admin-search">
        <label htmlFor="unfinished-search">
          Search unfinished registrations
        </label>
        <input
          id="unfinished-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search client, email, phone or campaign"
        />
      </div>
      {loading && <p role="status">Loading unfinished registrations...</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button type="button" className="button ghost small" onClick={refresh}>
        Refresh registrations
      </button>
      {data && (
        <p>
          Showing {clients.length} of {data.length} clients.
        </p>
      )}
      {!loading && !error && clients.length === 0 && (
        <p className="admin-empty">
          {query
            ? "No unfinished registrations match your search."
            : "No unpaid registration drafts found."}
        </p>
      )}
      <PaginatedList
        rows={clients}
        label="Unfinished registrations"
        filterKey={query}
      >
        {(pageClients) =>
          pageClients.map((client) => (
            <article
              key={client.clientId}
              className="dashboard-panel admin-section"
            >
              <h3>{client.name}</h3>
              <p>
                {client.email} - {client.phone || "Phone not provided"}
              </p>
              <PaginatedList
                rows={client.drafts}
                label={`Registration drafts for ${client.name}`}
              >
                {(pageDrafts) => (
                  <div className="dashboard-table-scroll">
                    <table className="dashboard-table admin-table">
                      <thead>
                        <tr>
                          {[
                            "Campaign",
                            "Registration stage",
                            "Saved",
                            "Amount",
                            "Paid",
                            "Outstanding",
                            "Creative",
                          ].map((label) => (
                            <th scope="col" key={label}>
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageDrafts.map((draft) => (
                          <tr key={draft.id}>
                            <th scope="row">
                              {draft.name}
                              <span>
                                {draft.brand} - {draft.targetArea}
                              </span>
                            </th>
                            <td>{draft.step}</td>
                            <td>{timestamp(draft.submittedAt)}</td>
                            <td>
                              {draft.amount === null
                                ? "Not calculated"
                                : moneyFormat.format(draft.amount)}
                            </td>
                            <td>{moneyFormat.format(draft.paidAmount)}</td>
                            <td>
                              {draft.balance === null
                                ? "Not calculated"
                                : moneyFormat.format(draft.balance)}
                            </td>
                            <td>
                              Video: {draft.hasVideo ? "Uploaded" : "Missing"}
                              <br />
                              Banner: {draft.hasBanner ? "Uploaded" : "Missing"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </PaginatedList>
              <ClientRegistrationFollowUp
                clientId={client.clientId}
                email={client.email}
                phone={client.phone}
              />
            </article>
          ))
        }
      </PaginatedList>
    </section>
  );
}
