"use client";

import { useState, useEffect } from "react";
import notify from "./Toast";
import LoadingSpinner from "./LoadingSpinner";
import { CrewMember, Kudos } from "@/lib/types";
import { loadCrew, loadKudos, saveKudos } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { supabase } from "@/lib/supabase";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const KUDOS_EMOJIS = ["🌟", "🚀", "💡", "🎯", "🔥", "💎", "👏", "🙌", "⭐", "💪", "🏆", "✨"];

const DEFAULT_KUDOS: Kudos[] = [
  {
    id: "k1",
    fromName: "Jordan Kim",
    toName: "Alex Rivera",
    message: "Crushed the sprint review today. The demo was polished and you handled every question with confidence.",
    emoji: "🚀",
    timestamp: Date.now() - 86400000,
  },
  {
    id: "k2",
    fromName: "Alex Rivera",
    toName: "Sam Patel",
    message: "The new onboarding flow you designed is so much cleaner. Users are going to love it.",
    emoji: "🎯",
    timestamp: Date.now() - 3600000,
  },
];

interface GiveKudosModalProps {
  crew: CrewMember[];
  onClose: () => void;
  onSubmit: (kudos: Omit<Kudos, "id" | "timestamp">) => void;
}

function GiveKudosModal({ crew, onClose, onSubmit }: GiveKudosModalProps) {
  const [form, setForm] = useState({ from: "", to: "", message: "", emoji: "🌟" });
  const dialogRef = useFocusTrap<HTMLDivElement>(onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from || !form.to) {
      notify.error("Please select both sender and recipient.");
      return;
    }
    if (form.from === form.to) {
      notify.error("You can't send kudos to yourself — share the love!");
      return;
    }
    if (!form.message.trim()) {
      notify.error("Please write a message.");
      return;
    }
    onSubmit({ fromName: form.from, toName: form.to, message: form.message.trim(), emoji: form.emoji });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="give-kudos-title"
        className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#2d3348]">
          <h2 id="give-kudos-title" className="text-lg font-semibold text-white">Give Kudos</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">From</label>
              <select
                value={form.from}
                onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Select yourself —</option>
                {crew.map(m => (
                  <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">To</label>
              <select
                value={form.to}
                onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Select teammate —</option>
                {crew.map(m => (
                  <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Message</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Tell them what they did that made a difference..."
              maxLength={300}
              rows={3}
              className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <p className="text-xs text-slate-600 mt-1 text-right">{form.message.length}/300</p>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {KUDOS_EMOJIS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, emoji: em }))}
                  className={`text-xl p-1.5 rounded-lg transition-all ${
                    form.emoji === em ? "bg-indigo-600 scale-110" : "bg-[#0f1117] hover:bg-[#2d3348]"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#2d3348] rounded-lg text-slate-300 hover:bg-[#2d3348] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors shadow-lg shadow-indigo-500/20"
            >
              Send Kudos ✨
            </button>
          </div>
        </form>

        {crew.length === 0 && (
          <p className="text-sm text-amber-400 px-6 pb-5 text-center">
            ⚠️ Add crew members in the Crew tab first.
          </p>
        )}
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KudosTab() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [kudos, setKudos] = useState<Kudos[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadCrew(), loadKudos()]).then(([crewData, stored]) => {
      setCrew(crewData);
      if (stored.length > 0) {
        setKudos(stored);
      } else {
        setKudos(DEFAULT_KUDOS);
        saveKudos(DEFAULT_KUDOS).catch(console.error);
      }
      setIsLoading(false);
    });

    const channel = supabase
      .channel("kudos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "kudos" }, () => {
        loadKudos().then(setKudos);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = (data: Omit<Kudos, "id" | "timestamp">) => {
    const newKudos: Kudos = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    const updated = [newKudos, ...kudos];
    setKudos(updated);
    saveKudos(updated).catch(console.error);
    setShowModal(false);
    notify.success(`Kudos sent to ${data.toName}! ${data.emoji}`);
    logActivity(`${data.fromName} gave kudos to ${data.toName}`);
  };

  const handleDelete = (id: string) => {
    const updated = kudos.filter(k => k.id !== id);
    setKudos(updated);
    saveKudos(updated).catch(console.error);
    notify.success("Kudos removed.");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Kudos Board</h2>
          <p className="text-slate-400 text-sm mt-1">Celebrate your teammates</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <span className="text-lg leading-none">✨</span>
          <span>Give Kudos</span>
        </button>
      </div>

      {/* Kudos Feed */}
      {kudos.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-3">🌟</p>
          <p className="text-lg font-medium text-slate-300">No kudos yet</p>
          <p className="text-sm mt-1 mb-5">Be the first to shout someone out.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            ✨ Give Kudos
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-4">
            {kudos.length} shoutout{kudos.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {kudos.map(k => (
              <div
                key={k.id}
                className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-5 group hover:border-indigo-500/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{k.emoji}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        To:{" "}
                        <span className="text-indigo-400">{k.toName}</span>
                      </p>
                      <p className="text-slate-500 text-xs">from {k.fromName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(k.id)}
                    aria-label={`Remove kudos from ${k.fromName} to ${k.toName}`}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xl leading-none"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed bg-[#0f1117] rounded-xl p-3">
                  &ldquo;{k.message}&rdquo;
                </p>
                <p className="text-slate-600 text-xs mt-2">{formatTime(k.timestamp)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <GiveKudosModal
          crew={crew}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
