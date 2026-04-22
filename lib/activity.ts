import { supabase } from "./supabase";

export interface ActivityEvent {
  id: string;
  message: string;
  timestamp: number;
}

export async function logActivity(message: string): Promise<void> {
  const { error } = await supabase.from("activity").insert({
    id: crypto.randomUUID(),
    message,
  });
  if (error) console.warn("[activity] logActivity:", error.message);
}

export async function loadActivity(): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from("activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) { console.warn("[activity] loadActivity:", error.message); return []; }
  return (data ?? []).map(r => ({
    id: r.id,
    message: r.message,
    timestamp: new Date(r.created_at).getTime(),
  }));
}
