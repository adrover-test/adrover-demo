import {
  useCallback,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  getDriverIssue,
  getDriverOperations,
  updateDriverOperation,
  type DriverAssignment,
} from "../lib/driverAdminApi";
import type { IssueDetail } from "../driver/api";
import { moneyFormat, numberFormat } from "../lib/campaign";
import { useClientResource } from "../lib/useClientResource";

function ActionForm({
  title,
  action,
  onSaved,
  children,
}: {
  title: string;
  action: (values: FormData) => Promise<void>;
  onSaved: () => void;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action(new FormData(form));
      form.reset();
      setMessage("Saved successfully.");
      onSaved();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The change could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="enquiry-follow-up admin-create-driver">
      <summary>{title}</summary>
      <form aria-label={title} onSubmit={submit}>
        <fieldset disabled={busy}>
          <div className="fields">{children}</div>
          <button className="button yellow small" type="submit">
            {busy ? "Saving..." : title}
          </button>
        </fieldset>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
      </form>
    </details>
  );
}

function Input({
  name,
  label,
  type = "text",
  step,
  min,
  maxLength,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  min?: string;
  maxLength?: number;
}) {
  return (
    <div className="field">
      <label>
        {label} *
        <input
          name={name}
          type={type}
          required
          step={step}
          min={min}
          maxLength={maxLength}
        />
      </label>
    </div>
  );
}

function text(values: FormData, key: string) {
  return String(values.get(key) ?? "").trim();
}

function time(values: FormData, key: string) {
  const date = new Date(text(values, key));
  if (!Number.isFinite(date.getTime()))
    throw new Error("Enter a valid date and time.");
  return date.toISOString();
}

function RecordPlays({
  driverId,
  assignment,
  onSaved,
}: {
  driverId: string;
  assignment: DriverAssignment;
  onSaved: () => void;
}) {
  const requestId = useRef(crypto.randomUUID());
  return (
    <ActionForm
      title={`Record confirmed plays for ${assignment.name}`}
      onSaved={onSaved}
      action={async (values) => {
        await updateDriverOperation(
          driverId,
          `/assignments/${assignment.id}/plays`,
          "POST",
          {
            requestId: requestId.current,
            plays: Number(text(values, "plays")),
            playedAt: time(values, "playedAt"),
          },
        );
        requestId.current = crypto.randomUUID();
      }}
    >
      <p className="fine">
        Record independently verified playback only. This adds earnings and
        campaign delivery, not live device telemetry.
      </p>
      <div
        onChange={() => {
          requestId.current = crypto.randomUUID();
        }}
      >
        <Input
          name="plays"
          label="Confirmed plays"
          type="number"
          min="1"
          step="1"
        />
        <Input
          name="playedAt"
          label="Playback time (local time)"
          type="datetime-local"
        />
      </div>
    </ActionForm>
  );
}

