"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { loadCrew } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import notify from "./Toast";
import LoadingSpinner from "./LoadingSpinner";

const MAX_MESSAGES = 100;
const MAX_CHARS = 280;

const REACTIONS = ["👍", "❤️", "😂", "🔥"] as const;
type ReactionEmoji = (typeof REACTIONS)[number];

interface Message {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
  reactions: Record<ReactionEmoji, number>;
}

const SAMPLE_MESSAGES: Message[] = [
  {
    id: "seed-1",
    senderName: "Jordan Kim",
    text: "Morning everyone! Ready for the sprint review today? 🚀",
    timestamp: Date.now() - 7200000,
    reactions: { "👍": 3, "❤️": 1, "😂": 0, "🔥": 2 },
  },
  {
    id: "seed-2",
    senderName: "Alex Rivera",
    text: "Yep! The demo environment is all set. Looking good on my end.",
    timestamp: Date.now() - 5400000,
    reactions: { "👍": 2, "❤️": 0, "😂": 0, "🔥": 1 },
  },
  {
    id: "seed-3",
    senderName: "Sam Patel",
    text: "Don't forget — retro is right after. I'll bring the virtual snacks 🍕",
    timestamp: Date.now() - 1800000,
    reactions: { "👍": 1, "❤️": 2, "😂": 3, "🔥": 0 },
  },
];

async function loadMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(MAX_MESSAGES);
  if (error) { console.warn("[chat] loadMessages:", error.message); return []; }
  return (data ?? []).map(r => ({
    id: r.id,
    senderName: r.sender_name,
    text: r.text,
    timestamp: new Date(r.created_at).getTime(),
    reactions: r.reactions as Record<ReactionEmoji, number>,
  }));
}

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sender, setSender] = useState("");
  const [text, setText] = useState("");
  const [crew, setCrew] = useState<{ id: string; name: string; emoji: string }[]>([]);
  const [, setTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([loadCrew(), loadMessages()]).then(([crewData, msgs]) => {
      setCrew(crewData);
      if (msgs.length > 0) {
        setMessages(msgs);
      } else {
        // Seed sample messages on first load
        setMessages(SAMPLE_MESSAGES);
        const rows = SAMPLE_MESSAGES.map(m => ({
          id: m.id, sender_name: m.senderName, text: m.text,
          reactions: m.reactions,
          created_at: new Date(m.timestamp).toISOString(),
        }));
        supabase.from("messages").upsert(rows, { onConflict: "id" }).then(({ error }) => { if (error) console.warn("[chat] seed:", error.message); });
      }
      setIsLoading(false);
    });

    // Real-time: reload all messages when any row changes
    const channel = supabase
      .channel("chat-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        loadMessages().then(setMessages);
      })
      .subscribe();

    const tick = setInterval(() => setTick(t => t + 1), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!sender) { notify.error("Select who you are first."); return; }
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;

    const newMsg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderName: sender,
      text: trimmed,
      timestamp: Date.now(),
      reactions: { "👍": 0, "❤️": 0, "😂": 0, "🔥": 0 },
    };

    // Optimistic update
    setMessages(prev => [...prev, newMsg].slice(-MAX_MESSAGES));
    setText("");
    inputRef.current?.focus();

    const { error } = await supabase.from("messages").insert({
      id: newMsg.id, sender_name: newMsg.senderName, text: newMsg.text,
      reactions: newMsg.reactions,
    });
    if (error) console.warn("[chat] sendMessage:", error.message);
    logActivity(`${sender} posted a message`);
  }, [sender, text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const addReaction = (msgId: string, emoji: ReactionEmoji) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const newReactions = { ...m.reactions, [emoji]: (m.reactions[emoji] ?? 0) + 1 };
      // Write updated reactions to DB fire-and-forget
      supabase.from("messages").update({ reactions: newReactions }).eq("id", msgId)
        .then(({ error }) => { if (error) console.warn("[chat] addReaction:", error.message); });
      return { ...m, reactions: newReactions };
    }));
  };

  const overLimit = text.length > MAX_CHARS;
  const canSend = sender.length > 0 && text.trim().length > 0 && !overLimit;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] min-h-[500px]">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Chat</h2>
          <p className="text-slate-400 text-sm mt-1">Message your crew</p>
        </div>
        <span className="text-xs text-slate-500">{messages.length} message{messages.length !== 1 ? "s" : ""}</span>
      </div>

      <div role="log" aria-label="Team chat messages" aria-live="polite" aria-atomic="false" className="flex-1 overflow-y-auto bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-4 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-lg font-medium text-slate-400">No messages yet</p>
            <p className="text-sm mt-1">Say something to your team</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="group">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-indigo-400">{msg.senderName}</span>
                <span className="text-xs text-slate-600">{relativeTime(msg.timestamp)}</span>
              </div>
              <div className="bg-[#0f1117] rounded-xl px-4 py-2.5 text-slate-200 text-sm leading-relaxed inline-block max-w-full break-words">
                {msg.text}
              </div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {REACTIONS.map(emoji => {
                  const count = msg.reactions[emoji] ?? 0;
                  return (
                    <button
                      key={emoji}
                      onClick={() => addReaction(msg.id, emoji)}
                      aria-label={`React with ${emoji}${(msg.reactions[emoji] ?? 0) > 0 ? `, ${msg.reactions[emoji]} reaction${msg.reactions[emoji] !== 1 ? "s" : ""}` : ""}`}
                      className={[
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
                        // Zero-count reactions are hidden (opacity-0) until the message
                        // is hovered (group-hover:opacity-100) so the row stays clean.
                        count > 0
                          ? "bg-indigo-600/20 border border-indigo-500/40 text-slate-200 hover:bg-indigo-600/30"
                          : "bg-[#252b3d] border border-transparent text-slate-500 hover:text-slate-300 hover:bg-[#2d3348] opacity-0 group-hover:opacity-100",
                      ].join(" ")}
                    >
                      <span>{emoji}</span>
                      {count > 0 && <span>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 bg-[#1a1f2e] border border-[#2d3348] rounded-2xl p-4">
        <div className="flex gap-3 mb-3">
          <select
            value={sender}
            onChange={e => setSender(e.target.value)}
            className="bg-[#0f1117] border border-[#2d3348] rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 flex-shrink-0"
          >
            <option value="">— Who are you? —</option>
            {crew.map(m => (
              <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>
            ))}
          </select>
          {crew.length === 0 && (
            <p className="text-xs text-amber-400 self-center">Add crew members in the Crew tab first.</p>
          )}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              maxLength={MAX_CHARS + 20}
              className={[
                "w-full bg-[#0f1117] border rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 text-sm focus:outline-none transition-colors",
                overLimit ? "border-red-500/70 focus:border-red-500" : "border-[#2d3348] focus:border-indigo-500",
              ].join(" ")}
            />
            <span className={[
              "absolute right-3 bottom-2.5 text-xs",
              overLimit ? "text-red-400" : text.length > MAX_CHARS * 0.85 ? "text-amber-400" : "text-slate-600",
            ].join(" ")}>
              {text.length}/{MAX_CHARS}
            </span>
          </div>
          <button
            onClick={sendMessage}
            disabled={!canSend}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 flex-shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
