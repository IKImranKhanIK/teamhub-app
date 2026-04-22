"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { loadActivity, ActivityEvent } from "@/lib/activity";

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} hr ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    loadActivity().then(setEvents);

    // Real-time: re-fetch when a new activity row is inserted by any user
    const channel = supabase
      .channel("activity-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity" }, () => {
        loadActivity().then(setEvents);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex-shrink-0">
        Activity
      </p>
      {events.length === 0 ? (
        <p className="text-xs text-slate-600 text-center py-6">No activity yet.</p>
      ) : (
        <div role="feed" aria-label="Team activity" aria-busy="false" className="space-y-3 overflow-y-auto flex-1 pr-1">
          {events.map(e => (
            <article key={e.id} role="article" aria-label={e.message} className="flex items-start gap-2">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
              <div className="min-w-0">
                <p className="text-xs text-slate-300 leading-snug">{e.message}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{relativeTime(e.timestamp)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
