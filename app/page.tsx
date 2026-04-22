"use client";

import { useState, useEffect, useRef } from "react";
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
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
    if (next === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
    localStorage.setItem("teamhub_theme", next);
  };

  // Arrow-key navigation between tabs (ARIA tablist pattern)
  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const visibleTabs = tabs.filter(t => !t.mobileOnly);
    const visibleIndex = visibleTabs.findIndex(t => t.id === tabs[index].id);
    if (visibleIndex === -1) return;

    let next: number | null = null;
    if (e.key === "ArrowRight") next = (visibleIndex + 1) % visibleTabs.length;
    else if (e.key === "ArrowLeft") next = (visibleIndex - 1 + visibleTabs.length) % visibleTabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = visibleTabs.length - 1;
    else return;

    e.preventDefault();
    const nextTab = visibleTabs[next];
    setActiveTab(nextTab.id);
    // Move focus to the newly selected tab button
    const nextIndex = tabs.findIndex(t => t.id === nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      {/* Skip link — only visible on keyboard focus */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <header className="bg-[#1a1f2e] border-b border-[#2d3348] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span aria-hidden="true" className="text-2xl">🏢</span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">TeamHub</h1>
              <p className="text-xs text-slate-400">Your team, connected</p>
            </div>
          </div>

          <nav aria-label="Main navigation" className="flex gap-1 bg-[#0f1117] rounded-xl p-1 overflow-x-auto scrollbar-hide flex-1 max-w-fit ml-auto">
            <div role="tablist" aria-label="App tabs" className="flex gap-1">
              {tabs.map((tab, i) => (
                <button
                  key={tab.id}
                  ref={el => { tabRefs.current[i] = el; }}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={e => handleTabKeyDown(e, i)}
                  className={[
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0",
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2e]",
                    tab.mobileOnly ? "lg:hidden" : "",
                  ].join(" ")}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sr-only sm:hidden">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2e] transition-colors flex-shrink-0 border border-[#2d3348]"
          >
            <span aria-hidden="true" className="text-base">{theme === "dark" ? "☀" : "🌙"}</span>
          </button>

          <button
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? "Close activity feed" : "Open activity feed"}
            aria-expanded={sidebarOpen}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2e] transition-colors flex-shrink-0 border border-[#2d3348]"
          >
            <span aria-hidden="true">📋</span>
            <span className="text-xs">Activity</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
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
          </div>
        </main>

        <aside
          aria-label="Activity feed"
          aria-hidden={!sidebarOpen}
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
