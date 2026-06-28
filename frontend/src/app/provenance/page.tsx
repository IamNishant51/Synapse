"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function ProvenancePage() {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch("/api/proxy/provenance")
      .then((r) => r.text())
      .then(setHtml)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] md:h-screen text-muted-soft text-sm p-8 text-center">
        Failed to load provenance: {error}
      </div>
    );
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] md:h-screen text-muted-soft text-sm">
        Loading provenance…
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] md:h-screen">
      <Link
        href="/graph"
        className="fixed top-4 left-[60px] md:left-[236px] z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-hairline text-xs font-medium text-muted hover:text-ink shadow-sm hover:shadow transition-all"
      >
        &larr; Back
      </Link>
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
