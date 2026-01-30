// src/constants/theme.ts

/**
 * YourNextAway Theme (V1 - Luxury Hospitality x Tech, Dark-Only)
 *
 * Goals:
 * - Calm, premium dark-first palette (near-black charcoal, not pure black)
 * - Surfaces step up in brightness (+6–10%, +12–15%)
 * - Accents are restrained (green is primary, blue secondary, gold micro-highlight)
 * - Backwards compatible key names to avoid breaking existing screens/components
 */

export const theme = {
  colors: {
    // -----------------------------
    // Core layers (NEW canonical)
    // -----------------------------
    bgBase: "#0F1113",
    bgSurface: "#16191D",
    bgElevated: "#1E2227",

    // -----------------------------
    // Text (NEW canonical)
    // -----------------------------
    textPrimary: "#F2F4F6",
    textSecondary: "rgba(242,244,246,0.72)",
    textTertiary: "rgba(242,244,246,0.45)",

    // -----------------------------
    // Accents (NEW canonical)
    // -----------------------------
    accentGreen: "#4FE08A",
    accentBlue: "#2F6BFF",
    accentGold: "rgba(214,181,106,0.70)",

    // -----------------------------
    // Status
    // -----------------------------
    warning: "#FFB800",
    error: "#FF5A6A",

    // -----------------------------
    // Lines / dividers
    // -----------------------------
    borderSubtle: "rgba(255,255,255,0.06)",
    dividerSubtle: "rgba(255,255,255,0.06)",

    // -----------------------------
    // Backwards compatible aliases
    // (Keep existing keys used throughout the app)
    // -----------------------------
    background: "#0F1113",
    backgroundSecondary: "#16191D",

    text: "#F2F4F6",
    // Neutral greys (not blue slates)
    // (these are already used widely in your styles)
    textSecondary: "rgba(242,244,246,0.72)",
    textTertiary: "rgba(242,244,246,0.45)",

    // Brand primary (was neon; now premium green)
    primary: "#4FE08A",
    // Kept for compatibility; discourage usage elsewhere
    primaryDark: "rgba(79,224,138,0.75)",
    primaryLight: "rgba(79,224,138,0.95)",

    // EU accent (secondary)
    accent: "#2F6BFF",

    // Success = green (match primary tone)
    success: "#4FE08A",

    // Borders/dividers: subtle, premium
    border: "rgba(255,255,255,0.06)",
    divider: "rgba(255,255,255,0.06)",

    // Overlays
    overlay: "rgba(0,0,0,0.82)",
    overlayLight: "rgba(0,0,0,0.62)",
  },

  /**
   * Glass system (single source of truth)
   * - iOS/web: blur + translucent surface tint
   * - Android: no blur, stronger tint
   *
   * Tuned to feel "frosted hospitality panels" (not neon smoke).
   */
  glass: {
    border: "rgba(255,255,255,0.08)",

    // Blur intensities for iOS/web
    blur: {
      subtle: 14,
      default: 20,
      strong: 28,
    },

    // Base backgrounds behind blur (iOS/web)
    iosBg: {
      subtle: "rgba(22,25,29,0.55)",
      default: "rgba(22,25,29,0.70)",
      strong: "rgba(30,34,39,0.75)",
    },

    // Android backgrounds (no blur, so stronger)
    androidBg: {
      subtle: "rgba(22,25,29,0.70)",
      default: "rgba(22,25,29,0.85)",
      strong: "rgba(30,34,39,0.90)",
    },
  },

  /**
   * Spacing
   * NOTE: Kept as-is for compatibility (minimises layout shifts).
   * We can tighten to a strict 8pt grid during screen rewrites.
   */
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  /**
   * Radius
   * NOTE: Kept as-is for compatibility.
   * During rewrites we’ll standardise usage to:
   * 12 (small), 16 (cards), 22–24 (large), 9999 (pill)
   */
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  /**
   * Typography
   * NOTE: Kept as-is for compatibility. We’ll lock the exact scale per screen rewrite.
   */
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
