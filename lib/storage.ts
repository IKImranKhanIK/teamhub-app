import { CrewMember, Kudos, PlayerStats } from "./types";

const KEYS = {
  crew: "teamhub_crew",
  stats: "teamhub_stats",
  kudos: "teamhub_kudos",
};

export function loadCrew(): CrewMember[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.crew) || "[]");
  } catch {
    console.warn("[storage] Corrupt crew data — resetting to default.");
    localStorage.removeItem(KEYS.crew);
    return [];
  }
}

export function saveCrew(crew: CrewMember[]) {
  localStorage.setItem(KEYS.crew, JSON.stringify(crew));
}

export function loadStats(): Record<string, PlayerStats> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEYS.stats) || "{}");
  } catch {
    console.warn("[storage] Corrupt stats data — resetting to default.");
    localStorage.removeItem(KEYS.stats);
    return {};
  }
}

export function saveStats(stats: Record<string, PlayerStats>) {
  localStorage.setItem(KEYS.stats, JSON.stringify(stats));
}

export function loadKudos(): Kudos[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.kudos) || "[]");
  } catch {
    console.warn("[storage] Corrupt kudos data — resetting to default.");
    localStorage.removeItem(KEYS.kudos);
    return [];
  }
}

export function saveKudos(kudos: Kudos[]) {
  localStorage.setItem(KEYS.kudos, JSON.stringify(kudos));
}
