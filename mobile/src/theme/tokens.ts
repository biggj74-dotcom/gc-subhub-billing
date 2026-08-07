import { Platform, TextStyle } from 'react-native';

/**
 * Design tokens ported 1:1 from the GCSubHub Trucking React prototype
 * (`C`, `display`, `body`, `mono` in gcsubhub-trucking.jsx).
 * Charcoal/chrome/gold palette pulled from the client's logo.
 */
export const C = {
  bg: '#0B0C10',
  panel: '#16171C',
  panel2: '#1F2126',
  line: '#2B2D34',
  gold: '#C6A15B',
  goldBright: '#E3C486',
  chrome: '#B8C0CC',
  green: '#4AA57C',
  blue: '#5C82B8',
  red: '#C05B57',
  paper: '#F3F2ED',
  silver: '#888D97',
} as const;

// Web prototype used Georgia (serif) / system-ui (sans) / Courier New (mono).
// RN has no cross-platform Georgia/Courier New, so we fall back to the
// closest native-installed equivalent per platform. Swapping in a bundled
// brand font later (via expo-font) is a drop-in replacement here.
export const display: TextStyle = {
  fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
};

export const body: TextStyle = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
};

export const mono: TextStyle = {
  fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
};

export const withAlpha = (hex: string, alphaHex: string) => hex + alphaHex;
