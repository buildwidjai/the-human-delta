// Browser-session UUID. Distinct from per-attempt audit ids.
// One session_id can have many report attempts (original + re-attempts
// after LLM failure). Reset only when the user explicitly starts over.

const KEY = "hdelta_session_id";
const REATTEMPT_KEY = "hdelta_reattempt";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuid();
  // Tab-scoped only. Each browser tab/window gets its own session id so
  // parallel test runs in the same browser stay isolated. Do NOT fall
  // back to localStorage — that would cause new tabs to inherit an
  // existing session and collide with in-flight assessments.
  const existing = window.sessionStorage.getItem(KEY);
  if (existing) return existing;
  const fresh = uuid();
  window.sessionStorage.setItem(KEY, fresh);
  return fresh;
}

export function resetSessionId(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
  // Remove any legacy cross-tab value left by older builds.
  window.localStorage.removeItem(KEY);
}

/** Mark the next /report visit as a free re-attempt. */
export function markReattempt(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REATTEMPT_KEY, "1");
}

export function consumeReattempt(): boolean {
  if (typeof window === "undefined") return false;
  const flag = window.sessionStorage.getItem(REATTEMPT_KEY) === "1";
  if (flag) window.sessionStorage.removeItem(REATTEMPT_KEY);
  return flag;
}