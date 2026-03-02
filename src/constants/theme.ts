// src/constants/theme.ts

/**
 * YourNextAway Theme (V2 — Premium Sporty Dark, 2026)
 *
 * Design system rules:
 * - Dark theme only
 * - Strict spacing, radius, and type scales
 * - Surfaces are matte; blur/glass is for overlays only
 *
 * Palette (locked):
 * - Dark grey: #171A17
 * - Green:     #57A238
 * - Blue:      #0B2555
 * - Gold:      EU flag gold (here: #F2C94C)
 *
 * NOTE:
 * We KEEP backwards-compatible aliases to avoid breaking older screens
 * while we migrate them to V2 primitives.
 */

export const theme = {
  colors: {
    // ---------------------------
    // Core surfaces (V2)
    // ---------------------------
    bgBase: "#0E1110", // app background
    bgSurface: "#171A17", // primary surface
    bgElevated: "#1F241F", // elevated card surface
    bgPressed: "#242A24", // pressed state / subtle highlight

    // Overlays
    overlay: "rgba(12,14,12,0.78)",
    overlayStrong: "rgba(10,12,10,0.88)",
    overlayLight: "rgba(12,14,12,0.62)",

    // ---------------------------
    // Text (V2)
    // ---------------------------
    textPrimary: "#E7ECE7",
    textSecondary: "#A3ADA3",
    textMuted: "#6B736B",

    // ---------------------------
    // Brand (V2)
    // ---------------------------
    accentGreen: "#57A238",
    accentBlue: "#0B2555",
    accentGold: "#F2C94C",

    // ---------------------------
    // Semantic status (V2)
    // ---------------------------
    success: "#57A238",
    info: "#0B2555",
    warning: "#F2C94C",
    error: "#D64545",

    // ---------------------------
    // Lines
    // ---------------------------
    borderSubtle: "rgba(231,236,231,0.06)",
    dividerSubtle: "rgba(231,236,231,0.06)",

    // ---------------------------
    // Backwards-compatible aliases (V1 usage)
    // ---------------------------
    background: "#0E1110",
    backgroundSecondary: "#171A17",

    text: "#E7ECE7",

    // Older screens use textTertiary for "muted" helper copy
    textTertiary: "#6B736B",

    primary: "#57A238",
    primaryDark: "rgba(87,162,56,0.78)",
    primaryLight: "rgba(87,162,56,0.95)",

    accent: "#0B2555",

    border: "rgba(231,236,231,0.06)",
    divider: "rgba(231,236,231,0.06)",
  },

  /**
   * Legacy "glass" tokens.
   * V2 intent: don’t use these for normal cards. Keep only so old screens don’t crash.
   */
  glass: {
    border: "rgba(231,236,231,0.10)",
    iosBg: {
      subtle: "rgba(255,255,255,0.04)",
      default: "rgba(255,255,255,0.06)",
      strong: "rgba(255,255,255,0.08)",
    },
    androidBg: {
      subtle: "rgba(0,0,0,0.18)",
      default: "rgba(0,0,0,0.22)",
      strong: "rgba(0,0,0,0.26)",
    },
  },

  // ---------------------------
  // Strict layout scales (V2)
  // ---------------------------
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  borderRadius: {
    button: 14,
    input: 14,
    card: 18,
    sheet: 24,
    pill: 9999,

    // Backwards-compatible keys
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  fontSize: {
    hero: 30,
    h1: 24,
    h2: 20,
    body: 16,
    meta: 14,
    tiny: 12,

    // Backwards-compatible keys
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    black: "900" as const,
  },
};

export type Theme = typeof theme;
