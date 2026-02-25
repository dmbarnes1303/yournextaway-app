/**
 * YourNextAway Theme (V1 - Luxury Hospitality x Tech, Dark-Only)
 *
 * Locked brand palette:
 * - Primary green: #4B9E39
 * - EU blue:       #0D2D67
 * - Gold:          #E2B919
 *
 * This revision:
 * - Keeps your existing surface + text system
 * - Updates accents to the locked palette
 * - Keeps backwards-compatible aliases (primary/accent/etc.)
 * - Avoids duplicate keys in colors (you had textSecondary/textTertiary twice)
 */

export const theme = {
  colors: {
    // Base surfaces
    bgBase: "#0F1113",
    bgSurface: "#16191D",
    bgElevated: "#1E2227",

    // Text
    textPrimary: "#F2F4F6",
    textSecondary: "rgba(242,244,246,0.72)",
    textTertiary: "rgba(242,244,246,0.45)",

    // Brand accents (LOCKED)
    accentGreen: "#4B9E39",
    accentBlue: "#0D2D67",
    accentGold: "#E2B919",

    // Status
    warning: "#FFB800",
    error: "#FF5A6A",
    success: "#4B9E39",

    // Lines
    borderSubtle: "rgba(255,255,255,0.06)",
    dividerSubtle: "rgba(255,255,255,0.06)",

    // Backwards compatible aliases (keep existing app usage stable)
    background: "#0F1113",
    backgroundSecondary: "#16191D",

    text: "#F2F4F6",

    primary: "#4B9E39",
    primaryDark: "rgba(75,158,57,0.75)",
    primaryLight: "rgba(75,158,57,0.95)",

    accent: "#0D2D67",

    border: "rgba(255,255,255,0.06)",
    divider: "rgba(255,255,255,0.06)",

    overlay: "rgba(0,0,0,0.82)",
    overlayLight: "rgba(0,0,0,0.62)",
  },

  glass: {
    // slightly softer than before
    border: "rgba(255,255,255,0.065)",

    blur: {
      subtle: 14,
      default: 20,
      strong: 28,
    },

    // iOS/web (blur exists, so lighter tint works)
    iosBg: {
      subtle: "rgba(22,25,29,0.42)",
      default: "rgba(22,25,29,0.56)",
      strong: "rgba(30,34,39,0.62)",
    },

    // Android (no blur, so keep a bit stronger)
    androidBg: {
      subtle: "rgba(22,25,29,0.56)",
      default: "rgba(22,25,29,0.72)",
      strong: "rgba(30,34,39,0.80)",
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  fontSize: {
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

