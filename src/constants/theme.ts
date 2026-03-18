// src/constants/theme.ts

/**
 * YourNextAway Theme (V3 — Emerald / Gold Premium Travel Sport, 2026)
 *
 * Design system rules:
 * - Dark-first product shell
 * - Premium football-travel identity aligned to the new logo
 * - Emerald is the primary action colour
 * - Gold is the premium / highlight / occasion colour
 * - Blue is removed from the core brand system
 * - Surfaces should feel rich, sharp and controlled — not generic glass
 * - Matte dark foundations, with selective glow and badge accents
 */

export const theme = {
  colors: {
    // ------------------------------------------------------------------
    // Core backgrounds
    // ------------------------------------------------------------------
    bgBase: "#050505",
    bgSurface: "#0B0F14",
    bgElevated: "#11161C",
    bgPressed: "#171D24",

    // Section / branded dark tints
    bgBrandDeep: "#07110B",
    bgBrandElevated: "#0D1811",
    bgGoldDeep: "#171308",

    // Overlays
    overlay: "rgba(5,7,8,0.72)",
    overlayStrong: "rgba(4,5,6,0.84)",
    overlayLight: "rgba(9,11,12,0.56)",

    // ------------------------------------------------------------------
    // Text
    // ------------------------------------------------------------------
    textPrimary: "#F5F7F6",
    textSecondary: "#B7C0B8",
    textMuted: "#7C867D",
    textOnBrand: "#041008",
    textOnGold: "#171308",

    // ------------------------------------------------------------------
    // Brand
    // ------------------------------------------------------------------
    accentGreen: "#22C55E",
    accentGreenStrong: "#16A34A",
    accentGreenSoft: "#86EFAC",

    accentGold: "#FACC15",
    accentGoldStrong: "#EAB308",
    accentGoldSoft: "#FDE68A",

    accentNeutral: "#D9E1DA",

    // Branded tints
    tintGreenDeep: "#0B1D12",
    tintGreenSoft: "#153222",
    tintGoldDeep: "#221A07",
    tintGoldSoft: "#3A2C0B",
    tintNeutralDeep: "#0F1311",
    tintNeutralSoft: "#1A211C",

    // ------------------------------------------------------------------
    // Semantic
    // ------------------------------------------------------------------
    success: "#22C55E",
    info: "#38BDF8",
    warning: "#FACC15",
    error: "#E05252",

    // ------------------------------------------------------------------
    // Borders / dividers
    // ------------------------------------------------------------------
    borderSubtle: "rgba(245,247,246,0.08)",
    borderStrong: "rgba(245,247,246,0.14)",
    dividerSubtle: "rgba(245,247,246,0.07)",

    borderGreenSoft: "rgba(34,197,94,0.22)",
    borderGreenStrong: "rgba(34,197,94,0.38)",
    borderGoldSoft: "rgba(250,204,21,0.22)",
    borderGoldStrong: "rgba(250,204,21,0.36)",

    glowGreen: "rgba(34,197,94,0.16)",
    glowGold: "rgba(250,204,21,0.16)",

    // ------------------------------------------------------------------
    // Backwards-compatible aliases
    // ------------------------------------------------------------------
    background: "#050505",
    backgroundSecondary: "#0B0F14",

    text: "#F5F7F6",
    textTertiary: "#7C867D",

    primary: "#22C55E",
    primaryDark: "rgba(34,197,94,0.78)",
    primaryLight: "rgba(134,239,172,0.96)",

    accent: "#FACC15",

    border: "rgba(245,247,246,0.08)",
    divider: "rgba(245,247,246,0.07)",
  },

  /**
   * Legacy "glass" tokens.
   * Keep these for backwards compatibility while screens are migrated.
   * Target feel: controlled matte translucency, not washed-out blur.
   */
  glass: {
    border: "rgba(245,247,246,0.10)",
    iosBg: {
      subtle: "rgba(255,255,255,0.035)",
      default: "rgba(255,255,255,0.05)",
      strong: "rgba(255,255,255,0.07)",
    },
    androidBg: {
      subtle: "rgba(0,0,0,0.18)",
      default: "rgba(0,0,0,0.24)",
      strong: "rgba(0,0,0,0.3)",
    },
  },

  /**
   * New badge / surface tokens for the updated visual system.
   */
  surfaces: {
    card: "#0B0F14",
    cardElevated: "#11161C",
    cardPressed: "#171D24",
    cardBrand: "#0D1811",
    cardGold: "#171308",
  },

  gradients: {
    green: ["#16A34A", "#22C55E", "#86EFAC"] as const,
    gold: ["#CA8A04", "#EAB308", "#FACC15"] as const,
    dark: ["#050505", "#0B0F14", "#11161C"] as const,
    brand: ["#07110B", "#0D1811", "#11161C"] as const,
  },

  badge: {
    bgGreen: "rgba(34,197,94,0.12)",
    bgGold: "rgba(250,204,21,0.12)",
    bgNeutral: "rgba(255,255,255,0.05)",

    borderGreen: "rgba(34,197,94,0.26)",
    borderGold: "rgba(250,204,21,0.28)",
    borderNeutral: "rgba(255,255,255,0.10)",

    textGreen: "#86EFAC",
    textGold: "#FDE68A",
    textNeutral: "#D6DDD7",
  },

  shadow: {
    greenGlow: {
      shadowColor: "#22C55E",
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    goldGlow: {
      shadowColor: "#FACC15",
      shadowOpacity: 0.16,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    soft: {
      shadowColor: "#000000",
      shadowOpacity: 0.24,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
  },

  // ------------------------------------------------------------------
  // Strict layout scales
  // ------------------------------------------------------------------
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
    badge: 12,
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
