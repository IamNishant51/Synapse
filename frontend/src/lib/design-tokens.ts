export const tokens = {
  colors: {
    primary: "#5e6ad2",
    "on-primary": "#ffffff",
    "primary-hover": "#828fff",
    "primary-focus": "#5e69d1",
    ink: "#f7f8f8",
    "ink-muted": "#d0d6e0",
    "ink-subtle": "#8a8f98",
    "ink-tertiary": "#62666d",
    canvas: "#010102",
    "surface-1": "#0f1011",
    "surface-2": "#141516",
    "surface-3": "#18191a",
    "surface-4": "#191a1b",
    hairline: "#23252a",
    "hairline-strong": "#34343a",
    "hairline-tertiary": "#3e3e44",
    "confidence-fresh": "#5e6ad2",
    "confidence-fading": "#7a7fad",
    "confidence-stale": "#3e3e44",
    "conflict-warning": "#e0a328",
    "semantic-success": "#27a644",
    "semantic-danger": "#e5484d",
  },
  typography: {
    "display-md": { size: "40px", weight: 600, lineHeight: 1.15, tracking: "-1.0px" },
    headline: { size: "28px", weight: 600, lineHeight: 1.2, tracking: "-0.6px" },
    "card-title": { size: "22px", weight: 500, lineHeight: 1.25, tracking: "-0.4px" },
    subhead: { size: "20px", weight: 400, lineHeight: 1.4, tracking: "-0.2px" },
    "body-lg": { size: "18px", weight: 400, lineHeight: 1.5, tracking: "-0.1px" },
    body: { size: "16px", weight: 400, lineHeight: 1.5, tracking: "-0.05px" },
    "body-sm": { size: "14px", weight: 400, lineHeight: 1.5, tracking: "0" },
    caption: { size: "12px", weight: 400, lineHeight: 1.4, tracking: "0" },
    button: { size: "14px", weight: 500, lineHeight: 1.2, tracking: "0" },
    mono: { size: "13px", weight: 400, lineHeight: 1.5, tracking: "0" },
  },
  rounded: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    pill: "9999px",
  },
} as const;

export type ConfidenceLevel = "fresh" | "fading" | "stale" | "forgotten";

export function getConfidenceColor(score: number): ConfidenceLevel {
  if (score >= 0.8) return "fresh";
  if (score >= 0.4) return "fading";
  if (score >= 0.1) return "stale";
  return "forgotten";
}

export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}
