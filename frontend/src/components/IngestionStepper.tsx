"use client";

import type { IngestionStep } from "@/lib/types";

const steps: { key: IngestionStep; label: string }[] = [
  { key: "fetching", label: "Fetching" },
  { key: "extracting", label: "Extracting" },
  { key: "remember", label: "remember()" },
  { key: "improve", label: "improve()" },
];

interface IngestionStepperProps {
  currentStep: IngestionStep;
  progress: number;
  status: "running" | "completed" | "failed";
}

export default function IngestionStepper({ currentStep, progress, status }: IngestionStepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isCompleted = status === "completed" || i < currentIndex;
          const isActive = i === currentIndex && status === "running";
          const isFailed = status === "failed" && i === currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-all duration-300 ${
                    isCompleted
                      ? "bg-semantic-success text-white"
                      : isFailed
                        ? "bg-semantic-danger text-white"
                        : isActive
                          ? "bg-primary text-on-primary"
                          : "bg-surface-3 text-ink-tertiary"
                  }`}
                >
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isFailed ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 3L9 9M9 3L3 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-xs ${
                    isCompleted || isActive ? "text-ink-muted" : "text-ink-tertiary"
                  }`}
                  style={{ fontFamily: step.key === "remember" || step.key === "improve" ? "Geist Mono, monospace" : undefined }}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 ${
                    i < currentIndex || status === "completed" ? "bg-semantic-success" : "bg-hairline"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {status === "running" && (
        <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {status === "failed" && (
        <p className="text-xs text-semantic-danger">Ingestion failed. Check the source and try again.</p>
      )}

      {status === "completed" && (
        <p className="text-xs text-semantic-success flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#27a644" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ingestion complete — memory updated
        </p>
      )}
    </div>
  );
}
