"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        // Force a hard refresh to bypass middleware cache and load protected routes properly
        window.location.href = "/graph";
      } else {
        setError(data.error || "Incorrect access key");
      }
    } catch (err) {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4 selection:bg-primary/30">
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-surface-1 p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full border border-hairline flex items-center justify-center bg-surface-2 mb-4 relative">
            <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(39,166,68,0.5)]"></div>
          </div>
          <h1 className="text-xl font-medium tracking-tight text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
            Synapse
          </h1>
          <p className="mt-1 text-sm text-ink-subtle">Enter your access key to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Access Key"
              className="w-full px-4 py-2.5 rounded-md bg-surface-2 border border-hairline text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all duration-200"
              autoFocus
            />
          </div>
          
          {error && <p className="text-xs text-semantic-danger font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-2.5 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? "Authenticating..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
