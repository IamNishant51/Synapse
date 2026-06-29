"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";

function stripHashSync(html: string): string {
  const start = html.indexOf("// ── URL hash sync");
  if (start === -1) return html;
  const end = html.indexOf("function row(", start);
  if (end === -1) return html;
  return html.slice(0, start) + html.slice(end);
}

function injectDarkStyles(html: string, isDark: boolean): string {
  if (!isDark) return html;
  const style = `<style>
:root {
  color-scheme: dark;
  background-color: #0c0c0c !important;
  filter: invert(1) hue-rotate(180deg);
}
img, video, iframe, canvas, svg, [style*="background-image"] {
  filter: invert(1) hue-rotate(180deg);
}
</style>`;
  return html.replace("</head>", style + "</head>");
}

export default function ProvenancePage() {
  const { resolvedTheme } = useTheme();
  const [rawHtml, setRawHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    fetch("/api/proxy/provenance")
      .then((r) => r.text())
      .then(stripHashSync)
      .then(setRawHtml)
      .catch((e) => setError(e.message));
  }, []);

  const html = useMemo(
    () => (rawHtml ? injectDarkStyles(rawHtml, isDark) : null),
    [rawHtml, isDark]
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] md:h-screen p-8 text-center">
        <div className="p-4 rounded-full bg-semantic-error/10 mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-semantic-error">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-ink mb-1">Failed to load provenance</p>
        <p className="text-xs text-muted-soft max-w-xs">{error}</p>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] md:h-screen gap-4">
        <div className="relative w-8 h-8">
          <span className="absolute inset-0 rounded-full border-2 border-hairline" />
          <span className="absolute inset-0 rounded-full border-2 border-t-ink animate-spin" />
        </div>
        <p className="text-sm text-muted-soft">Loading provenance graph…</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] md:h-screen bg-canvas">
      <iframe
        ref={iframeRef}
        srcDoc={html}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        title="Memory Provenance"
        sandbox="allow-scripts"
      />
    </div>
  );
}
