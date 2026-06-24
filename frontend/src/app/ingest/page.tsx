"use client";

import { useState, useRef, useEffect } from "react";
import IngestionStepper from "@/components/IngestionStepper";
import { ingestSource } from "@/lib/api";
import type { SourceType } from "@/lib/types";
import { useIngestion } from "@/context/IngestionContext";

type Tab = "github" | "conversation" | "pdf" | "article" | "youtube";

export default function IngestPage() {
  const { jobStatus, currentStep, progress, error, startSync, resetSync } = useIngestion();

  const [activeTab, setActiveTab] = useState<Tab>("github");
  const [repoUrl, setRepoUrl] = useState("");
  const [pathFilter, setPathFilter] = useState("");
  const [conversationText, setConversationText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [articleUrl, setArticleUrl] = useState("");
  const [articleLabel, setArticleLabel] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeLabel, setYoutubeLabel] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPathFilter("");
    if (activeTab !== "conversation") setSourceLabel("");
    if (activeTab === "pdf") setPdfFiles([]);
  }, [activeTab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "github", label: "GitHub" },
    { key: "conversation", label: "Paste Conversation" },
    { key: "pdf", label: "Upload PDF" },
    { key: "article", label: "Article URL" },
    { key: "youtube", label: "YouTube URL" },
  ];

  const handleSync = async () => {
    setApiError(null);
    try {
      let sourceType: SourceType;
      let content: string;
      let label: string;
      let url: string | undefined;

      if (activeTab === "github") {
        if (!repoUrl) return;
        sourceType = "github";
        content = `Repository: ${repoUrl}\nPath filter: ${pathFilter || "all"}`;
        label = repoUrl.split("/").slice(-2).join("/");
        url = repoUrl;
      } else if (activeTab === "conversation") {
        if (!conversationText) return;
        sourceType = "conversation";
        content = conversationText;
        label = sourceLabel || `Conversation ${new Date().toLocaleDateString()}`;
        url = undefined;
      } else if (activeTab === "article") {
        if (!articleUrl) return;
        sourceType = "article";
        content = `Article URL: ${articleUrl}`;
        label = articleLabel || articleUrl.replace("https://", "").replace("http://", "").split("/")[0] || "Article URL";
        url = articleUrl;
      } else if (activeTab === "youtube") {
        if (!youtubeUrl) return;
        sourceType = "youtube";
        content = `YouTube URL: ${youtubeUrl}`;
        label = youtubeLabel || "YouTube Transcript";
        url = youtubeUrl;
      } else {
        if (pdfFiles.length === 0) return;
        const file = pdfFiles[0];
        const toBase64 = (f: File): Promise<string> =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
          });
        sourceType = "pdf";
        content = await toBase64(file);
        label = file.name;
        url = undefined;
      }

      const { jobId } = await ingestSource(sourceType, content, label, url, pathFilter);
      startSync(jobId);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Failed to start ingestion");
    }
  };

  const handleReset = () => {
    resetSync();
    setApiError(null);
    setRepoUrl("");
    setPathFilter("");
    setConversationText("");
    setSourceLabel("");
    setPdfFiles([]);
    setArticleUrl("");
    setArticleLabel("");
    setYoutubeUrl("");
    setYoutubeLabel("");
  };

  const handlePdfClick = () => {
    fileInputRef.current?.click();
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type === "application/pdf");
    if (files.length > 0) setPdfFiles(files);
    e.target.value = "";
  };

  const isDisabled = jobStatus === "running" || jobStatus === "completed";

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 md:pt-12 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
            Add Memory
          </h1>
          <p className="mt-1 text-sm text-ink-subtle">
            Feed Synapse a source — it will ingest, reconcile, and integrate it into your knowledge graph.
          </p>
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-1 p-1 rounded-lg bg-surface-2 w-full md:w-fit mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { if (!isDisabled) setActiveTab(tab.key); }}
              disabled={isDisabled}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-surface-1 text-ink border border-hairline"
                  : "text-ink-subtle hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "github" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-ink-muted mb-1.5">GitHub Repo URL</label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                disabled={isDisabled}
                className="w-full px-3.5 py-2.5 rounded-md bg-surface-1 border border-hairline text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-muted mb-1.5">Path filter (optional)</label>
              <input
                type="text"
                value={pathFilter}
                onChange={(e) => setPathFilter(e.target.value)}
                placeholder="e.g. /docs or *.md"
                disabled={isDisabled}
                className="w-full px-3.5 py-2.5 rounded-md bg-surface-1 border border-hairline text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
            {jobStatus === "completed" ? (
              <p className="text-xs text-semantic-success">Last synced: just now</p>
            ) : (
              <p className="text-xs text-ink-tertiary">Last synced: never</p>
            )}
          </div>
        )}

        {activeTab === "conversation" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-ink-muted mb-1.5">Source label</label>
              <input
                type="text"
                value={sourceLabel}
                onChange={(e) => setSourceLabel(e.target.value)}
                placeholder="e.g. ChatGPT — March refactor discussion"
                disabled={isDisabled}
                className="w-full px-3.5 py-2.5 rounded-md bg-surface-1 border border-hairline text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-muted mb-1.5">Paste conversation content</label>
              <textarea
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                placeholder="Paste a ChatGPT or Claude export, or any raw text..."
                rows={12}
                disabled={isDisabled}
                className="w-full px-3.5 py-2.5 rounded-md bg-surface-1 border border-hairline text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors duration-150 resize-none font-mono"
              />
            </div>
          </div>
        )}

        {activeTab === "pdf" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={handlePdfFileChange}
              className="hidden"
            />
            <div
              onClick={handlePdfClick}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-150 ${
                isDisabled ? "border-hairline opacity-50" : "border-hairline hover:border-primary cursor-pointer"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!isDisabled) setPdfFiles(Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf"));
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-3 opacity-50">
                <path d="M16 4V20M16 20L20 16M16 20L12 16" stroke="#8a8f98" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 20V26C4 27.1 4.9 28 6 28H26C27.1 28 28 27.1 28 26V20" stroke="#8a8f98" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-ink-muted">
                {pdfFiles.length > 0
                  ? `${pdfFiles.length} PDF${pdfFiles.length > 1 ? "s" : ""} selected`
                  : "Drop PDFs here or click to browse"}
              </p>
              {pdfFiles.length > 0 && (
                <div className="mt-3 space-y-1">
                  {pdfFiles.map((f, i) => (
                    <p key={i} className="text-xs text-ink-tertiary font-mono">{f.name}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "article" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-ink-muted mb-1.5">Article URL</label>
              <input
                type="url"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                placeholder="https://example.com/blog-post"
                disabled={isDisabled}
                className="w-full px-3.5 py-2.5 rounded-md bg-surface-1 border border-hairline text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-muted mb-1.5">Article Label (optional)</label>
              <input
                type="text"
                value={articleLabel}
                onChange={(e) => setArticleLabel(e.target.value)}
                placeholder="e.g. My Startup Roadmap"
                disabled={isDisabled}
                className="w-full px-3.5 py-2.5 rounded-md bg-surface-1 border border-hairline text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
          </div>
        )}

        {activeTab === "youtube" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-ink-muted mb-1.5">YouTube Video URL</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={isDisabled}
                className="w-full px-3.5 py-2.5 rounded-md bg-surface-1 border border-hairline text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-muted mb-1.5">Video Label (optional)</label>
              <input
                type="text"
                value={youtubeLabel}
                onChange={(e) => setYoutubeLabel(e.target.value)}
                placeholder="e.g. Supabase Keynote Transcript"
                disabled={isDisabled}
                className="w-full px-3.5 py-2.5 rounded-md bg-surface-1 border border-hairline text-ink text-sm placeholder:text-ink-tertiary focus:outline-none focus:border-primary transition-colors duration-150"
              />
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={jobStatus === "completed" ? handleReset : handleSync}
            disabled={isDisabled && jobStatus !== "completed"}
            className={`px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer ${
              jobStatus === "completed"
                ? "bg-surface-2 text-ink-muted border border-hairline"
                : "bg-primary text-on-primary hover:bg-primary-hover"
            }`}
          >
            {jobStatus === "idle" ? "Sync Now" : jobStatus === "running" ? "Syncing..." : "Done — Sync Another"}
          </button>
          {(apiError || error) && <span className="text-sm text-semantic-danger">{apiError || error}</span>}
        </div>

        {jobStatus !== "idle" && (
          <div className="mt-8 p-6 rounded-lg bg-surface-1 border border-hairline">
            <IngestionStepper currentStep={currentStep} progress={progress} status={jobStatus} />
          </div>
        )}
      </div>
    </div>
  );
}
