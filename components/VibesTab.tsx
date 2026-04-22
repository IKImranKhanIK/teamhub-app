"use client";

import { useState, useEffect } from "react";
import notify from "./Toast";
import { CrewMember } from "@/lib/types";
import { loadCrew } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import LoadingSpinner from "./LoadingSpinner";

// ─── Types ────────────────────────────────────────────────

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>; // { memberName: optionIndex }
}

interface IcebreakerState {
  date: string;
  questionIndex: number;
  answers: { name: string; text: string }[];
}

interface MoodState {
  date: string;
  checkins: { name: string; mood: string }[];
}

// ─── Constants ────────────────────────────────────────────

const MOOD_EMOJIS = ["😴", "😐", "🙂", "😄", "🔥"];

const ICEBREAKERS = [
  "What's the best meal you've ever had?",
  "If you could have any superpower, what would it be?",
  "What's a skill you want to learn this year?",
  "What's your most-used emoji and why?",
  "What's the last thing that genuinely made you laugh?",
  "If you could work from anywhere in the world, where would it be?",
  "What's one thing on your bucket list?",
  "Morning person or night owl — has that changed over time?",
  "What's a hobby that might surprise your teammates?",
  "If you could have dinner with any historical figure, who would it be?",
  "What's the best piece of career advice you've received?",
  "What does your ideal Saturday look like?",
  "What's a tool or app you couldn't live without?",
  "What's something you learned recently you wish you'd known earlier?",
  "If you were a programming language, which would you be and why?",
  "What's your go-to comfort food?",
  "What's the most interesting place you've ever visited?",
  "What motivates you most at work?",
  "What's a small thing that makes a big difference in your day?",
  "What's your proudest professional achievement so far?",
];

// ─── Storage helpers ──────────────────────────────────────

async function loadPoll(): Promise<Poll | null> {
  const { data } = await supabase
    .from("poll").select("*").order("created_at", { ascending: false }).limit(1);
  if (!data || data.length === 0) return null;
  const r = data[0];
  return { id: r.id, question: r.question, options: r.options as string[], votes: r.votes as Record<string, number> };
}

async function savePoll(poll: Poll | null): Promise<void> {
  if (!poll) {
    await supabase.from("poll").delete().neq("id", "");
    return;
  }
  const { error } = await supabase.from("poll").upsert(
    { id: poll.id, question: poll.question, options: poll.options, votes: poll.votes },
    { onConflict: "id" }
  );
  if (error) console.warn("[vibes] savePoll:", error.message);
}

async function loadIcebreaker(date: string): Promise<IcebreakerState | null> {
  const { data } = await supabase.from("icebreaker").select("*").eq("date", date).maybeSingle();
  if (!data) return null;
  return { date: data.date, questionIndex: data.question_index, answers: data.answers as { name: string; text: string }[] };
}

async function saveIcebreaker(s: IcebreakerState): Promise<void> {
  const { error } = await supabase.from("icebreaker").upsert(
    { date: s.date, question_index: s.questionIndex, answers: s.answers },
    { onConflict: "date" }
  );
  if (error) console.warn("[vibes] saveIcebreaker:", error.message);
}

async function loadMood(date: string): Promise<MoodState | null> {
  const { data } = await supabase.from("mood").select("*").eq("date", date).maybeSingle();
  if (!data) return null;
  return { date: data.date, checkins: data.checkins as { name: string; mood: string }[] };
}

