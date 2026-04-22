"use client";

import { useState, useEffect } from "react";
import notify from "./Toast";
import LoadingSpinner from "./LoadingSpinner";
import { CrewMember, AvailabilityStatus } from "@/lib/types";
import { loadCrew, saveCrew } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { supabase } from "@/lib/supabase";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const EMOJI_OPTIONS = [
  "👩‍💻", "👨‍💻", "🧑‍💻", "👩‍🎨", "👨‍🎨", "🧑‍🎨",
  "👩‍🔬", "👨‍🔬", "🧑‍🔬", "👩‍💼", "👨‍💼", "🧑‍💼",
  "🚀", "⭐", "💡", "🎯", "🔥", "💎",
];

const AVATAR_COLORS = [
  "bg-indigo-600", "bg-violet-600", "bg-cyan-600",
  "bg-emerald-600", "bg-rose-600", "bg-amber-600",
  "bg-pink-600", "bg-teal-600",
];

const STATUS_CYCLE: AvailabilityStatus[] = ["available", "meeting", "ooo", "focused"];

const STATUS_CONFIG: Record<AvailabilityStatus, { label: string; dot: string }> = {
  available: { label: "Available",     dot: "bg-green-500"  },
  meeting:   { label: "In a Meeting",  dot: "bg-yellow-400" },
  ooo:       { label: "OOO",           dot: "bg-red-500"    },
  focused:   { label: "Focused",       dot: "bg-blue-500"   },
};

const DEFAULT_CREW: CrewMember[] = [
  { id: "1", name: "Alex Rivera", role: "Engineering Lead",  funFact: "Has visited 30+ countries and writes code in 5 languages.",        emoji: "👩‍💻", status: "available" },
  { id: "2", name: "Jordan Kim",  role: "Product Manager",   funFact: "Former competitive chess player — still thinks 10 moves ahead.",   emoji: "👨‍💼", status: "available" },
  { id: "3", name: "Sam Patel",   role: "UX Designer",       funFact: "Builds furniture as a hobby. Precision in pixels and planks.",     emoji: "🎯",  status: "available" },
];

function getInitials(name: string): string {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ModalProps {
  onClose: () => void;
  onAdd: (member: Omit<CrewMember, "id">) => void;
}

function AddMemberModal({ onClose, onAdd }: ModalProps) {
  const [form, setForm] = useState({ name: "", role: "", funFact: "", emoji: "👩‍💻" });
  const dialogRef = useFocusTrap<HTMLDivElement>(onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim() || !form.funFact.trim()) {
      notify.error("Please fill in all fields.");
      return;
    }
    onAdd({ ...form, status: "available" });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-member-title"
        className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#2d3348]">
          <h2 id="add-member-title" className="text-lg font-semibold text-white">Add Teammate</h2>
          <button onClick={onClose} aria-label="Close dialog" className="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
              maxLength={60}
              className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
            <input
              type="text"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Software Engineer"
              maxLength={80}
              className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Fun Fact</label>
            <textarea
              value={form.funFact}
              onChange={e => setForm(f => ({ ...f, funFact: e.target.value }))}
              placeholder="Share something interesting about yourself"
              maxLength={200}
              rows={3}
              className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Emoji Mood</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, emoji: em }))}
                  className={`text-2xl p-1.5 rounded-lg transition-all ${form.emoji === em ? "bg-indigo-600 scale-110" : "bg-[#0f1117] hover:bg-[#2d3348]"}`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#2d3348] rounded-lg text-slate-300 hover:bg-[#2d3348] transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors">
              Add to Crew
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CrewTab() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCrew().then(stored => {
      if (stored.length > 0) {
        setCrew(stored);
      } else {
        setCrew(DEFAULT_CREW);
        saveCrew(DEFAULT_CREW).catch(console.error);
      }
      setIsLoading(false);
    });

    const channel = supabase
      .channel("crew-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "crew" }, () => {
        loadCrew().then(setCrew);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdd = (member: Omit<CrewMember, "id">) => {
    const newMember: CrewMember = { ...member, id: crypto.randomUUID() };
    const updated = [...crew, newMember];
    setCrew(updated);
    saveCrew(updated).catch(console.error);
    setShowModal(false);
    notify.success(`${member.name} added to the crew!`);
    logActivity(`${member.name} joined the crew`);
  };

  const handleRemove = (id: string) => {
    const member = crew.find(m => m.id === id);
    const updated = crew.filter(m => m.id !== id);
    setCrew(updated);
    saveCrew(updated).catch(console.error);
    notify.success(`${member?.name} removed from crew.`);
  };

  const cycleStatus = (id: string) => {
    const updated = crew.map(m => {
      if (m.id !== id) return m;
      const current = m.status ?? "available";
      const nextIndex = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
      return { ...m, status: STATUS_CYCLE[nextIndex] };
    });
    setCrew(updated);
    saveCrew(updated).catch(console.error);
  };

  const availableCount = crew.filter(m => (m.status ?? "available") === "available").length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white">Crew</h2>
          <p className="text-slate-400 text-sm mt-1">
            {crew.length} team member{crew.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Teammate</span>
        </button>
      </div>

      {/* Availability summary */}
      {crew.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <p className="text-sm text-slate-400">
            <span className="text-green-400 font-semibold">{availableCount}</span>
            {" of "}
            <span className="text-slate-300 font-semibold">{crew.length}</span>
            {" available right now"}
          </p>
        </div>
      )}

      {crew.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-lg font-medium text-slate-300">No crew yet</p>
          <p className="text-sm mt-1 mb-5">Add your first teammate to get started.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            + Add Teammate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {crew.map(member => {
            const avatarColor = getAvatarColor(member.name);
            const initials = getInitials(member.name);
            const status = member.status ?? "available";
            const { label: statusLabel, dot: statusDot } = STATUS_CONFIG[status];

            return (
              <div
                key={member.id}
                className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-5 flex flex-col gap-3 group hover:border-indigo-500/50 transition-all duration-200"
              >
                {/* Header: avatar + name + remove */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${avatarColor} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <span className="text-white font-bold text-sm">{initials}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">{member.name}</h3>
                      <p className="text-indigo-400 text-sm">{member.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(member.id)}
                    aria-label={`Remove ${member.name} from crew`}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xl leading-none"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>

                {/* Status indicator — click to cycle */}
                <button
                  onClick={() => cycleStatus(member.id)}
                  aria-label={`${member.name}'s status: ${statusLabel}. Click to change.`}
                  className="flex items-center gap-2 w-fit hover:opacity-80 transition-opacity"
                >
                  <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot}`} />
                  <span className="text-xs text-slate-400" aria-hidden="true">{statusLabel}</span>
                </button>

                {/* Emoji mood */}
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-2xl">{member.emoji}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Mood</span>
                </div>

                {/* Fun fact */}
                <div className="bg-[#0f1117] rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Fun Fact</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{member.funFact}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddMemberModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
