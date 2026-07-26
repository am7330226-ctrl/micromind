/**
 * themes.js — XP Theme Unlocking Engine
 *
 * Defines all available themes, their unlock requirements,
 * and CSS variable sets applied to document.documentElement.
 */

export const THEMES = [
  {
    id: 'default',
    name: 'Default Dark',
    emoji: '🌑',
    unlockLevel: 0,
    description: 'The classic MicroMind experience',
    vars: {
      '--bg-app':       '#0d0d0f',
      '--bg-card':      '#151518',
      '--bg-card-alt':  '#1a1a1e',
      '--color-violet': '#8b5cf6',
      '--color-border': 'rgba(255,255,255,0.08)',
      '--text-primary': '#f1f5f9',
      '--text-secondary':'#94a3b8',
      '--text-muted':   '#64748b',
      '--gradient-brand':'linear-gradient(135deg, #8b5cf6, #6366f1)',
    },
  },
  {
    id: 'light',
    name: 'Default Light',
    emoji: '☀️',
    unlockLevel: 0,
    description: 'Clean and bright workspace',
    vars: {
      '--bg-app':       '#f8faff',
      '--bg-card':      '#ffffff',
      '--bg-card-alt':  '#f1f5fb',
      '--color-violet': '#7c3aed',
      '--color-border': 'rgba(0,0,0,0.08)',
      '--text-primary': '#0f172a',
      '--text-secondary':'#475569',
      '--text-muted':   '#94a3b8',
      '--gradient-brand':'linear-gradient(135deg, #7c3aed, #4f46e5)',
    },
    bodyClass: 'light',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    emoji: '⚡',
    unlockLevel: 5,
    description: 'Electric neon vibes from the future',
    vars: {
      '--bg-app':        '#060612',
      '--bg-card':       '#0b0b1f',
      '--bg-card-alt':   '#10102c',
      '--color-violet':  '#00f5ff',
      '--color-border':  'rgba(0,245,255,0.18)',
      '--text-primary':  '#e0f7fa',
      '--text-secondary':'#80cdd8',
      '--text-muted':    '#4a7d8a',
      '--gradient-brand':'linear-gradient(135deg, #00f5ff, #bf00ff)',
    },
    bodyClass: 'theme-cyberpunk',
  },
  {
    id: 'sunset',
    name: 'Sunset Pastel',
    emoji: '🌅',
    unlockLevel: 10,
    description: 'Warm pastels and golden-hour tones',
    vars: {
      '--bg-app':        '#fdf4f0',
      '--bg-card':       '#fff8f5',
      '--bg-card-alt':   '#fceee8',
      '--color-violet':  '#e05a6a',
      '--color-border':  'rgba(224,90,106,0.15)',
      '--text-primary':  '#3d1a1a',
      '--text-secondary':'#7a4040',
      '--text-muted':    '#b87c7c',
      '--gradient-brand':'linear-gradient(135deg, #f97316, #e05a6a)',
    },
    bodyClass: 'theme-sunset light',
  },
  {
    id: 'deepspace',
    name: 'Deep Space Navy',
    emoji: '🚀',
    unlockLevel: 15,
    description: 'Vast cosmos of midnight navy and stars',
    vars: {
      '--bg-app':        '#020814',
      '--bg-card':       '#05101e',
      '--bg-card-alt':   '#081628',
      '--color-violet':  '#60a5fa',
      '--color-border':  'rgba(96,165,250,0.15)',
      '--text-primary':  '#e2eeff',
      '--text-secondary':'#7d9dc7',
      '--text-muted':    '#3d5a7a',
      '--gradient-brand':'linear-gradient(135deg, #1e40af, #60a5fa)',
    },
    bodyClass: 'theme-deepspace',
  },
];

const STORAGE_KEY = 'micromind_active_theme';

/** Load saved theme id from localStorage (defaults to 'default') */
export function getSavedThemeId() {
  return localStorage.getItem(STORAGE_KEY) || 'default';
}

/** Apply a theme's CSS variables + body class to the document */
export function applyTheme(theme) {
  const root = document.documentElement;
  // Remove all theme body classes
  document.body.classList.remove('light', 'theme-cyberpunk', 'theme-sunset', 'theme-deepspace');

  // Apply CSS vars
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // Apply body class
  if (theme.bodyClass) {
    theme.bodyClass.split(' ').forEach(c => document.body.classList.add(c));
  }

  // Persist
  localStorage.setItem(STORAGE_KEY, theme.id);
}
