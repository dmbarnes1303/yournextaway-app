// src/constants/theme.ts

/**
 * YourNextAway Theme (V2 — Premium Sporty Dark, 2026)
 *
 * Design system rules:
 * - Dark theme only
 * - Strict spacing, radius, and type scales
 * - Surfaces are matte; blur/glass is for overlays only
 * - Backgrounds should feel premium and restrained, never illustrative
 */

export const theme = {
  colors: {
    // ---------------------------
    // Core surfaces (V2)
    // ---------------------------
    bgBase: "#0A0D0E",
    bgSurface: "#151917",
    bgElevated: "#1B201D",
    bgPressed: "#232926",

    // Overlays
    overlay: "rgba(8,10,11,0.72)",
    overlayStrong: "rgba(6,8,9,0.84)",
    overlayLight: "rgba(10,12,13,0.56)",

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

    // Branded dark tints for premium backgrounds
    tintGreenDeep: "#102116",
    tintGreenSoft: "#183021",
    tintBlueDeep: "#0A1831",
    tintBlueSoft: "#102545",
    tintNeutralDeep: "#111515",
    tintNeutralSoft: "#1A1F1D",

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
    // Backwards-compatible aliases
    // ---------------------------
    background: "#0A0D0E",
    backgroundSecondary: "#151917",

    text: "#E7ECE7",
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
   * Keep these for backwards compatibility.
   * The visual goal is restrained matte translucency, not flashy blur.
   */
  glass: {
    border: "rgba(231,236,231,0.10)",
    iosBg: {
      subtle: "rgba(255,255,255,0.04)",
      default: "rgba(255,255,255,0.055)",
      strong: "rgba(255,255,255,0.075)",
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
