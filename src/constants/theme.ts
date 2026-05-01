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
 */

export const theme = {
  colors: {
    // ------------------------------------------------------------------
    // Base
    // ------------------------------------------------------------------
    bgBase: "#050505",
    bgSurface: "#0A0E12",
    bgElevated: "#10161C",
    bgPressed: "#161D24",

    // Brand-tinted surfaces
    bgBrand: "#0B1A12",
    bgBrandElevated: "#10261A",
    bgGold: "#171308",

    // Overlays
    overlay: "rgba(0,0,0,0.55)",
    overlayStrong: "rgba(0,0,0,0.75)",
    overlaySoft: "rgba(0,0,0,0.35)",

    // ------------------------------------------------------------------
    // Text
    // ------------------------------------------------------------------
    textPrimary: "#F5F7F6",
    textSecondary: "#AEB8AF",
    textMuted: "#6F7A72",

    textOnBrand: "#031008",
    textOnGold: "#1A1406",

    // ------------------------------------------------------------------
    // Brand
    // ------------------------------------------------------------------
    emerald: "#22C55E",
    emeraldStrong: "#16A34A",
    emeraldSoft: "#86EFAC",

    gold: "#FACC15",
    goldStrong: "#EAB308",
    goldSoft: "#FDE68A",

    neutral: "#D6DDD7",

    // ------------------------------------------------------------------
    // Borders
    // ------------------------------------------------------------------
    borderSubtle: "rgba(255,255,255,0.06)",
    borderStrong: "rgba(255,255,255,0.12)",

    borderEmerald: "rgba(34,197,94,0.28)",
    borderGold: "rgba(250,204,21,0.28)",

    // ------------------------------------------------------------------
    // Glow (STRICT USAGE)
    // ------------------------------------------------------------------
    glowEmerald: "rgba(34,197,94,0.18)",
    glowGold: "rgba(250,204,21,0.16)",

    // ------------------------------------------------------------------
    // Semantic
    // ------------------------------------------------------------------
    success: "#22C55E",
    warning: "#FACC15",
    error: "#E05252",
  },

  /**
   * Glass system — controlled, not washed out
   */
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
  },

  /**
   * Surfaces (used everywhere instead of random rgba)
   */
  surfaces: {
    base: "#0A0E12",
    elevated: "#10161C",
    brand: "#0B1A12",
    gold: "#171308",
  },

  /**
   * Gradients (use sparingly)
   */
  gradients: {
    emerald: ["#16A34A", "#22C55E"] as const,
    gold: ["#CA8A04", "#FACC15"] as const,
    dark: ["#050505", "#0A0E12"] as const,
  },

  /**
   * Badge system
   */
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
  },

  /**
   * Shadows — subtle only
   */
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
  },

  // ------------------------------------------------------------------
  // Layout system
  // ------------------------------------------------------------------
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },

  borderRadius: {
    card: 20,
    button: 14,
    input: 14,
    pill: 999,
    sheet: 26,
  },

  fontSize: {
    hero: 30,
    h1: 24,
    h2: 20,
    body: 16,
    meta: 13,
    tiny: 11,
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
