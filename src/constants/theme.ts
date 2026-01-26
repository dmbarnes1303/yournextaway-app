// src/constants/theme.ts
export const theme = {
  colors: {
    // Brand base: neutral near-black (no navy bias)
    background: "#07090D",
    backgroundSecondary: "#0C0F14",

    text: "#FFFFFF",
    // Neutral greys (not blue slates)
    textSecondary: "#A7ADB8",
    textTertiary: "#6E7583",

    // Brand primary: neon green
    primary: "#00FF88",
    primaryDark: "#00CC6E",
    primaryLight: "#33FFA3",

    // Subtle EU accents (do NOT overuse)
    accent: "#1E4FD9",
    warning: "#FFB800",
    error: "#FF3B5C",
    success: "#00FF88",

    // Borders/dividers: neutral charcoal
    border: "#1B1F27",
    divider: "#141821",

    // Overlay: neutral black
    overlay: "rgba(0, 0, 0, 0.82)",
    overlayLight: "rgba(0, 0, 0, 0.62)",

    /**
     * Base overlay color (used by Background + other overlays),
     * opacity handled separately for flexibility.
     */
    overlayBase: "#000000",
  },

  /**
   * Single source of truth for glass styling.
   * Use these via GlassCard (strength) rather than ad-hoc RGBA everywhere.
   */
  glass: {
    border: "rgba(255,255,255,0.10)",

    // Blur strength levels for iOS/web
    blur: {
      subtle: 14,
      default: 20,
      strong: 26,
    },

    // Background fills (iOS/web: blur exists so lighter; Android: no blur so stronger)
    iosBg: {
      subtle: "rgba(0,0,0,0.28)",
      default: "rgba(0,0,0,0.38)",
      strong: "rgba(0,0,0,0.46)",
    },

    androidBg: {
      subtle: "rgba(0,0,0,0.42)",
      default: "rgba(0,0,0,0.52)",
      strong: "rgba(0,0,0,0.60)",
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
