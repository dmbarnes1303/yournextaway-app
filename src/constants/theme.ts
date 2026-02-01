// src/constants/theme.ts

/**
 * YourNextAway Theme (V1 - Luxury Hospitality x Tech, Dark-Only)
 *
 * Tweaks in this revision:
 * - Glass surfaces slightly MORE transparent globally
 * - Keeps readability by maintaining near-black tint
 */

export const theme = {
  colors: {
    bgBase: "#0F1113",
    bgSurface: "#16191D",
    bgElevated: "#1E2227",

    textPrimary: "#F2F4F6",
    textSecondary: "rgba(242,244,246,0.72)",
    textTertiary: "rgba(242,244,246,0.45)",

    accentGreen: "#4FE08A",
    accentBlue: "#2F6BFF",
    accentGold: "rgba(214,181,106,0.70)",

    warning: "#FFB800",
    error: "#FF5A6A",

    borderSubtle: "rgba(255,255,255,0.06)",
    dividerSubtle: "rgba(255,255,255,0.06)",

    // Backwards compatible aliases
    background: "#0F1113",
    backgroundSecondary: "#16191D",

    text: "#F2F4F6",
    textSecondary: "rgba(242,244,246,0.72)",
    textTertiary: "rgba(242,244,246,0.45)",

    primary: "#4FE08A",
    primaryDark: "rgba(79,224,138,0.75)",
    primaryLight: "rgba(79,224,138,0.95)",

    accent: "#2F6BFF",

    success: "#4FE08A",

    border: "rgba(255,255,255,0.06)",
    divider: "rgba(255,255,255,0.06)",

    overlay: "rgba(0,0,0,0.82)",
    overlayLight: "rgba(0,0,0,0.62)",
  },

  /**
   * Glass system (single source of truth)
   *
   * Change: slightly lower alpha values so background shows through more,
   * without losing the “luxury dark panel” feel.
   */
  glass: {
    border: "rgba(255,255,255,0.07)",

    blur: {
      subtle: 14,
      default: 20,
      strong: 28,
    },

    // iOS/web: blur + translucent surface tint (MORE transparent)
    iosBg: {
      subtle: "rgba(22,25,29,0.48)",
      default: "rgba(22,25,29,0.62)",
      strong: "rgba(30,34,39,0.68)",
    },

    // Android: no blur, so still stronger than iOS (but slightly more transparent)
    androidBg: {
      subtle: "rgba(22,25,29,0.62)",
      default: "rgba(22,25,29,0.78)",
      strong: "rgba(30,34,39,0.84)",
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
