export type SchedulingState = {
  firstPlayedAt?: string | null;
  firstPlaybackDate?: string | null;
  contentId?: string | null;
  contentState?: string | null;
  readyForScheduling?: boolean;
  setupValidationMessage?: string | null;
  isEditable?: boolean;
};

export function readSchedulingState(
  value: Record<string, unknown>,
): SchedulingState {
  return {
    ...(typeof value.firstPlayedAt === "string" || value.firstPlayedAt === null
      ? { firstPlayedAt: value.firstPlayedAt }
      : {}),
    ...(typeof value.firstPlaybackDate === "string" ||
    value.firstPlaybackDate === null
      ? { firstPlaybackDate: value.firstPlaybackDate }
      : {}),
    ...(typeof value.contentId === "string" || value.contentId === null
      ? { contentId: value.contentId }
      : {}),
    ...(typeof value.contentState === "string" || value.contentState === null
      ? { contentState: value.contentState }
      : {}),
    ...(typeof value.readyForScheduling === "boolean"
      ? { readyForScheduling: value.readyForScheduling }
      : {}),
    ...(typeof value.setupValidationMessage === "string" ||
    value.setupValidationMessage === null
      ? { setupValidationMessage: value.setupValidationMessage }
      : {}),
    ...(typeof value.isEditable === "boolean"
      ? { isEditable: value.isEditable }
      : {}),
  };
}

export function hasPlaybackStarted(
  state: SchedulingState & { status?: string; plays?: number },
): boolean {
  return (
    state.status === "Started" ||
    Boolean(state.firstPlayedAt) ||
    Boolean(state.firstPlaybackDate) ||
    (state.plays ?? 0) > 0
  );
}

export function isCampaignLocked(
  state: SchedulingState & { status?: string; plays?: number },
): boolean {
  return state.isEditable === false || hasPlaybackStarted(state);
}
