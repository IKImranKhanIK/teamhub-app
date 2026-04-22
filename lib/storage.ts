import { supabase } from "./supabase";
import { CrewMember, Kudos, PlayerStats, AvailabilityStatus } from "./types";

// ─── Crew ─────────────────────────────────────────────────

export async function loadCrew(): Promise<CrewMember[]> {
  const { data, error } = await supabase
    .from("crew")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) { console.warn("[storage] loadCrew:", error.message); return []; }
  return (data ?? []).map(r => ({
    id: r.id,
    name: r.name,
    role: r.role,
    funFact: r.fun_fact,
    emoji: r.emoji,
    status: r.status as AvailabilityStatus,
  }));
}

export async function saveCrew(crew: CrewMember[]): Promise<void> {
  // Fetch existing IDs so removed members can be deleted
  const { data: existing } = await supabase.from("crew").select("id");
  const existingIds = (existing ?? []).map(r => r.id as string);
  const newIds = new Set(crew.map(m => m.id));

  const toDelete = existingIds.filter(id => !newIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("crew").delete().in("id", toDelete);
  }

  if (crew.length > 0) {
    const rows = crew.map(m => ({
      id: m.id, name: m.name, role: m.role,
      fun_fact: m.funFact, emoji: m.emoji,
      status: m.status ?? "available",
    }));
    const { error } = await supabase.from("crew").upsert(rows, { onConflict: "id" });
    if (error) console.warn("[storage] saveCrew:", error.message);
  }
}

// ─── Stats ────────────────────────────────────────────────

export async function loadStats(): Promise<Record<string, PlayerStats>> {
  const { data, error } = await supabase.from("player_stats").select("*");
  if (error) { console.warn("[storage] loadStats:", error.message); return {}; }
  const result: Record<string, PlayerStats> = {};
  for (const r of data ?? []) {
    result[r.player_name] = { wins: r.wins, losses: r.losses, draws: r.draws };
  }
  return result;
}

export async function saveStats(stats: Record<string, PlayerStats>): Promise<void> {
  const rows = Object.entries(stats).map(([name, s]) => ({
    player_name: name, wins: s.wins, losses: s.losses, draws: s.draws,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("player_stats")
    .upsert(rows, { onConflict: "player_name" });
  if (error) console.warn("[storage] saveStats:", error.message);
}

// ─── Kudos ────────────────────────────────────────────────

export async function loadKudos(): Promise<Kudos[]> {
  const { data, error } = await supabase
    .from("kudos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.warn("[storage] loadKudos:", error.message); return []; }
  return (data ?? []).map(r => ({
    id: r.id,
    fromName: r.from_name,
    toName: r.to_name,
    message: r.message,
    emoji: r.emoji,
    timestamp: new Date(r.created_at).getTime(),
  }));
}

export async function saveKudos(kudos: Kudos[]): Promise<void> {
  const { data: existing } = await supabase.from("kudos").select("id");
  const existingIds = (existing ?? []).map(r => r.id as string);
  const newIds = new Set(kudos.map(k => k.id));

  const toDelete = existingIds.filter(id => !newIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("kudos").delete().in("id", toDelete);
  }

  if (kudos.length > 0) {
    const rows = kudos.map(k => ({
      id: k.id,
      from_name: k.fromName,
      to_name: k.toName,
      message: k.message,
      emoji: k.emoji,
      created_at: new Date(k.timestamp).toISOString(),
    }));
    const { error } = await supabase.from("kudos").upsert(rows, { onConflict: "id" });
    if (error) console.warn("[storage] saveKudos:", error.message);
  }
}
