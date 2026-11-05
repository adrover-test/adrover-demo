import { useState, type FormEvent } from "react";
import { saveEnquiryUpdate, type EnquiryUpdate } from "../lib/admin";

export function EnquiryFollowUp({
  id,
  business,
  update,
  onSaved,
}: {
  id: string;
  business: string;
  update?: EnquiryUpdate;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<EnquiryUpdate["status"]>(
    update?.status ?? "Awaiting reply",
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved("");
    try {
      saveEnquiryUpdate(id, status, note);
      setNote("");
      setError("");
      setSaved("Enquiry follow-up saved.");
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The enquiry follow-up could not be saved.",
      );
    }
  }
  return (
    <details className="enquiry-follow-up">
      <summary>
        Notes &amp; follow-up
        {update?.notes.length ? ` (${update.notes.length})` : ""}
      </summary>
      <form aria-label={`Follow up ${business}`} onSubmit={submit}>
        <label htmlFor={`enquiry-status-${id}`}>Reply status</label>
        <select
          id={`enquiry-status-${id}`}
          value={status}
          onChange={(event) => {
            if (
              event.target.value === "Replied" ||
              event.target.value === "Awaiting reply"
            )
              setStatus(event.target.value);
          }}
        >
          <option>Awaiting reply</option>
          <option>Replied</option>
        </select>
        <p className="fine">
          Mark Replied only after contacting the client. This action does not
          send a message.
        </p>
        <label htmlFor={`enquiry-note-${id}`}>Internal note</label>
        <textarea
          id={`enquiry-note-${id}`}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Record the reply, next step or handover for another admin."
        />
        <button className="button ghost small" type="submit">
          Save follow-up
        </button>
        <p className="error" role="alert">
          {error}
        </p>
        <p role="status">{saved}</p>
      </form>
      {update && (
        <p className="fine">
          Last updated by {update.updatedBy} ·{" "}
          {new Date(update.updatedAt).toLocaleString("en-IN")}
        </p>
      )}
      <ol className="enquiry-note-list">
        {update?.notes.map((entry, index) => (
          <li key={`${entry.createdAt}-${index}`}>
            <p>{entry.text}</p>
            <small>
              {entry.author} ·{" "}
              {new Date(entry.createdAt).toLocaleString("en-IN")}
            </small>
          </li>
        ))}
      </ol>
    </details>
  );
}
