// Amber/Gold theme matching the web version
export const colors = {
  // Brand - Amber/Gold
  primary: '#f59e0b', // amber-500
  primaryDark: '#d97706', // amber-600
  primaryLight: '#fbbf24', // amber-400
  accent: '#f59e0b',

  // Background - Warm stone tones
  background: '#fafaf9', // stone-50
  surface: '#f5f5f4', // stone-100
  surfaceDark: '#e7e5e4', // stone-200

  // Semantic
  success: '#22c55e', // green-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500

  // Neutrals - Stone palette
  border: '#d6d3d1', // stone-300
  borderLight: '#e7e5e4', // stone-200
  text: '#1c1917', // stone-900
  textSecondary: '#57534e', // stone-600
  textMuted: '#78716c', // stone-500

  // Cards
  card: '#ffffff',
  cardBorder: '#e7e5e4', // stone-200

  // Buttons
  buttonPrimary: '#f59e0b', // amber-500
  buttonPrimaryHover: '#d97706', // amber-600
  buttonSecondary: '#78716c', // stone-500

  // Input
  inputBorder: '#d6d3d1', // stone-300
  inputBackground: '#ffffff',
  inputPlaceholder: '#a8a29e', // stone-400

  // Price indicators
  priceDrop: '#22c55e', // green-500
  priceRise: '#ef4444', // red-500
  priceNeutral: '#78716c', // stone-500

  // Dark mode (keeping warm tones)
  dark: {
    background: '#1c1917', // stone-900
    surface: '#292524', // stone-800
    border: '#44403c', // stone-700
    text: '#fafaf9', // stone-50
    textSecondary: '#a8a29e', // stone-400
    textMuted: '#78716c', // stone-500
    card: '#292524',
  },
};

export type Colors = typeof colors;
