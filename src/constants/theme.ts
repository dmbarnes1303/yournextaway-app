// src/constants/theme.ts

/**
 * YourNextAway Theme (V4 — Locked Launch System)
 *
 * Source of truth: YourNextAway logo
 *
 * Principles:
 * - Matte black foundation
 * - Emerald = action / alive / travel momentum
 * - Gold = premium / highlight / standout moments
 * - No random colour usage in screens
 * - Surfaces must feel sharp, not washed-out glass
 *
 * Temporary compatibility:
 * - Legacy aliases stay until old screens are migrated.
 */

export const theme = {
  colors: {
    bgBase: "#050505",
    bgSurface: "#0A0E12",
    bgElevated: "#10161C",
    bgPressed: "#161D24",

    bgBrand: "#0B1A12",
    bgBrandElevated: "#10261A",
    bgGold: "#171308",

    overlay: "rgba(0,0,0,0.55)",
    overlayStrong: "rgba(0,0,0,0.75)",
    overlaySoft: "rgba(0,0,0,0.35)",

    textPrimary: "#F5F7F6",
    textSecondary: "#AEB8AF",
    textMuted: "#6F7A72",

    textOnBrand: "#031008",
    textOnGold: "#1A1406",

    emerald: "#22C55E",
    emeraldStrong: "#16A34A",
    emeraldSoft: "#86EFAC",

    gold: "#FACC15",
    goldStrong: "#EAB308",
    goldSoft: "#FDE68A",

    neutral: "#D6DDD7",

    borderSubtle: "rgba(255,255,255,0.06)",
    borderStrong: "rgba(255,255,255,0.12)",
    borderEmerald: "rgba(34,197,94,0.28)",
    borderGold: "rgba(250,204,21,0.28)",

    glowEmerald: "rgba(34,197,94,0.18)",
    glowGold: "rgba(250,204,21,0.16)",

    success: "#22C55E",
    warning: "#FACC15",
    error: "#E05252",

    // TEMP LEGACY ALIASES
    background: "#050505",
    backgroundSecondary: "#0A0E12",
    text: "#F5F7F6",
    textTertiary: "#6F7A72",
    primary: "#22C55E",
    primaryDark: "rgba(34,197,94,0.78)",
    primaryLight: "rgba(134,239,172,0.96)",
    accent: "#FACC15",
    accentGreen: "#22C55E",
    accentGreenStrong: "#16A34A",
    accentGreenSoft: "#86EFAC",
    accentGold: "#FACC15",
    accentGoldStrong: "#EAB308",
    accentGoldSoft: "#FDE68A",
    border: "rgba(255,255,255,0.06)",
    divider: "rgba(255,255,255,0.07)",
    dividerSubtle: "rgba(255,255,255,0.07)",
    borderGreenSoft: "rgba(34,197,94,0.22)",
    borderGreenStrong: "rgba(34,197,94,0.38)",
    borderGoldSoft: "rgba(250,204,21,0.22)",
    borderGoldStrong: "rgba(250,204,21,0.36)",
    glowGreen: "rgba(34,197,94,0.16)",
    glowGoldLegacy: "rgba(250,204,21,0.16)",
    bgBrandDeep: "#07110B",
    bgGoldDeep: "#171308",
  },

  glass: {
    border: "rgba(255,255,255,0.08)",

    bg: {
      subtle: "rgba(255,255,255,0.025)",
      default: "rgba(255,255,255,0.04)",
      strong: "rgba(255,255,255,0.06)",
    },

    android: {
      subtle: "rgba(0,0,0,0.25)",
      default: "rgba(0,0,0,0.35)",
      strong: "rgba(0,0,0,0.45)",
    },

    // TEMP LEGACY ALIASES — fixes theme.glass.subtle/default/strong crashes
    subtle: "rgba(255,255,255,0.025)",
    default: "rgba(255,255,255,0.04)",
    strong: "rgba(255,255,255,0.06)",

    // TEMP LEGACY ALIASES — older GlassCard versions/screens
    iosBg: {
      subtle: "rgba(255,255,255,0.025)",
      default: "rgba(255,255,255,0.04)",
      strong: "rgba(255,255,255,0.06)",
    },
    androidBg: {
      subtle: "rgba(0,0,0,0.25)",
      default: "rgba(0,0,0,0.35)",
      strong: "rgba(0,0,0,0.45)",
    },
  },

  surfaces: {
    base: "#0A0E12",
    elevated: "#10161C",
    brand: "#0B1A12",
    gold: "#171308",

    // TEMP LEGACY ALIASES
    card: "#0A0E12",
    cardElevated: "#10161C",
    cardPressed: "#161D24",
    cardBrand: "#0B1A12",
    cardGold: "#171308",
  },

  gradients: {
    emerald: ["#16A34A", "#22C55E"] as const,
    gold: ["#CA8A04", "#FACC15"] as const,
    dark: ["#050505", "#0A0E12"] as const,

    // TEMP LEGACY ALIASES
    green: ["#16A34A", "#22C55E", "#86EFAC"] as const,
    brand: ["#07110B", "#0B1A12", "#10161C"] as const,
  },

  badge: {
    bgEmerald: "rgba(34,197,94,0.12)",
    bgGold: "rgba(250,204,21,0.12)",
    bgNeutral: "rgba(255,255,255,0.04)",

    borderEmerald: "rgba(34,197,94,0.28)",
    borderGold: "rgba(250,204,21,0.28)",
    borderNeutral: "rgba(255,255,255,0.10)",

    textEmerald: "#86EFAC",
    textGold: "#FDE68A",
    textNeutral: "#D6DDD7",

    // TEMP LEGACY ALIASES
    bgGreen: "rgba(34,197,94,0.12)",
    borderGreen: "rgba(34,197,94,0.28)",
    textGreen: "#86EFAC",
  },

  shadow: {
    soft: {
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },

    emeraldGlow: {
      shadowColor: "#22C55E",
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },

    goldGlow: {
      shadowColor: "#FACC15",
      shadowOpacity: 0.16,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },

    // TEMP LEGACY ALIAS
    greenGlow: {
      shadowColor: "#22C55E",
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,

    // TEMP LEGACY ALIAS
    xxxl: 40,
  },

  borderRadius: {
    card: 20,
    button: 14,
    input: 14,
    pill: 999,
    sheet: 26,

    // TEMP LEGACY ALIASES
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
    badge: 12,
  },

  fontSize: {
    hero: 30,
    h1: 24,
    h2: 20,
    body: 16,
    meta: 13,
    tiny: 11,

    // TEMP LEGACY ALIASES
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