export function DriverOperations({ driverId }: { driverId: string }) {
  const load = useCallback(() => getDriverOperations(driverId), [driverId]);
  const { data, loading, error, refresh } = useClientResource(load);
  const [detail, setDetail] = useState<IssueDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const mutate = (
    path: string,
    method: "POST" | "PUT",
    body: Record<string, unknown>,
  ) => updateDriverOperation(driverId, path, method, body);
  async function viewIssue(id: string) {
    setDetailLoading(true);
    setDetailError("");
    setDetail(null);
    try {
      setDetail(await getDriverIssue(driverId, id));
    } catch (failure) {
      setDetailError(
        failure instanceof Error
          ? failure.message
          : "The ticket could not be loaded.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <section aria-label="Driver operations">
      <div className="dashboard-panel-heading">
        <h2>Driver operations</h2>
        <button className="button ghost small" type="button" onClick={refresh}>
          Refresh
        </button>
      </div>
      {loading && <p role="status">Loading driver operations...</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          <p>
            Earned: <strong>{moneyFormat.format(data.earnings.total)}</strong>{" "}
            &middot; Pending: {moneyFormat.format(data.earnings.pending)}{" "}
            &middot; Released: {moneyFormat.format(data.earnings.released)}
          </p>
          <p className="fine">
            Each assignment schedules a play target on one UTC day. Enter times
            in your local timezone. Rates cannot be changed after assignment.
            Payouts are bookkeeping only; transfer funds separately.
          </p>
          <ActionForm
            title="Assign campaign"
            onSaved={refresh}
            action={(values) =>
              mutate("/assignments", "POST", {
                advertisementId: text(values, "advertisementId"),
                scheduledAt: time(values, "scheduledAt"),
                targetPlays: Number(text(values, "targetPlays")),
                ratePerPlay: Number(text(values, "ratePerPlay")),
              })
            }
          >
            <div className="field">
              <label>
                Campaign *
                <select name="advertisementId" required defaultValue="">
                  <option value="">
                    Choose an approved or active campaign
                  </option>
                  {data.campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Input
              name="scheduledAt"
              label="Scheduled time (local time)"
              type="datetime-local"
            />
            <Input
              name="targetPlays"
              label="Target plays"
              type="number"
              min="1"
              step="1"
            />
            <Input
              name="ratePerPlay"
              label="INR per play"
              type="number"
              min="0.0001"
              step="0.0001"
            />
          </ActionForm>
          <h3>Campaign assignments</h3>
          {data.assignments.length === 0 && <p>No campaigns assigned.</p>}
          {data.assignments.map((assignment) => (
            <div key={assignment.id}>
              <p>
                <strong>{assignment.name}</strong> &middot;{" "}
                {new Date(assignment.scheduledAt).toLocaleString()} &middot;{" "}
                {assignment.status}
                <br />
                {numberFormat.format(assignment.playsCompleted)} /{" "}
                {numberFormat.format(assignment.targetPlays)} plays at INR{" "}
                {assignment.ratePerPlay.toFixed(4)} per play
              </p>
              {assignment.status !== "completed" && (
                <>
                  <ActionForm
                    title={`Update assignment for ${assignment.name}`}
                    onSaved={refresh}
                    action={(values) =>
                      mutate(`/assignments/${assignment.id}`, "PUT", {
                        status: text(values, "status"),
                      })
                    }
                  >
                    <div className="field">
                      <label>
                        Status *
                        <select name="status" defaultValue={assignment.status}>
                          <option value="assigned">Assigned</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Completed</option>
                        </select>
                      </label>
                    </div>
                  </ActionForm>
                  {assignment.status === "assigned" && (
                    <RecordPlays
                      driverId={driverId}
                      assignment={assignment}
                      onSaved={refresh}
                    />
                  )}
                </>
              )}
            </div>
          ))}
          <ActionForm
            title="Schedule payout"
            onSaved={refresh}
            action={(values) =>
              mutate("/payouts", "POST", {
                transactionId: text(values, "transactionId"),
                amount: Number(text(values, "amount")),
                periodStart: time(values, "periodStart"),
                periodEnd: time(values, "periodEnd"),
                scheduledAt: time(values, "payoutAt"),
              })
            }
          >
            <Input
              name="transactionId"
              label="Unique transaction ID"
              maxLength={100}
            />
            <Input
              name="amount"
              label="Amount (INR)"
              type="number"
              min="0.01"
              step="0.01"
            />
            <Input
              name="periodStart"
              label="Earned period start (local time)"
              type="datetime-local"
            />
            <Input
              name="periodEnd"
              label="Earned period end (local time)"
              type="datetime-local"
            />
            <Input
              name="payoutAt"
              label="Payout time (local time)"
              type="datetime-local"
            />
          </ActionForm>
          <h3>Payout ledger</h3>
          {data.payouts.length === 0 && <p>No payouts recorded.</p>}
          {data.payouts.map((payout) => (
            <div key={payout.id}>
              <p>
                <strong>{payout.transactionId}</strong> &middot;{" "}
                {moneyFormat.format(payout.amount)} &middot; {payout.status}
                {payout.reference && <> &middot; {payout.reference}</>}
              </p>
              {payout.status !== "released" && payout.status !== "failed" && (
                <ActionForm
                  title={`Update payout ${payout.transactionId}`}
                  onSaved={refresh}
                  action={(values) =>
                    mutate(`/payouts/${payout.id}`, "PUT", {
                      status: text(values, "status"),
                      reference: text(values, "reference") || null,
                    })
                  }
                >
                  <div className="field">
                    <label>
                      Status *
                      <select name="status" defaultValue="processing">
                        <option value="processing">Processing</option>
                        <option value="released">Released</option>
                        <option value="failed">Failed</option>
                      </select>
                    </label>
                  </div>
                  <div className="field">
                    <label>
                      External payment reference (required for released)
                      <input name="reference" maxLength={200} />
                    </label>
                  </div>
                </ActionForm>
              )}
            </div>
          ))}
          <ActionForm
            title="Send notification"
            onSaved={refresh}
            action={(values) =>
              mutate("/notifications", "POST", {
                title: text(values, "title"),
                message: text(values, "message"),
              })
            }
          >
            <Input name="title" label="Title" maxLength={255} />
            <div className="field">
              <label>
                Message *<textarea name="message" maxLength={2000} required />
              </label>
            </div>
          </ActionForm>
          <h3>Support tickets</h3>
          {data.issues.length === 0 && <p>No support tickets.</p>}
          {data.issues.map(({ summary: issue, confirmed }) => (
            <div key={issue.id}>
              <p>
                <strong>{issue.ticketId}</strong> &middot; {issue.category}{" "}
                &middot; {issue.status}
                {confirmed && " (confirmed)"}
              </p>
              <p>{issue.description}</p>
              <button
                className="button ghost small"
                type="button"
                disabled={detailLoading}
                onClick={() => {
                  void viewIssue(issue.id);
                }}
              >
                View ticket history / attachment
              </button>
              {!confirmed &&
                issue.status !== "resolved" &&
                issue.status !== "rejected" && (
                  <ActionForm
                    title={`Respond to ${issue.ticketId}`}
                    onSaved={() => {
                      setDetail(null);
                      refresh();
                    }}
                    action={(values) =>
                      mutate(`/issues/${issue.id}`, "PUT", {
                        status: text(values, "status"),
                        note: text(values, "note"),
                      })
                    }
                  >
                    <div className="field">
                      <label>
                        Status *
                        <select name="status" defaultValue="under_review">
                          <option value="under_review">Under review</option>
                          <option value="in_progress">In progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </label>
                    </div>
                    <div className="field">
                      <label>
                        Response *
                        <textarea name="note" maxLength={2000} required />
                      </label>
                    </div>
                  </ActionForm>
                )}
            </div>
          ))}
          {detailLoading && <p role="status">Loading ticket...</p>}
          {detailError && (
            <p className="error" role="alert">
              {detailError}
            </p>
          )}
          {detail && (
            <div aria-label="Support ticket details">
              <h3>{detail.ticketId}</h3>
              {detail.attachmentUrl && (
                <a
                  className="text-link"
                  href={detail.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View attachment
                </a>
              )}
              <ul>
                {detail.history.map((entry, index) => (
                  <li key={index}>
                    {new Date(entry.at).toLocaleString()} &middot; {entry.by}{" "}
                    &middot; {entry.status}: {entry.note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
