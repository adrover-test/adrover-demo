import {
  hasPlaybackStarted,
  isCampaignLocked,
  type SchedulingState,
} from "../lib/scheduling";

export function SchedulingStatus({
  state,
}: {
  state: SchedulingState & { status?: string; plays?: number };
}) {
  const started = hasPlaybackStarted(state);
  if (
    !started &&
    state.isEditable !== false &&
    !state.contentState &&
    state.readyForScheduling === undefined &&
    !state.setupValidationMessage
  )
    return null;
  return (
    <div aria-label="Scheduling details">
      {started && (
        <p>
          <strong>
            {state.status === "Completed" ? "Playback recorded" : "Started"}
          </strong>
          {state.firstPlayedAt &&
          Number.isFinite(Date.parse(state.firstPlayedAt))
            ? ` - First playback recorded: ${new Date(state.firstPlayedAt).toLocaleString("en-IN")}`
            : null}
        </p>
      )}
      {state.firstPlaybackDate && (
        <p>First playback date: {state.firstPlaybackDate}</p>
      )}
      {isCampaignLocked(state) && <p>Campaign edits are locked.</p>}
      {state.contentState && <p>Content status: {state.contentState}</p>}
      {state.readyForScheduling !== undefined && (
        <p>
          {state.readyForScheduling
            ? "Ready for scheduling"
            : "Not ready for scheduling"}
        </p>
      )}
      {state.setupValidationMessage && (
        <p className="error" role="alert">
          {state.setupValidationMessage}
        </p>
      )}
    </div>
  );
}
