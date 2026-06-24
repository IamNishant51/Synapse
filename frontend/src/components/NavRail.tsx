"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIngestion } from "@/context/IngestionContext";

const navItems = [
  { href: "/graph", label: "Graph", icon: GraphIcon },
  { href: "/ingest", label: "Ingest", icon: IngestIcon },
  { href: "/resolve", label: "Resolve", icon: ResolveIcon },
  { href: "/ask", label: "Ask", icon: AskIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function NavRail() {
  const pathname = usePathname();
  const { jobStatus, progress } = useIngestion();

  return (
    <aside className="fixed bottom-0 md:top-0 left-0 z-40 flex w-full h-16 md:h-full md:w-60 flex-row md:flex-col bg-canvas border-t md:border-t-0 md:border-r border-hairline">
      <div className="hidden md:flex items-center gap-3 px-6 pt-6 pb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" />
            <circle cx="8" cy="8" r="2" fill="white" />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
          Synapse
        </span>
      </div>

      <nav className="flex flex-row md:flex-col w-full md:w-auto h-full md:h-auto gap-1 px-2 md:px-3 justify-around md:justify-start items-center md:items-stretch py-1 md:py-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const isIngest = item.label === "Ingest";
          const isSyncing = isIngest && jobStatus === "running";
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col md:flex-row items-center md:justify-between px-2 py-1.5 md:px-3 md:py-2.5 rounded-md text-[10px] md:text-sm transition-all duration-150 group flex-1 md:flex-none ${
                isActive
                  ? "text-primary md:bg-surface-2 md:text-ink md:border-l-2 md:border-primary"
                  : "text-ink-subtle hover:text-ink md:hover:bg-surface-2 border-t-2 md:border-t-0 md:border-l-2 border-transparent"
              }`}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 relative">
                <item.icon active={isActive} />
                <span className="mt-1 md:mt-0 font-medium md:font-normal">{item.label}</span>
                {isSyncing && (
                  <span className="absolute -top-1 -right-2 md:relative md:top-auto md:right-auto flex h-2 w-2 md:mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:block mt-auto px-6 pb-6">
        {jobStatus === "running" ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-2 border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-ink-muted">
              Syncing memory... <span className="text-[10px] text-ink-subtle">({progress}%)</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-2">
            <div className="w-2 h-2 rounded-full bg-semantic-success" />
            <span className="text-xs text-ink-subtle">Memory active</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function GraphIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="4" r="2.5" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" />
      <circle cx="4" cy="14" r="2.5" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2.5" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" />
      <line x1="7.5" y1="5.5" x2="5.5" y2="12.5" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.2" />
      <line x1="10.5" y1="5.5" x2="12.5" y2="12.5" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.2" />
      <line x1="6" y1="14" x2="12" y2="14" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.2" />
    </svg>
  );
}

function IngestIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2L9 16" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 9L16 9" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ResolveIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="6" height="14" rx="1.5" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" />
      <rect x="10" y="4" width="6" height="12" rx="1.5" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" />
    </svg>
  );
}

function AskIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5C4.5 1.5 1.5 4.5 1.5 9C1.5 13.5 4.5 16.5 9 16.5H16.5V9C16.5 4.5 13.5 1.5 9 1.5Z" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" />
      <path d="M9 12V12.01" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="2" strokeLinecap="round" />
      <path d="M6.5 7.5C6.5 6.12 7.62 5 9 5C10.38 5 11.5 6.12 11.5 7.5C11.5 8.5 10.8 9.2 10 9.5" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" />
      <path d="M9 1.5V3.5M9 14.5V16.5M3.5 9H1.5M16.5 9H14.5M5.05 5.05L3.63 3.63M14.37 14.37L12.95 12.95M12.95 5.05L14.37 3.63M3.63 14.37L5.05 12.95" stroke={active ? "#f7f8f8" : "#8a8f98"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
