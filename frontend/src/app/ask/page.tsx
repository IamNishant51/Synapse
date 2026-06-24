"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import EmptyState from "@/components/EmptyState";
import SourcePill from "@/components/SourcePill";
import { answerQuery } from "@/lib/api";
import type { ChatMessage, DiffCard, TimelinePoint } from "@/lib/types";

const promptChips = [
  "What changed about my tech stack since March?",
  "What did I believe about databases before vs now?",
  "Why did I decide to switch from Postgres to Supabase?",
];

interface ConversationMeta {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

const CUR_KEY = "ask-messages";
const CONV_INDEX_KEY = "ask-conv-index";

function saveMessagesRaw(msgs: ChatMessage[]) {
  try { localStorage.setItem(CUR_KEY, JSON.stringify(msgs)); } catch {}
}

function loadMessagesRaw(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUR_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function getConvIndex(): ConversationMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONV_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistConvIndex(list: ConversationMeta[]) {
  try { localStorage.setItem(CONV_INDEX_KEY, JSON.stringify(list)); } catch {}
}

function convMsgKey(id: string) {
  return `ask-conv-${id}`;
}

function saveConvMessages(id: string, msgs: ChatMessage[]) {
  try { localStorage.setItem(convMsgKey(id), JSON.stringify(msgs)); } catch {}
}

function loadConvMessages(id: string): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(convMsgKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function deleteConvMessages(id: string) {
  try { localStorage.removeItem(convMsgKey(id)); } catch {}
}

function generateTitle(msgs: ChatMessage[]): string {
  if (msgs.length === 0) return "Empty conversation";
  const first = msgs[0].query;
  return first.length > 45 ? first.slice(0, 42) + "..." : first;
}

function DiffCardView({ diff }: { diff: DiffCard }) {
  return (
    <div className="mt-4 rounded-lg border border-hairline overflow-hidden">
      <div className="px-4 py-3 bg-surface-2 border-b border-hairline">
        <span className="text-xs font-medium text-ink-muted">Changes since {diff.sinceDate}</span>
      </div>
      <div className="divide-y divide-hairline">
        {diff.added.length > 0 && (
          <div className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs text-semantic-success font-mono">+</span>
            <span className="text-xs text-ink-muted">Added</span>
            <span className="text-sm text-ink">{diff.added.join(", ")}</span>
          </div>
        )}
        {diff.removed.length > 0 && (
          <div className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs text-semantic-danger font-mono">-</span>
            <span className="text-xs text-ink-muted">Removed</span>
            <span className="text-sm text-ink">{diff.removed.join(", ")}</span>
          </div>
        )}
        {diff.changed.length > 0 && (
          <div className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs text-conflict-warning font-mono">~</span>
            <span className="text-xs text-ink-muted">Changed</span>
            <span className="text-sm text-ink">
              {diff.changed.map(([old, nw]) => `${old} → ${nw}`).join(", ")}
            </span>
          </div>
        )}
        {diff.newDecisions.length > 0 && (
          <div className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs text-primary font-mono">*</span>
            <span className="text-xs text-ink-muted">New Decisions</span>
            <span className="text-sm text-ink">{diff.newDecisions.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineView({ points }: { points: TimelinePoint[] }) {
  const maxConfidence = Math.max(...points.map((p) => p.confidenceScore));

  return (
    <div className="mt-4 rounded-lg border border-hairline p-4">
      <span className="text-xs font-medium text-ink-muted mb-3 block">Confidence Timeline</span>
      <div className="space-y-2.5">
        {points.map((point, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="w-16 text-xs text-ink-tertiary shrink-0">{point.date}</span>
            <div className="flex-1 h-5 rounded bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${(point.confidenceScore / maxConfidence) * 100}%`,
                  backgroundColor: point.confidenceScore >= 0.8 ? "#5e6ad2" : point.confidenceScore >= 0.4 ? "#7a7fad" : "#3e3e44",
                }}
              />
            </div>
            <span className="w-20 text-xs font-mono text-ink-subtle text-right shrink-0">
              {Math.round(point.confidenceScore * 100)}%
            </span>
            <span className="w-20 text-xs text-ink-muted shrink-0">{point.valueSummary}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function isToday(d: Date) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isYesterday(d: Date) {
  const t = new Date();
  t.setDate(t.getDate() - 1);
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (isYesterday(d)) return `Yesterday ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [convIndex, setConvIndex] = useState<ConversationMeta[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const epochRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadMessagesRaw();
    if (saved.length > 0) setMessages(saved);
    setConvIndex(getConvIndex());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    saveMessagesRaw(messages);
  }, [messages]);

  useEffect(() => {
    persistConvIndex(convIndex);
  }, [convIndex]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    if (showHistory) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showHistory]);

  const saveCurrentToHistory = useCallback(() => {
    if (messages.length === 0) return null;
    const convId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    saveConvMessages(convId, messages);
    const convs = getConvIndex();
    convs.unshift({
      id: convId,
      title: generateTitle(messages),
      updatedAt: new Date().toISOString(),
      messageCount: messages.length,
    });
    setConvIndex([...convs]);
    return convId;
  }, [messages]);

  const newConversation = useCallback(() => {
    saveCurrentToHistory();
    setMessages([]);
    try { localStorage.removeItem(CUR_KEY); } catch {}
  }, [saveCurrentToHistory]);

  const switchToConversation = useCallback((convId: string) => {
    saveCurrentToHistory();
    const stored = loadConvMessages(convId);
    if (stored) {
      setMessages(stored);
    }
    setConvIndex(prev => prev.filter(c => c.id !== convId));
    setShowHistory(false);
  }, [saveCurrentToHistory]);

  const deleteConversation = useCallback((convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConvMessages(convId);
    setConvIndex(prev => prev.filter(c => c.id !== convId));
  }, []);

  const handleSubmit = async (query?: string) => {
    const q = (query || input).trim();
    if (!q || isProcessing) return;

    const epoch = ++epochRef.current;
    setIsProcessing(true);
    setInput("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await answerQuery(q, controller.signal);
      if (epoch !== epochRef.current) return;
      setMessages((prev) => {
        const next = [...prev, response];
        saveMessagesRaw(next);
        return next;
      });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "Failed to get answer";
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        query: q,
        intent: null,
        answer: `Error: ${msg}. Make sure the backend is running.`,
        sources: [],
        diffCard: null,
        timeline: null,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, errorMsg];
        saveMessagesRaw(next);
        return next;
      });
    } finally {
      if (epoch === epochRef.current) {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-4 md:px-8 pt-6 pb-4 border-b border-hairline flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
          Ask Synapse
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative" ref={historyRef}>
            <button
              onClick={() => setShowHistory(v => !v)}
              className="px-3 py-1.5 rounded-lg bg-surface-2 border border-hairline text-xs text-ink-subtle hover:text-ink hover:bg-surface-3 transition-all duration-150 cursor-pointer flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              History
            </button>
            {showHistory && (
              <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto rounded-lg border border-hairline bg-surface-1 shadow-xl z-50 p-2 space-y-1">
                {convIndex.length === 0 ? (
                  <p className="text-xs text-ink-tertiary text-center py-4">No past conversations</p>
                ) : (
                  convIndex.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => switchToConversation(conv.id)}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-surface-2 transition-colors duration-100 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-ink truncate">{conv.title}</p>
                          <p className="text-xs text-ink-tertiary mt-0.5">
                            {formatDate(conv.updatedAt)} · {conv.messageCount} msg{conv.messageCount > 1 ? "s" : ""}
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="ml-2 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-3 text-ink-tertiary hover:text-semantic-danger transition-all duration-100"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            onClick={newConversation}
            className="px-3 py-1.5 rounded-lg bg-surface-2 border border-hairline text-xs text-ink-subtle hover:text-ink hover:bg-surface-3 transition-all duration-150 cursor-pointer flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-8 py-6">
        {messages.length === 0 && !isProcessing && (
          <div className="h-full flex flex-col items-center justify-center gap-8">
            <EmptyState
              icon="chat"
              title="What do you want to know?"
              description="Ask about your knowledge graph. Try one of these:"
            />
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {promptChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSubmit(chip)}
                  className="px-4 py-2 rounded-pill bg-surface-2 border border-hairline text-sm text-ink-subtle hover:text-ink hover:bg-surface-3 transition-all duration-150 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="px-4 py-2.5 rounded-lg bg-surface-2 border border-hairline max-w-xl">
                  <p className="text-sm text-ink-muted">{msg.query}</p>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-surface-1 border border-hairline">
                <p className="text-sm text-ink leading-relaxed">{msg.answer}</p>
                {msg.diffCard && <DiffCardView diff={msg.diffCard} />}
                {msg.timeline && <TimelineView points={msg.timeline} />}
                {msg.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-2">
                    <span className="text-xs text-ink-tertiary">Sources:</span>
                    {msg.sources.map((s, i) => (
                      <SourcePill key={i} type={s.type} label={s.label} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="px-5 py-3 rounded-lg bg-surface-1 border border-hairline">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                  <span className="text-sm text-ink-tertiary ml-1">Synapse is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="shrink-0 px-4 md:px-8 py-4 border-t border-hairline pb-20 md:pb-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ask about your knowledge graph..."
            disabled={isProcessing}
            className="flex-1 px-4 py-3 rounded-lg bg-surface-1 border border-hairline text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors duration-150"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-3 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover disabled:opacity-40 transition-all duration-150 cursor-pointer"
          >
            {isProcessing ? "..." : "Ask"}
          </button>
        </div>
      </div>
    </div>
  );
}
