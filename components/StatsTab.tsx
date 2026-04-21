"use client";

import { useState, useEffect } from "react";
import { loadCrew, loadStats, loadKudos } from "@/lib/storage";
import { CrewMember, Kudos, PlayerStats } from "@/lib/types";

function calcWinRate(s: PlayerStats): number {
  const games = s.wins + s.losses + s.draws;
  if (games === 0) return 0;
  return Math.round((s.wins / games) * 100);
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
}

export default function StatsTab() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [stats, setStats] = useState<Record<string, PlayerStats>>({});
  const [kudos, setKudos] = useState<Kudos[]>([]);

  useEffect(() => {
    setCrew(loadCrew());
    setStats(loadStats());
    setKudos(loadKudos());
  }, []);

  // Total games: each win = 1 game; draws counted twice in storage so divide by 2
  const sumWins  = Object.values(stats).reduce((n, s) => n + s.wins,  0);
  const sumDraws = Object.values(stats).reduce((n, s) => n + s.draws, 0);
  const totalGames = sumWins + sumDraws / 2;

  // Top player by wins
  const topPlayer = Object.entries(stats).sort(([, a], [, b]) => b.wins - a.wins)[0];

  // Most kudos received
  const kudosReceivedMap: Record<string, number> = {};
  kudos.forEach(k => { kudosReceivedMap[k.toName] = (kudosReceivedMap[k.toName] ?? 0) + 1; });
  const topReceiver = Object.entries(kudosReceivedMap).sort(([, a], [, b]) => b - a)[0];

  // Leaderboard
  const leaderboard = Object.entries(stats)
    .map(([name, s]) => ({ name, ...s, rate: calcWinRate(s) }))
    .sort((a, b) => b.wins - a.wins || b.rate - a.rate);

  const avgWinRate = leaderboard.length > 0
    ? Math.round(leaderboard.reduce((n, p) => n + p.rate, 0) / leaderboard.length)
    : null;

  const sortedKudos = [...kudos].sort((a, b) => b.timestamp - a.timestamp);

  const cards = [
    { label: "Crew Members",  value: crew.length,                                    icon: "👥" },
    { label: "Games Played",  value: Math.round(totalGames),                         icon: "🎮" },
    { label: "Kudos Given",   value: kudos.length,                                   icon: "🌟" },
    { label: "Top Player",    value: topPlayer    ? topPlayer[0].split(" ")[0]  : "—", icon: "🏆" },
    { label: "Most Cheered",  value: topReceiver  ? topReceiver[0].split(" ")[0]: "—", icon: "📣" },
    { label: "Avg Win Rate",  value: avgWinRate !== null ? `${avgWinRate}%`     : "—", icon: "📊" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Team Stats</h2>
        <p className="text-slate-400 text-sm mt-1">A snapshot of your team&apos;s activity</p>
      </div>

      {/* Stat cards — 2-col mobile, 3-col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{card.icon}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium leading-tight">
                {card.label}
              </span>
            </div>
            <p className="text-3xl font-bold" style={{ color: "#f5c518" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Player leaderboard */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Player Leaderboard</h3>
        <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-6 text-xs text-slate-500 uppercase tracking-wider px-4 py-3 border-b border-[#2d3348]">
            <span className="col-span-2">Player</span>
            <span className="text-center">W</span>
            <span className="text-center">L</span>
            <span className="text-center">D</span>
            <span className="text-center">Win%</span>
          </div>
          {leaderboard.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No games played yet.
            </div>
          ) : (
            leaderboard.map((p, i) => (
              <div
                key={p.name}
                className="grid grid-cols-6 items-center px-4 py-3 border-b border-[#2d3348] last:border-0"
              >
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <span className="text-xs text-slate-600 w-4 flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-white font-medium truncate">{p.name}</span>
                </div>
                <span className="text-center text-emerald-400 text-sm font-semibold">{p.wins}</span>
                <span className="text-center text-rose-400 text-sm">{p.losses}</span>
                <span className="text-center text-slate-500 text-sm">{p.draws}</span>
                <span className="text-center text-sm font-semibold" style={{ color: "#f5c518" }}>
                  {p.rate}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Kudos wall */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Kudos Wall</h3>
        {sortedKudos.length === 0 ? (
          <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-10 text-center text-slate-500 text-sm">
            No kudos given yet.
          </div>
        ) : (
          <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl divide-y divide-[#2d3348]">
            {sortedKudos.map(k => (
              <div key={k.id} className="px-4 py-3 flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{k.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="text-slate-300 font-medium">{k.fromName}</span>
                    <span className="text-slate-600 mx-1">→</span>
                    <span className="font-semibold" style={{ color: "#f5c518" }}>{k.toName}</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5 truncate">&ldquo;{k.message}&rdquo;</p>
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0 mt-0.5">{formatTime(k.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
