"use client";

interface EmptyStateProps {
  icon?: "graph" | "inbox" | "chat" | "settings" | "search";
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

const iconPaths: Record<string, React.ReactNode> = {
  graph: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="10" r="6" stroke="#3e3e44" strokeWidth="2" />
      <circle cx="10" cy="38" r="6" stroke="#3e3e44" strokeWidth="2" />
      <circle cx="38" cy="38" r="6" stroke="#3e3e44" strokeWidth="2" />
      <line x1="19.5" y1="14.5" x2="14.5" y2="32.5" stroke="#23252a" strokeWidth="2" />
      <line x1="28.5" y1="14.5" x2="33.5" y2="32.5" stroke="#23252a" strokeWidth="2" />
      <line x1="14" y1="38" x2="32" y2="38" stroke="#23252a" strokeWidth="2" />
    </svg>
  ),
  inbox: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="6" width="36" height="36" rx="4" stroke="#3e3e44" strokeWidth="2" />
      <path d="M6 28H16L20 34H28L32 28H42" stroke="#3e3e44" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  chat: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M24 6C12 6 4 14 4 24C4 34 12 42 24 42H44V24C44 14 36 6 24 6Z" stroke="#3e3e44" strokeWidth="2" />
      <circle cx="18" cy="24" r="2" fill="#3e3e44" />
      <circle cx="24" cy="24" r="2" fill="#3e3e44" />
      <circle cx="30" cy="24" r="2" fill="#3e3e44" />
    </svg>
  ),
  search: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="22" cy="22" r="12" stroke="#3e3e44" strokeWidth="2" />
      <path d="M31 31L40 40" stroke="#3e3e44" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="6" stroke="#3e3e44" strokeWidth="2" />
      <path d="M24 4V8M24 40V44M8 24H4M44 24H40M13.5 13.5L10.5 10.5M37.5 37.5L34.5 34.5M34.5 13.5L37.5 10.5M10.5 37.5L13.5 34.5" stroke="#3e3e44" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

export default function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="opacity-50">{iconPaths[icon]}</div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-muted">{title}</h2>
        <p className="text-sm text-ink-subtle leading-relaxed max-w-sm">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors duration-150 cursor-pointer"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
