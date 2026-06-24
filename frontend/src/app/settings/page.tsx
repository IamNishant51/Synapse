"use client";

import { useState, useEffect, useCallback } from "react";
import { getDecaySettings, updateDecaySettings, runDecayCheck, getSources, searchNodes, forgetSource, forgetNode } from "@/lib/api";
import type { Source } from "@/lib/types";

export default function SettingsPage() {
  const [decayStart, setDecayStart] = useState(60);
  const [forgetThreshold, setForgetThreshold] = useState(180);
  const [searchQuery, setSearchQuery] = useState("");
  const [decayRunning, setDecayRunning] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [searchResults, setSearchResults] = useState<{ id: string; label: string; confidence: number; status: string }[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [decayResult, setDecayResult] = useState<{ forgotten: number; decayed: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [gitHubConnected, setGitHubConnected] = useState(false);

  useEffect(() => {
    setGitHubConnected(localStorage.getItem("github_connected") === "true");
  }, []);

  const handleConnectGitHub = () => {
    localStorage.setItem("github_connected", "true");
    setGitHubConnected(true);
  };

  const handleDisconnectGitHub = () => {
    localStorage.removeItem("github_connected");
    setGitHubConnected(false);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [settings, srcs] = await Promise.all([getDecaySettings(), getSources()]);
        setDecayStart(settings.decayStartDays);
        setForgetThreshold(settings.forgetThresholdDays);
        setSources(srcs);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchNodes(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleNodeSelection = (id: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDecayCheck = async () => {
    setDecayRunning(true);
    setDecayResult(null);
    try {
      const result = await runDecayCheck();
      setDecayResult(result);
    } catch {
      setDecayResult({ forgotten: 0, decayed: 0 });
    } finally {
      setDecayRunning(false);
    }
  };

  const handleDecayStartChange = async (val: number) => {
    setDecayStart(val);
    try {
      await updateDecaySettings({ decayStartDays: val, forgetThresholdDays: forgetThreshold });
    } catch {}
  };

  const handleForgetThresholdChange = async (val: number) => {
    setForgetThreshold(val);
    try {
      await updateDecaySettings({ decayStartDays: decayStart, forgetThresholdDays: val });
    } catch {}
  };

  const handleDeleteSource = useCallback(async (sourceId: string) => {
    try {
      await forgetSource(sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch {}
  }, []);

  const handleForgetSelected = useCallback(async () => {
    const ids = Array.from(selectedNodeIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => forgetNode(id)));
      setSelectedNodeIds(new Set());
      setSearchResults((prev) => prev.filter((r) => !ids.includes(r.id)));
    } catch {}
  }, [selectedNodeIds]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-24">
          <div className="mb-10">
            <div className="h-8 w-40 bg-surface-2 animate-pulse rounded-md mb-2" />
            <div className="h-4 w-80 max-w-full bg-surface-2 animate-pulse rounded-md" />
          </div>

          {[1, 2, 3].map(i => (
            <section key={i} className="mb-10">
              <div className="h-5 w-32 bg-surface-2 animate-pulse rounded-md mb-4" />
              <div className="p-6 rounded-lg bg-surface-1 border border-hairline space-y-6">
                <div className="h-4 w-full bg-surface-2 animate-pulse rounded-md" />
                <div className="h-4 w-3/4 bg-surface-2 animate-pulse rounded-md" />
                <div className="h-10 w-40 bg-surface-2 animate-pulse rounded-md mt-4" />
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-24">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
            Memory Health
          </h1>
          <p className="mt-1 text-sm text-ink-subtle">
            Control how Synapse manages confidence and decay across your knowledge graph.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-sm font-medium text-ink-muted mb-4">Decay Settings</h2>
          <div className="p-6 rounded-lg bg-surface-1 border border-hairline space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-ink-muted">Days until confidence declines</label>
                <span className="text-sm font-mono text-ink-subtle">{decayStart}</span>
              </div>
              <input
                type="range"
                min={7} max={365}
                value={decayStart}
                onChange={(e) => handleDecayStartChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full bg-surface-3 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-ink-tertiary">7 days</span>
                <span className="text-xs text-ink-tertiary">365 days</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-ink-muted">Days until fully forgotten</label>
                <span className="text-sm font-mono text-ink-subtle">{forgetThreshold}</span>
              </div>
              <input
                type="range"
                min={30} max={730}
                value={forgetThreshold}
                onChange={(e) => handleForgetThresholdChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full bg-surface-3 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-semantic-danger"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-ink-tertiary">30 days</span>
                <span className="text-xs text-ink-tertiary">730 days</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <button
                onClick={handleDecayCheck}
                disabled={decayRunning}
                className="px-5 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-all duration-150 cursor-pointer"
              >
                {decayRunning ? "Running decay check..." : "Run decay check now"}
              </button>
              {decayResult && (
                <span className="text-xs text-ink-tertiary">
                  {decayResult.decayed} nodes decayed, {decayResult.forgotten} forgotten
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-medium text-ink-muted mb-4">Manual Forget</h2>
          <div className="p-6 rounded-lg bg-surface-1 border border-hairline space-y-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedNodeIds(new Set()); }}
              placeholder="Search topic to forget..."
              className="w-full px-3.5 py-2.5 rounded-md bg-surface-2 border border-hairline text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors"
            />

            <div className="space-y-1">
              {searchResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNodeIds.has(result.id)}
                      onChange={() => toggleNodeSelection(result.id)}
                      className="rounded border-hairline bg-surface-3 accent-primary"
                    />
                    <span className="text-sm text-ink-muted">{result.label}</span>
                  </div>
                  <span className="text-xs font-mono text-ink-tertiary">conf. {Math.round(result.confidence * 100)}%</span>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-ink-tertiary px-1 py-1">No matching nodes found</p>
              )}
            </div>

            <button
              onClick={handleForgetSelected}
              disabled={selectedNodeIds.size === 0}
              className="px-5 py-2 rounded-md bg-semantic-danger/10 text-semantic-danger text-sm font-medium hover:bg-semantic-danger/20 disabled:opacity-30 transition-all duration-150 cursor-pointer"
            >
              Forget selected ({selectedNodeIds.size})
            </button>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-medium text-ink-muted mb-4">Sources</h2>
          <div className="rounded-lg bg-surface-1 border border-hairline divide-y divide-hairline">
            {sources.length === 0 && (
              <div className="px-5 py-5 text-sm text-ink-tertiary">No sources ingested yet.</div>
            )}
            {sources.map((source) => (
              <div key={source.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 md:px-5 py-3.5">
                <div className="flex items-start sm:items-center gap-3">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="#8a8f98" strokeWidth="1.2" />
                    <path d="M4 7H10" stroke="#8a8f98" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <div>
                    <span className="text-sm text-ink-muted">{source.label}</span>
                    <span className="text-xs text-ink-tertiary ml-2">{source.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-xs font-medium ${
                    source.status === "ready"
                      ? "bg-semantic-success/10 text-semantic-success"
                      : source.status === "processing"
                        ? "bg-primary/10 text-primary"
                        : "bg-semantic-danger/10 text-semantic-danger"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      source.status === "ready"
                        ? "bg-semantic-success"
                        : source.status === "processing"
                          ? "bg-primary animate-pulse"
                          : "bg-semantic-danger"
                    }`} />
                    {source.status === "processing" ? "processing..." : source.status}
                  </span>
                  <span className="text-xs text-ink-tertiary">{source.ingestedAt}</span>
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="text-xs text-semantic-danger hover:text-semantic-danger/80 transition-colors duration-150 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-ink-muted mb-4">Connected Accounts</h2>
          <div className="p-4 md:p-5 rounded-lg bg-surface-1 border border-hairline">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1C3.68 1 1 3.68 1 7C1 9.85 2.88 12.25 5.47 13.06C5.78 13.12 5.9 12.94 5.9 12.78C5.9 12.64 5.89 12.17 5.89 11.56C4.45 11.88 3.99 11.02 3.99 11.02C3.66 10.19 3.17 10.02 3.17 10.02C2.49 9.68 3.23 9.69 3.23 9.69C3.99 9.75 4.38 10.48 4.38 10.48C5.04 11.62 6.11 11.37 6.56 11.22C6.63 10.73 6.82 10.39 7.04 10.19C5.39 10.02 3.65 9.47 3.65 7.04C3.65 6.35 3.9 5.77 4.34 5.33C4.26 5.16 4.04 4.49 4.42 3.6C4.42 3.6 4.97 3.42 5.9 4.25C6.42 4.1 6.97 4.02 7.5 4.02C8.03 4.02 8.58 4.1 9.1 4.25C10.03 3.42 10.58 3.6 10.58 3.6C10.96 4.49 10.74 5.16 10.66 5.33C11.1 5.77 11.35 6.35 11.35 7.04C11.35 9.48 9.6 10.01 7.95 10.18C8.22 10.42 8.46 10.89 8.46 11.62C8.46 12.66 8.45 13.5 8.45 13.78C8.45 13.94 8.57 14.13 8.88 14.06C11.47 13.25 13.35 10.85 13.35 8C13.35 5.22 11.13 3 8.35 3L7 3.01Z" fill="#8a8f98" />
                </svg>
                <span className="text-sm text-ink-muted">GitHub</span>
              </div>
              {gitHubConnected ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-semantic-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                    Connected
                  </span>
                  <button
                    onClick={handleDisconnectGitHub}
                    className="text-xs text-ink-tertiary hover:text-ink hover:underline transition-all duration-150 cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-subtle flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-tertiary" />
                    Not Connected
                  </span>
                  <button
                    onClick={handleConnectGitHub}
                    className="text-xs text-primary hover:text-primary-hover hover:underline transition-all duration-150 cursor-pointer font-medium"
                  >
                    Connect
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
