
export const theme = {
  colors: {
    // Dark background with neon green accent
    background: '#0A0E1A',
    backgroundSecondary: '#141824',
    card: '#1A1F2E',
    cardHover: '#222838',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#8B92A8',
    textTertiary: '#5A6178',
    
    // Neon green accent
    primary: '#00FF88',
    primaryDark: '#00CC6E',
    primaryLight: '#33FFA3',
    
    // Additional colors
    accent: '#00D4FF',
    warning: '#FFB800',
    error: '#FF3B5C',
    success: '#00FF88',
    
    // Borders and dividers
    border: '#2A2F3E',
    divider: '#1F2430',
    
    // Overlay
    overlay: 'rgba(10, 14, 26, 0.9)',
    overlayLight: 'rgba(10, 14, 26, 0.7)',
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
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export type Theme = typeof theme;
