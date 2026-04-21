"use client";

import { useState, useEffect } from "react";
import CrewTab from "@/components/CrewTab";
import GameTab from "@/components/GameTab";
import KudosTab from "@/components/KudosTab";
import ChatTab from "@/components/ChatTab";
import StatsTab from "@/components/StatsTab";
import VibesTab from "@/components/VibesTab";
import ActivityFeed from "@/components/ActivityFeed";
import ErrorBoundary from "@/components/ErrorBoundary";

type Tab = "crew" | "game" | "kudos" | "chat" | "stats" | "vibes" | "activity";

const tabs: { id: Tab; label: string; icon: string; mobileOnly?: boolean }[] = [
  { id: "crew",     label: "Crew",     icon: "👥" },
  { id: "game",     label: "Game",     icon: "🎮" },
  { id: "kudos",    label: "Kudos",    icon: "🌟" },
  { id: "chat",     label: "Chat",     icon: "💬" },
  { id: "stats",    label: "Stats",    icon: "📊" },
  { id: "vibes",    label: "Vibes",    icon: "✨" },
  { id: "activity", label: "Activity", icon: "📋", mobileOnly: true },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("crew");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Sync theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("teamhub_theme") as "dark" | "light" | null;
    if (saved === "light") {
      setTheme("light");
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("teamhub_theme", next);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      {/* Header */}
      <header className="bg-[#1a1f2e] border-b border-[#2d3348] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-2xl">🏢</span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">TeamHub</h1>
              <p className="text-xs text-slate-400">Your team, connected</p>
            </div>
          </div>

          {/* Nav — horizontal scroll on mobile */}
          <nav className="flex gap-1 bg-[#0f1117] rounded-xl p-1 overflow-x-auto scrollbar-hide flex-1 max-w-fit ml-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2e]",
                  tab.mobileOnly ? "lg:hidden" : "",
                ].join(" ")}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2e] transition-colors flex-shrink-0 border border-[#2d3348]"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="text-base">{theme === "dark" ? "☀" : "🌙"}</span>
          </button>

          {/* Activity sidebar toggle — desktop only */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2e] transition-colors flex-shrink-0 border border-[#2d3348]"
            title="Toggle activity feed"
          >
            <span>📋</span>
            <span className="text-xs">Activity</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Main content */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          {activeTab === "crew"     && <ErrorBoundary name="Crew"><CrewTab /></ErrorBoundary>}
          {activeTab === "game"     && <ErrorBoundary name="Game"><GameTab /></ErrorBoundary>}
          {activeTab === "kudos"    && <ErrorBoundary name="Kudos"><KudosTab /></ErrorBoundary>}
          {activeTab === "chat"     && <ErrorBoundary name="Chat"><ChatTab /></ErrorBoundary>}
          {activeTab === "stats"    && <ErrorBoundary name="Stats"><StatsTab /></ErrorBoundary>}
          {activeTab === "vibes"    && <ErrorBoundary name="Vibes"><VibesTab /></ErrorBoundary>}
          {activeTab === "activity" && (
            <ErrorBoundary name="Activity">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Activity</h2>
                <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-5">
                  <ActivityFeed />
                </div>
              </div>
            </ErrorBoundary>
          )}
        </main>

        {/* Activity sidebar — desktop only, collapsible */}
        <aside
          className={[
            "hidden lg:flex flex-col flex-shrink-0 border-l border-[#2d3348] bg-[#1a1f2e] overflow-hidden transition-all duration-300",
            sidebarOpen ? "w-64 p-4" : "w-0 p-0",
          ].join(" ")}
        >
          {sidebarOpen && <ActivityFeed />}
        </aside>
      </div>

      <footer className="text-center text-xs text-slate-600 py-4 border-t border-[#2d3348]">
        TeamHub — Built with Next.js 14, Tailwind CSS &amp; TypeScript
      </footer>
    </div>
  );
}
