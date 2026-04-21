export interface ActivityEvent {
  id: string;
  message: string;
  timestamp: number;
}

const KEY = "teamhub_activity";
const MAX = 20;

export function logActivity(message: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored: ActivityEvent[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    const event: ActivityEvent = { id: crypto.randomUUID(), message, timestamp: Date.now() };
    localStorage.setItem(KEY, JSON.stringify([event, ...stored].slice(0, MAX)));
    // Broadcast via custom DOM event so ActivityFeed re-reads localStorage without
    // polling or prop-drilling — any mounted listener updates instantly.
    window.dispatchEvent(new CustomEvent("teamhub-activity"));
  } catch {
    console.warn("[activity] Failed to log activity event.");
  }
}

export function loadActivity(): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    console.warn("[activity] Corrupt activity data — resetting.");
    localStorage.removeItem(KEY);
    return [];
  }
}
