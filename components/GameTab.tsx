"use client";

import { useState, useEffect, useCallback } from "react";
import notify from "./Toast";
import LoadingSpinner from "./LoadingSpinner";
import { CrewMember, PlayerStats } from "@/lib/types";
import { loadCrew, loadStats, saveStats } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { checkWinner, type BoardCell } from "@/lib/gameLogic";

// ─── Types ────────────────────────────────────────────────

type GameStatus = "idle" | "playing" | "won" | "draw";
type GameMode   = "ttt" | "rps";
type RPSChoice  = "rock" | "paper" | "scissors";
type RPSPhase   = "idle" | "x-picking" | "passing" | "o-picking" | "countdown" | "reveal";

// ─── RPS helpers ──────────────────────────────────────────

const RPS_EMOJI: Record<RPSChoice, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };
const RPS_OPTIONS: RPSChoice[] = ["rock", "paper", "scissors"];

function rpsResult(x: RPSChoice, o: RPSChoice): "X" | "O" | "draw" {
  if (x === o) return "draw";
  if (
    (x === "rock" && o === "scissors") ||
    (x === "scissors" && o === "paper") ||
    (x === "paper" && o === "rock")
  ) return "X";
  return "O";
}

// ─── Shared helpers ───────────────────────────────────────

const AVATAR_COLORS = [
  "#4f46e5", "#7c3aed", "#0891b2", "#059669",
  "#e11d48", "#d97706", "#db2777", "#0d9488",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function firstName(name: string): string {
  return name.split(" ")[0];
}

// ─── Component ────────────────────────────────────────────

export default function GameTab() {
  // Shared
  const [gameMode, setGameMode] = useState<GameMode>("ttt");
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [playerX, setPlayerX] = useState("");
  const [playerO, setPlayerO] = useState("");
  const [stats, setStats] = useState<Record<string, PlayerStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  // TTT state
  const [board, setBoard] = useState<BoardCell[]>(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState<"X" | "O">("X");
  const [tttStatus, setTttStatus] = useState<GameStatus>("idle");
  const [winLine, setWinLine] = useState<number[]>([]);
  const [winnerName, setWinnerName] = useState("");

  // RPS state
  const [rpsPhase, setRpsPhase] = useState<RPSPhase>("idle");
  const [rpsChoiceX, setRpsChoiceX] = useState<RPSChoice | null>(null);
  const [rpsChoiceO, setRpsChoiceO] = useState<RPSChoice | null>(null);
  const [rpsRoundWinner, setRpsRoundWinner] = useState<"X" | "O" | "draw" | null>(null);
  const [rpsScoreX, setRpsScoreX] = useState(0);
  const [rpsScoreO, setRpsScoreO] = useState(0);
  const [rpsMatchWinner, setRpsMatchWinner] = useState("");
  const [rpsCountdown, setRpsCountdown] = useState(3);

  useEffect(() => {
    Promise.all([loadCrew(), loadStats()]).then(([c, s]) => {
      setCrew(c);
      setStats(s);
      setIsLoading(false);
    });
  }, []);

  // ─── Shared stat recorder ─────────────────────────────────

  const recordResult = useCallback((winner: string, loser: string, outcome: "win" | "draw") => {
    setStats(prev => {
      const blank = (): PlayerStats => ({ wins: 0, losses: 0, draws: 0 });
      const next = { ...prev };
      if (outcome === "win") {
        next[winner] = { ...(next[winner] ?? blank()), wins: (next[winner]?.wins ?? 0) + 1 };
        next[loser]  = { ...(next[loser]  ?? blank()), losses: (next[loser]?.losses ?? 0) + 1 };
      } else {
        next[winner] = { ...(next[winner] ?? blank()), draws: (next[winner]?.draws ?? 0) + 1 };
        next[loser]  = { ...(next[loser]  ?? blank()), draws: (next[loser]?.draws ?? 0) + 1 };
      }
      saveStats(next).catch(console.error);
      return next;
    });
  }, []);

  // ─── TTT logic ────────────────────────────────────────────

  const clearBoard = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentTurn("X");
    setWinLine([]);
    setWinnerName("");
  }, []);

  // Changing players mid-game resets to idle
  useEffect(() => {
    if (tttStatus === "playing") { clearBoard(); setTttStatus("idle"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerX, playerO]);

  const startTTT = () => {
    if (!playerX || !playerO) { notify.error("Select both players."); return; }
    if (playerX === playerO) { notify.error("Players must be different."); return; }
    clearBoard();
    setTttStatus("playing");
  };

  const handleCell = (idx: number) => {
    if (tttStatus !== "playing" || board[idx]) return;
    const next = [...board];
    next[idx] = currentTurn;
    setBoard(next);
    const { winner, line } = checkWinner(next);
    if (winner) {
      const name  = winner === "X" ? playerX : playerO;
      const loser = winner === "X" ? playerO : playerX;
      setWinLine(line); setWinnerName(name); setTttStatus("won");
      notify.success(`🏆 ${firstName(name)} wins!`);
      recordResult(name, loser, "win");
      logActivity(`${firstName(name)} beat ${firstName(loser)} at Tic Tac Toe`);
    } else if (next.every(Boolean)) {
      setTttStatus("draw");
      notify.success("It's a draw!");
      recordResult(playerX, playerO, "draw");
      logActivity(`${firstName(playerX)} and ${firstName(playerO)} drew`);
    } else {
      setCurrentTurn(t => (t === "X" ? "O" : "X"));
    }
  };

  const resetTTT  = () => { clearBoard(); setTttStatus(playerX && playerO && playerX !== playerO ? "playing" : "idle"); };
  const newTTTGame = () => { clearBoard(); setTttStatus("idle"); };

  // ─── RPS logic ────────────────────────────────────────────

  const newRPSMatch = useCallback(() => {
    setRpsPhase("idle");
    setRpsChoiceX(null); setRpsChoiceO(null);
    setRpsRoundWinner(null);
    setRpsScoreX(0); setRpsScoreO(0);
    setRpsMatchWinner("");
  }, []);

  const startRPS = () => {
    if (!playerX || !playerO) { notify.error("Select both players."); return; }
    if (playerX === playerO) { notify.error("Players must be different."); return; }
    setRpsPhase("x-picking");
  };

  const pickX = (choice: RPSChoice) => {
    setRpsChoiceX(choice);
    setRpsPhase("passing");
  };

  const pickO = (choice: RPSChoice) => {
    const round   = rpsResult(rpsChoiceX!, choice);
    const newScX  = rpsScoreX + (round === "X" ? 1 : 0);
    const newScO  = rpsScoreO + (round === "O" ? 1 : 0);

    setRpsChoiceO(choice);
    setRpsRoundWinner(round);
    setRpsScoreX(newScX);
    setRpsScoreO(newScO);

    if (newScX >= 2) {
      setRpsMatchWinner(playerX);
      recordResult(playerX, playerO, "win");
      logActivity(`${firstName(playerX)} beat ${firstName(playerO)} at Rock Paper Scissors`);
      notify.success(`🏆 ${firstName(playerX)} wins the match!`);
    } else if (newScO >= 2) {
      setRpsMatchWinner(playerO);
      recordResult(playerO, playerX, "win");
      logActivity(`${firstName(playerO)} beat ${firstName(playerX)} at Rock Paper Scissors`);
      notify.success(`🏆 ${firstName(playerO)} wins the match!`);
    }

    setRpsCountdown(3);
    setRpsPhase("countdown");
  };

  const nextRPSRound = () => {
    setRpsChoiceX(null); setRpsChoiceO(null);
    setRpsRoundWinner(null);
    setRpsPhase("x-picking");
  };

  // Countdown → reveal
  useEffect(() => {
    if (rpsPhase !== "countdown") return;
    if (rpsCountdown <= 0) {
      const t = setTimeout(() => setRpsPhase("reveal"), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRpsCountdown(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [rpsPhase, rpsCountdown]);

  // Switch game modes — reset both games
  const switchMode = (mode: GameMode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    clearBoard();
    setTttStatus("idle");
    newRPSMatch();
  };

  // ─── Leaderboard (shared) ─────────────────────────────────

  const leaderboard = Object.entries(stats)
    .map(([name, s]) => ({ name, ...s, points: s.wins * 3 + s.draws }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins);

  const currentPlayerName = currentTurn === "X" ? playerX : playerO;

  const playersDisabled = tttStatus === "playing" || (gameMode === "rps" && rpsPhase !== "idle");

  // ─── Render ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">

      {/* ── Game panel ── */}
      <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-5 w-full lg:w-auto flex-shrink-0">

        {/* Game mode selector */}
        <div className="flex gap-1 bg-[#0f1117] rounded-xl p-1 mb-5">
          {(["ttt", "rps"] as GameMode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className={["flex-1 py-1.5 text-xs font-medium rounded-lg transition-all",
                gameMode === m ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"].join(" ")}
            >
              {m === "ttt" ? "Tic Tac Toe" : "Rock Paper Scissors"}
            </button>
          ))}
        </div>

        {/* Player selection — shared */}
        <div className="flex items-end justify-center gap-2 mb-5">
          <div>
            <p className="text-[11px] text-slate-500 mb-1">Player X</p>
            <select value={playerX} onChange={e => setPlayerX(e.target.value)} disabled={playersDisabled}
              className="w-[130px] bg-[#0f1117] border border-[#2d3348] rounded-lg px-2 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">— Choose —</option>
              {crew.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div className="mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 bg-[#0f1117] border border-[#2d3348] px-2 py-1 rounded-md">VS</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 mb-1">Player O</p>
            <select value={playerO} onChange={e => setPlayerO(e.target.value)} disabled={playersDisabled}
              className="w-[130px] bg-[#0f1117] border border-[#2d3348] rounded-lg px-2 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">— Choose —</option>
              {crew.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {/* ── Tic Tac Toe ── */}
        {gameMode === "ttt" && (
          <>
            <div className="h-6 flex items-center justify-center mb-3">
              {tttStatus === "playing" && (
                <p className="text-[0.8rem] font-mono text-slate-400">
                  <span className="text-indigo-400 font-semibold">{firstName(currentPlayerName)}</span>
                  {`'s turn (${currentTurn})`}
                </p>
              )}
              {tttStatus === "won"  && <p className="text-[0.8rem] font-mono text-emerald-400 font-semibold">🏆 {firstName(winnerName)} wins!</p>}
              {tttStatus === "draw" && <p className="text-[0.8rem] font-mono text-amber-400 font-semibold">🤝 Draw!</p>}
            </div>

            <div className="mx-auto mb-4 w-[208px] sm:w-[256px]">
              <div className="grid grid-cols-3 gap-2">
                {board.map((cell, idx) => {
                  const isWin = winLine.includes(idx);
                  return (
                    <button key={idx} onClick={() => handleCell(idx)}
                      disabled={tttStatus !== "playing" || !!cell}
                      className={[
                        "w-16 h-16 sm:w-20 sm:h-20 rounded-lg border flex items-center justify-center text-2xl font-bold transition-colors duration-100",
                        isWin ? "border-emerald-500 bg-emerald-900/25" : "border-[#2d3348] bg-[#0f1117]",
                        !cell && tttStatus === "playing" ? "hover:border-indigo-500/50 hover:bg-[#1c2130] cursor-pointer" : "cursor-default",
                        cell === "X" ? "text-indigo-400" : "text-rose-400",
                      ].join(" ")}
                    >
                      {cell}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              {tttStatus === "idle" && (
                <button onClick={startTTT} className="px-4 py-1.5 text-sm border border-indigo-500/70 text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors">
                  Start Game
                </button>
              )}
              {tttStatus === "playing" && (
                <button onClick={resetTTT} className="px-4 py-1.5 text-sm border border-[#2d3348] text-slate-400 rounded-lg hover:bg-[#2d3348] transition-colors">
                  Reset
                </button>
              )}
              {(tttStatus === "won" || tttStatus === "draw") && (
                <>
                  <button onClick={resetTTT} className="px-4 py-1.5 text-sm border border-indigo-500/70 text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors">
                    Play Again
                  </button>
                  <button onClick={newTTTGame} className="px-4 py-1.5 text-sm border border-[#2d3348] text-slate-400 rounded-lg hover:bg-[#2d3348] transition-colors">
                    New Game
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Rock Paper Scissors ── */}
        {gameMode === "rps" && (
          <div className="w-[280px] sm:w-[320px] mx-auto min-h-[220px] flex flex-col items-center justify-center">

            {/* Idle */}
            {rpsPhase === "idle" && (
              <div className="text-center py-2">
                <p className="text-xs text-slate-500 mb-4">Best of 3 rounds — first to 2 wins</p>
                <button onClick={startRPS} className="px-5 py-2 text-sm border border-indigo-500/70 text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors">
                  Start Match
                </button>
              </div>
            )}

            {/* X picking */}
            {rpsPhase === "x-picking" && (
              <div className="text-center w-full">
                <p className="text-sm text-slate-400 mb-0.5">
                  <span className="text-white font-semibold">{firstName(playerX)}</span>, make your pick
                </p>
                <p className="text-xs text-slate-600 mb-4">{firstName(playerO)} cannot see your choice</p>
                <div className="flex gap-3 justify-center">
                  {RPS_OPTIONS.map(c => (
                    <button key={c} onClick={() => pickX(c)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#2d3348] bg-[#0f1117] hover:border-indigo-500/50 hover:bg-[#1c2130] transition-all"
                    >
                      <span className="text-3xl">{RPS_EMOJI[c]}</span>
                      <span className="text-xs text-slate-400 capitalize">{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Passing screen */}
            {rpsPhase === "passing" && (
              <div className="text-center py-2">
                <p className="text-3xl mb-3">🔒</p>
                <p className="text-sm text-emerald-400 font-medium mb-1">{firstName(playerX)} has locked in.</p>
                <p className="text-sm text-slate-400 mb-5">
                  Pass the device to <span className="text-white font-semibold">{firstName(playerO)}</span>.
                </p>
                <button onClick={() => setRpsPhase("o-picking")}
                  className="px-5 py-2 text-sm border border-indigo-500/70 text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
                >
                  Continue →
                </button>
              </div>
            )}

            {/* O picking */}
            {rpsPhase === "o-picking" && (
              <div className="text-center w-full">
                <p className="text-sm text-slate-400 mb-0.5">
                  <span className="text-white font-semibold">{firstName(playerO)}</span>, make your pick
                </p>
                <p className="text-xs text-slate-600 mb-4">{firstName(playerX)}&apos;s choice is hidden</p>
                <div className="flex gap-3 justify-center">
                  {RPS_OPTIONS.map(c => (
                    <button key={c} onClick={() => pickO(c)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#2d3348] bg-[#0f1117] hover:border-indigo-500/50 hover:bg-[#1c2130] transition-all"
                    >
                      <span className="text-3xl">{RPS_EMOJI[c]}</span>
                      <span className="text-xs text-slate-400 capitalize">{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Countdown */}
            {rpsPhase === "countdown" && (
              <div className="text-center py-4">
                <p className="text-7xl font-bold text-white tabular-nums leading-none">
                  {rpsCountdown > 0 ? rpsCountdown : "GO!"}
                </p>
                <p className="text-xs text-slate-600 mt-4">Revealing picks…</p>
              </div>
            )}

            {/* Reveal */}
            {rpsPhase === "reveal" && rpsChoiceX && rpsChoiceO && (
              <div className="text-center w-full">
                {/* Picks */}
                <div className="flex items-center justify-center gap-8 mb-4">
                  <div>
                    <p className="text-4xl mb-1">{RPS_EMOJI[rpsChoiceX]}</p>
                    <p className="text-xs text-white font-medium">{firstName(playerX)}</p>
                    <p className="text-xs text-slate-500 capitalize">{rpsChoiceX}</p>
                  </div>
                  <span className="text-slate-600 text-sm font-bold">VS</span>
                  <div>
                    <p className="text-4xl mb-1">{RPS_EMOJI[rpsChoiceO]}</p>
                    <p className="text-xs text-white font-medium">{firstName(playerO)}</p>
                    <p className="text-xs text-slate-500 capitalize">{rpsChoiceO}</p>
                  </div>
                </div>

                {/* Round result */}
                <p className="text-sm font-semibold mb-1">
                  {rpsRoundWinner === "X"    && <span className="text-emerald-400">🏆 {firstName(playerX)} wins the round!</span>}
                  {rpsRoundWinner === "O"    && <span className="text-emerald-400">🏆 {firstName(playerO)} wins the round!</span>}
                  {rpsRoundWinner === "draw" && <span className="text-amber-400">🤝 Draw — no point awarded</span>}
                </p>

                {/* Match score */}
                <p className="text-xs text-slate-500 mb-4">
                  {firstName(playerX)}{" "}
                  <span className="text-white font-bold text-sm">{rpsScoreX}</span>
                  {" — "}
                  <span className="text-white font-bold text-sm">{rpsScoreO}</span>
                  {" "}{firstName(playerO)}
                </p>

                {/* Match over or next round */}
                {rpsMatchWinner ? (
                  <div>
                    <p className="text-sm text-emerald-400 font-bold mb-3">
                      🏆 {firstName(rpsMatchWinner)} wins the match!
                    </p>
                    <button onClick={newRPSMatch}
                      className="px-4 py-1.5 text-sm border border-indigo-500/70 text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
                    >
                      New Match
                    </button>
                  </div>
                ) : (
                  <button onClick={nextRPSRound}
                    className="px-4 py-1.5 text-sm border border-indigo-500/70 text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
                  >
                    Next Round →
                  </button>
                )}
              </div>
            )}

            {/* Abandon match link */}
            {rpsPhase !== "idle" && (
              <button onClick={newRPSMatch} className="mt-5 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                Abandon match
              </button>
            )}
          </div>
        )}

        {crew.length === 0 && (
          <p className="text-xs text-amber-400/80 mt-3 text-center">⚠️ Add crew members first to play.</p>
        )}
      </div>

      {/* ── Leaderboard (all games combined) ── */}
      <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-5 w-full lg:w-[260px] flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Leaderboard</h2>
        <p className="text-[10px] text-slate-600 mb-4">TTT + RPS combined</p>

        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-2xl mb-2">🎮</p>
            <p className="text-xs font-medium text-slate-400">No games played yet</p>
            <p className="text-xs mt-1">Select players and start a match</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-2 pb-1 mb-1 border-b border-[#2d3348]">
              <span className="w-5" />
              <span className="w-7" />
              <span className="flex-1 text-[10px] text-slate-600 uppercase tracking-wider">Name</span>
              <span className="w-6 text-center text-[10px] text-emerald-700 uppercase tracking-wider">W</span>
              <span className="w-6 text-center text-[10px] text-slate-600 uppercase tracking-wider">L</span>
              <span className="w-6 text-center text-[10px] text-slate-600 uppercase tracking-wider">D</span>
            </div>
            {leaderboard.map((player, i) => (
              <div key={player.name} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${i === 0 ? "bg-indigo-600/10" : ""}`}>
                <span className="w-5 text-center text-sm flex-shrink-0">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-slate-600 text-xs">{i + 1}</span>}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: avatarColor(player.name) }}>
                  {player.name[0].toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-white font-medium truncate">{firstName(player.name)}</span>
                <span className="w-6 text-center text-xs text-emerald-400 font-semibold">{player.wins}</span>
                <span className="w-6 text-center text-xs text-slate-500">{player.losses}</span>
                <span className="w-6 text-center text-xs text-slate-500">{player.draws}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
