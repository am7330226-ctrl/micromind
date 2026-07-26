/**
 * themes.js — XP Theme Unlocking Engine
 *
 * Defines all available themes, their unlock requirements,
 * and CSS variable sets applied to document.documentElement.
 *
 * Variables set on :root so ALL CSS vars resolve correctly:
 * - --color-surface / --color-surface-subtle / --color-surface-hover (used by component CSS)
 * - --bg-card / --bg-card-alt / --bg-app (aliases used by newer code)
 * - --text-primary / --text-secondary / --text-muted
 * - --color-border / --color-violet / --gradient-brand
 */

export const THEMES = [
  {
    id: 'default',
    name: 'Default Dark',
    emoji: '🌑',
    unlockLevel: 0,
    description: 'The classic MicroMind experience',
    vars: {
      '--color-bg':             '#121212',
      '--color-surface':        '#1a1a1a',
      '--color-surface-subtle': '#161616',
      '--color-surface-hover':  '#222222',
      '--bg-app':               '#121212',
      '--bg-card':              '#1a1a1a',
      '--bg-card-alt':          '#161616',
      '--color-border':         'rgba(255,255,255,0.12)',
      '--text-primary':         '#f8fafc',
      '--text-secondary':       '#cbd5e1',
      '--text-muted':           '#64748b',
      '--color-violet':         '#a855f7',
      '--color-violet-hover':   '#9333ea',
      '--gradient-brand':       'linear-gradient(135deg, #8b5cf6, #6366f1)',
    },
    bodyClass: 'dark',
  },
  {
    id: 'light',
    name: 'Default Light',
    emoji: '☀️',
    unlockLevel: 0,
    description: 'Clean and bright workspace',
    vars: {
      '--color-bg':             '#e8edf2',
      '--color-surface':        '#ffffff',
      '--color-surface-subtle': '#f8fafc',
      '--color-surface-hover':  '#f1f5f9',
      '--bg-app':               '#f8faff',
      '--bg-card':              '#ffffff',
      '--bg-card-alt':          '#f1f5fb',
      '--color-border':         '#e2e8f0',
      '--text-primary':         '#0f172a',
      '--text-secondary':       '#475569',
      '--text-muted':           '#94a3b8',
      '--color-violet':         '#7c3aed',
      '--color-violet-hover':   '#6d28d9',
      '--gradient-brand':       'linear-gradient(135deg, #7c3aed, #4f46e5)',
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
      '--color-bg':             '#060612',
      '--color-surface':        '#0b0b1f',
      '--color-surface-subtle': '#10102c',
      '--color-surface-hover':  '#15153a',
      '--bg-app':               '#060612',
      '--bg-card':              '#0b0b1f',
      '--bg-card-alt':          '#10102c',
      '--color-border':         'rgba(0,245,255,0.18)',
      '--text-primary':         '#e0f7fa',
      '--text-secondary':       '#80cdd8',
      '--text-muted':           '#4a7d8a',
      '--color-violet':         '#00f5ff',
      '--color-violet-hover':   '#00c8d4',
      '--gradient-brand':       'linear-gradient(135deg, #00f5ff, #bf00ff)',
    },
    bodyClass: 'theme-cyberpunk dark',
  },
  {
    id: 'sunset',
    name: 'Sunset Pastel',
    emoji: '🌅',
    unlockLevel: 10,
    description: 'Warm pastels and golden-hour tones',
    vars: {
      '--color-bg':             '#fdf4f0',
      '--color-surface':        '#fff8f5',
      '--color-surface-subtle': '#fceee8',
      '--color-surface-hover':  '#fae5db',
      '--bg-app':               '#fdf4f0',
      '--bg-card':              '#fff8f5',
      '--bg-card-alt':          '#fceee8',
      '--color-border':         'rgba(224,90,106,0.15)',
      '--text-primary':         '#3d1a1a',
      '--text-secondary':       '#7a4040',
      '--text-muted':           '#b87c7c',
      '--color-violet':         '#e05a6a',
      '--color-violet-hover':   '#c94458',
      '--gradient-brand':       'linear-gradient(135deg, #f97316, #e05a6a)',
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
      '--color-bg':             '#020814',
      '--color-surface':        '#05101e',
      '--color-surface-subtle': '#081628',
      '--color-surface-hover':  '#0c1e36',
      '--bg-app':               '#020814',
      '--bg-card':              '#05101e',
      '--bg-card-alt':          '#081628',
      '--color-border':         'rgba(96,165,250,0.15)',
      '--text-primary':         '#e2eeff',
      '--text-secondary':       '#7d9dc7',
      '--text-muted':           '#3d5a7a',
      '--color-violet':         '#60a5fa',
      '--color-violet-hover':   '#3b82f6',
      '--gradient-brand':       'linear-gradient(135deg, #1e40af, #60a5fa)',
    },
    bodyClass: 'theme-deepspace dark',
  },
];

const STORAGE_KEY = 'micromind_active_theme';

/** Load saved theme id from localStorage (defaults to 'dark') */
export function getSavedThemeId() {
  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

/** Apply a theme's CSS variables + body class to the document */
export function applyTheme(theme) {
  const root = document.documentElement;

  // Remove all theme-related body classes
  document.body.classList.remove(
    'light', 'dark',
    'theme-cyberpunk', 'theme-sunset', 'theme-deepspace'
  );

  // Apply CSS vars onto :root
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // Apply body class(es)
  if (theme.bodyClass) {
    theme.bodyClass.split(' ').forEach(c => document.body.classList.add(c));
  }

  // Persist
  localStorage.setItem(STORAGE_KEY, theme.id);
}