async function saveMood(s: MoodState): Promise<void> {
  const { error } = await supabase.from("mood").upsert(
    { date: s.date, checkins: s.checkins },
    { onConflict: "date" }
  );
  if (error) console.warn("[vibes] saveMood:", error.message);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function dateSeed(d: string): number {
  let h = 0;
  for (const c of d) h = h * 31 + c.charCodeAt(0);
  return Math.abs(h);
}

// ─── Poll ─────────────────────────────────────────────────

function PollSection({ crew }: { crew: CrewMember[] }) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [voter, setVoter] = useState("");

  useEffect(() => { loadPoll().then(setPoll); }, []);

  const vote = (idx: number) => {
    if (!voter || !poll) return;
    if (poll.votes[voter] !== undefined) { notify.error("You've already voted."); return; }
    const updated = { ...poll, votes: { ...poll.votes, [voter]: idx } };
    setPoll(updated);
    savePoll(updated).catch(console.error);
    notify.success("Vote recorded!");
  };

  const totalVotes = poll ? Object.keys(poll.votes).length : 0;
  const voterVoted = voter && poll ? poll.votes[voter] !== undefined : false;
  const showResults = voterVoted || (!voter && totalVotes > 0);

  return (
    <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Team Poll</h3>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs px-3 py-1.5 border border-indigo-500/50 text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors"
        >
          + New Poll
        </button>
      </div>

      {!poll ? (
        <p className="text-sm text-slate-500 text-center py-6">No active poll — create one to get started.</p>
      ) : (
        <>
          <p className="text-white font-medium mb-4">{poll.question}</p>

          <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">Vote as</label>
            <select
              value={voter}
              onChange={e => setVoter(e.target.value)}
              className="bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 w-full max-w-[200px]"
            >
              <option value="">— Choose member —</option>
              {crew.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            {poll.options.map((opt, i) => {
              const count = Object.values(poll.votes).filter(v => v === i).length;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isMyVote = voter && poll.votes[voter] === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => vote(i)}
                    disabled={!!voterVoted || !voter}
                    className={[
                      "w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors",
                      isMyVote
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-[#2d3348] bg-[#0f1117] text-slate-300 hover:border-indigo-500/40 disabled:cursor-default",
                    ].join(" ")}
                  >
                    <div className="flex justify-between">
                      <span>{opt}</span>
                      {showResults && <span className="text-xs text-slate-500">{count} ({pct}%)</span>}
                    </div>
                  </button>
                  {showResults && (
                    <div className="h-1 bg-[#0f1117] rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 mt-3">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
        </>
      )}

      {showModal && (
        <CreatePollModal
          crew={crew}
          onClose={() => setShowModal(false)}
          onCreate={(p, creator) => { setPoll(p); savePoll(p).catch(console.error); setShowModal(false); setVoter(""); notify.success("Poll created!"); logActivity(`${creator} created a new poll`); }}
        />
      )}
    </div>
  );
}

function CreatePollModal({ crew, onClose, onCreate }: { crew: CrewMember[]; onClose: () => void; onCreate: (p: Poll, creator: string) => void }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creator, setCreator] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) { notify.error("Enter a question."); return; }
    const valid = options.map(o => o.trim()).filter(Boolean);
    if (valid.length < 2) { notify.error("Add at least 2 options."); return; }
    if (!creator) { notify.error("Select who is creating this poll."); return; }
    onCreate({ id: crypto.randomUUID(), question: question.trim(), options: valid, votes: {} }, creator);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#2d3348]">
          <h2 className="text-lg font-semibold text-white">Create Poll</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask the team something..."
              maxLength={150}
              className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <div>
            <label className="block text-xs text-slate-400 mb-1">Created by</label>
            <select
              value={creator}
              onChange={e => setCreator(e.target.value)}
              className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Your name —</option>
              {crew.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <label className="block text-xs text-slate-400">Options (2–4)</label>
            {options.map((opt, i) => (
              <input
                key={i}
                type="text"
                value={opt}
                onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                placeholder={`Option ${i + 1}`}
                maxLength={100}
                className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            ))}
            {options.length < 4 && (
              <button type="button" onClick={() => setOptions(o => [...o, ""])} className="text-xs text-indigo-400 hover:text-indigo-300">
                + Add option
              </button>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#2d3348] rounded-lg text-slate-300 hover:bg-[#2d3348] transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition-colors">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Icebreaker ───────────────────────────────────────────

function IcebreakerSection({ crew }: { crew: CrewMember[] }) {
  const [state, setState] = useState<IcebreakerState | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    const t = todayStr();
    loadIcebreaker(t).then(stored => {
      if (stored) {
        setState(stored);
      } else {
        const fresh: IcebreakerState = { date: t, questionIndex: dateSeed(t) % ICEBREAKERS.length, answers: [] };
        setState(fresh);
        saveIcebreaker(fresh).catch(console.error);
      }
    });
  }, []);

  const nextQuestion = () => {
    if (!state) return;
    const updated = { ...state, questionIndex: (state.questionIndex + 1) % ICEBREAKERS.length };
    setState(updated);
    saveIcebreaker(updated).catch(console.error);
  };

  const submitAnswer = () => {
    if (!state || !name || !text.trim()) { notify.error("Select your name and write an answer."); return; }
    if (state.answers.some(a => a.name === name)) { notify.error("You've already answered today."); return; }
    const updated = { ...state, answers: [...state.answers, { name, text: text.trim() }] };
    setState(updated);
    saveIcebreaker(updated).catch(console.error);
    setText("");
    setShowAnswer(false);
    notify.success("Answer submitted!");
  };

  if (!state) return null;

  return (
    <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Icebreaker of the Day</h3>
        <button onClick={nextQuestion} className="text-xs px-3 py-1.5 border border-[#2d3348] text-slate-400 rounded-lg hover:bg-[#2d3348] transition-colors">
          New question
        </button>
      </div>

      <p className="text-white font-medium mb-4">{ICEBREAKERS[state.questionIndex]}</p>

      {showAnswer ? (
        <div className="space-y-2 mb-4">
          <select
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">— Your name —</option>
            {crew.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Your answer..."
            rows={2}
            maxLength={200}
            className="w-full bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={submitAnswer} className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors">Submit</button>
            <button onClick={() => setShowAnswer(false)} className="px-4 py-1.5 text-sm border border-[#2d3348] text-slate-400 rounded-lg hover:bg-[#2d3348] transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAnswer(true)} className="text-xs px-3 py-1.5 border border-indigo-500/50 text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors mb-4">
          Answer
        </button>
      )}

      {state.answers.length > 0 && (
        <div className="space-y-2 border-t border-[#2d3348] pt-4">
          {state.answers.map((a, i) => (
            <div key={i} className="bg-[#0f1117] rounded-xl px-3 py-2">
              <p className="text-xs text-indigo-400 font-medium mb-0.5">{a.name}</p>
              <p className="text-sm text-slate-300">{a.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mood check-in ────────────────────────────────────────

function MoodSection({ crew }: { crew: CrewMember[] }) {
  const [state, setState] = useState<MoodState | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const t = todayStr();
    loadMood(t).then(stored => {
      if (stored) {
        setState(stored);
      } else {
        const fresh: MoodState = { date: t, checkins: [] };
        setState(fresh);
        saveMood(fresh).catch(console.error);
      }
    });
  }, []);

  const checkIn = (mood: string) => {
    if (!name || !state) { notify.error("Select your name first."); return; }
    const exists = state.checkins.find(c => c.name === name);
    const checkins = exists
      ? state.checkins.map(c => c.name === name ? { ...c, mood } : c)
      : [...state.checkins, { name, mood }];
    const updated = { ...state, checkins };
    setState(updated);
    saveMood(updated).catch(console.error);
    if (!exists) { notify.success("Mood checked in!"); logActivity(`${name} checked in as ${mood}`); }
  };

  if (!state) return null;

  const myMood = state.checkins.find(c => c.name === name)?.mood;
  const summary = MOOD_EMOJIS.map(e => ({ emoji: e, count: state.checkins.filter(c => c.mood === e).length }));

  return (
    <div className="bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Mood Check-in</h3>
      <p className="text-xs text-slate-500 mb-4">How are you feeling today?</p>

      <div className="mb-4">
        <select
          value={name}
          onChange={e => setName(e.target.value)}
          className="bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 w-full max-w-[200px]"
        >
          <option value="">— Your name —</option>
          {crew.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
        </select>
      </div>

      <div className="flex gap-3 mb-6">
        {MOOD_EMOJIS.map(e => (
          <button
            key={e}
            onClick={() => checkIn(e)}
            className={["text-2xl p-2 rounded-xl transition-all", myMood === e ? "bg-indigo-600 scale-110" : "bg-[#0f1117] hover:bg-[#2d3348]"].join(" ")}
          >
            {e}
          </button>
        ))}
      </div>

      {state.checkins.length > 0 && (
        <div className="border-t border-[#2d3348] pt-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Today&apos;s team vibe</p>
          <div className="flex gap-4 flex-wrap">
            {summary.filter(s => s.count > 0).map(s => (
              <div key={s.emoji} className="flex items-center gap-1.5">
                <span className="text-xl">{s.emoji}</span>
                <span className="text-sm font-semibold text-slate-300">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────

export default function VibesTab() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCrew().then(c => { setCrew(c); setIsLoading(false); });
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Vibes</h2>
        <p className="text-slate-400 text-sm mt-1">Polls, icebreakers, and team mood</p>
      </div>
      <PollSection crew={crew} />
      <IcebreakerSection crew={crew} />
      <MoodSection crew={crew} />
    </div>
  );
}
