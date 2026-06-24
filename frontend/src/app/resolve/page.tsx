"use client";

import { useState, useEffect } from "react";
import EmptyState from "@/components/EmptyState";
import { getConflictEvents, resolveConflict } from "@/lib/api";
import type { ConflictEvent } from "@/lib/types";

export default function ResolvePage() {
  const [conflicts, setConflicts] = useState<ConflictEvent[]>([]);
  const [resolved, setResolved] = useState<ConflictEvent[]>([]);
  const [noteForId, setNoteForId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const events = await getConflictEvents();
        setConflicts(events.filter((c) => c.status === "pending"));
        setResolved(events.filter((c) => c.status !== "pending"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load conflicts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleResolve = async (id: string, resolution: "keep_old" | "keep_new" | "keep_both") => {
    setResolving(id);
    const note = resolution === "keep_both" ? noteText : undefined;
    try {
      await resolveConflict(id, resolution, note);
      const conflict = conflicts.find((c) => c.id === id);
      if (conflict) {
        const resolvedStatus = `resolved_${resolution}` as ConflictEvent["status"];
        setConflicts((prev) => prev.filter((c) => c.id !== id));
        setResolved((prev) => [{ ...conflict, status: resolvedStatus, resolutionNote: note || null }, ...prev]);
      }
      setNoteForId(null);
      setNoteText("");
    } catch (e) {
      console.error("Failed to resolve:", e);
    } finally {
      setResolving(null);
    }
  };

  const openNote = (id: string) => {
    setNoteForId(id);
    setNoteText("");
  };

  const pendingCount = conflicts.length;

  if (loading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="h-8 w-48 bg-surface-2 animate-pulse rounded-md mb-2" />
              <div className="h-4 w-72 bg-surface-2 animate-pulse rounded-md" />
            </div>
            <div className="h-8 w-24 bg-surface-2 animate-pulse rounded-pill hidden sm:block" />
          </div>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="rounded-lg bg-surface-1 border border-hairline overflow-hidden">
                <div className="h-1 bg-surface-2" />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 rounded-full bg-surface-2 animate-pulse" />
                    <div className="h-4 w-48 bg-surface-2 animate-pulse rounded-md" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div className="p-4 rounded-md bg-surface-2 animate-pulse h-28" />
                    <div className="p-4 rounded-md bg-surface-2 animate-pulse h-28" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-24 bg-surface-2 animate-pulse rounded-md" />
                    <div className="h-8 w-24 bg-surface-2 animate-pulse rounded-md" />
                    <div className="h-8 w-24 bg-surface-2 animate-pulse rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState icon="inbox" title="Could not load conflicts" description={error} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
              What Changed
            </h1>
            <p className="mt-1 text-sm text-ink-subtle">
              Synapse detected changes in your knowledge that need your judgment.
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-conflict-warning/10 border border-conflict-warning/20">
              <span className="w-2 h-2 rounded-full bg-conflict-warning" />
              <span className="text-sm font-medium text-conflict-warning">{pendingCount} unresolved</span>
            </div>
          )}
        </div>

        {pendingCount === 0 && resolved.length === 0 && (
          <EmptyState
            icon="inbox"
            title="No contradictions right now"
            description="Synapse is watching. When new information conflicts with existing knowledge, it will appear here for your judgment."
          />
        )}

        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="rounded-lg bg-surface-1 border border-hairline overflow-hidden">
              <div className="h-1 bg-conflict-warning" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#e0a328" strokeWidth="1.5" />
                    <path d="M8 4.5V8.5M8 11V11.01" stroke="#e0a328" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm font-medium text-ink">
                    Conflict detected — &ldquo;{conflict.topic}&rdquo;
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="p-4 rounded-md bg-surface-2">
                    <span className="text-xs text-ink-tertiary uppercase tracking-wider">Old</span>
                    <p className="mt-1.5 text-xs text-ink-subtle">
                      {conflict.oldNodeDate} &middot; {conflict.oldNodeSource}
                    </p>
                    <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                      &ldquo;{conflict.oldNodeSummary}&rdquo;
                    </p>
                  </div>
                  <div className="p-4 rounded-md bg-surface-2 border border-primary/20">
                    <span className="text-xs text-primary uppercase tracking-wider">New</span>
                    <p className="mt-1.5 text-xs text-ink-subtle">
                      {conflict.newNodeDate} &middot; {conflict.newNodeSource}
                    </p>
                    <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                      &ldquo;{conflict.newNodeSummary}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleResolve(conflict.id, "keep_old")}
                    disabled={resolving === conflict.id}
                    className="px-4 py-1.5 rounded-md border border-hairline text-sm text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors duration-150 cursor-pointer disabled:opacity-40"
                  >
                    Keep Old
                  </button>
                  <button
                    onClick={() => handleResolve(conflict.id, "keep_new")}
                    disabled={resolving === conflict.id}
                    className="px-4 py-1.5 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors duration-150 cursor-pointer disabled:opacity-40"
                  >
                    Keep New
                  </button>
                  <button
                    onClick={() => openNote(conflict.id)}
                    className="px-4 py-1.5 rounded-md border border-hairline text-sm text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors duration-150 cursor-pointer"
                  >
                    Keep Both
                  </button>
                </div>

                {noteForId === conflict.id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note (e.g. Postgres for Project A, Supabase for Project B)"
                      className="flex-1 px-3 py-2 rounded-md bg-surface-2 border border-hairline text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleResolve(conflict.id, "keep_both");
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleResolve(conflict.id, "keep_both")}
                      disabled={resolving === conflict.id}
                      className="px-3 py-2 rounded-md bg-primary text-on-primary text-xs font-medium hover:bg-primary-hover disabled:opacity-40 transition-all duration-150 cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {resolved.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-medium text-ink-muted">Resolved History</h2>
              <span className="text-xs text-ink-tertiary">({resolved.length} entries)</span>
            </div>
            <div className="space-y-1">
              {resolved.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-2.5 rounded-md bg-surface-1 border border-hairline">
                  <div className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                    <span className="text-sm text-ink-muted">{entry.topic}</span>
                    <span className="text-xs text-ink-tertiary">
                      {entry.status === "resolved_keep_new" ? "→ Kept new" : entry.status === "resolved_keep_old" ? "→ Kept old" : "→ Kept both"}
                    </span>
                  </div>
                  <span className="text-xs text-ink-tertiary">{entry.newNodeDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
