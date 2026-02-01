// src/constants/theme.ts

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

  glass: {
    border: "rgba(255,255,255,0.08)",

    blur: {
      subtle: 14,
      default: 20,
      strong: 28,
    },

    // ↓ More transparent than before (lets background breathe)
    iosBg: {
      subtle: "rgba(22,25,29,0.42)",
      default: "rgba(22,25,29,0.56)",
      strong: "rgba(30,34,39,0.60)",
    },

    // Android: still stronger than iOS (no blur), but less opaque than before
    androidBg: {
      subtle: "rgba(22,25,29,0.56)",
      default: "rgba(22,25,29,0.72)",
      strong: "rgba(30,34,39,0.78)",
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
