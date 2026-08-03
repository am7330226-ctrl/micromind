/**
 * themes.js — XP Theme Unlocking Engine
 *
 * Defines all available themes, their unlock requirements,
 * and CSS variable sets applied to document.documentElement.
 */

export const THEMES = [
  {
    id: 'dark',
    name: 'Default Dark',
    emoji: '🌑',
    unlockLevel: 0,
    description: 'The classic MicroMind dark experience',
    vars: {
      '--bg-main': '#0f172a',
      '--bg-sidebar': '#1e293b',
      '--bg-header': 'rgba(30, 41, 59, 0.85)',
      '--bg-card': '#1e293b',
      '--text-primary': '#f8fafc',
      '--text-secondary': '#94a3b8',
      '--border-color': '#334155',
      '--color-violet': '#a855f7',
      '--color-violet-hover': '#9333ea',
      '--gradient-brand': 'linear-gradient(135deg, #8b5cf6, #6366f1)',
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
      '--bg-main': '#f4f6fc',
      '--bg-sidebar': '#ffffff',
      '--bg-header': 'rgba(255, 255, 255, 0.85)',
      '--bg-card': '#ffffff',
      '--text-primary': '#1e293b',
      '--text-secondary': '#64748b',
      '--border-color': '#e2e8f0',
      '--color-violet': '#7c3aed',
      '--color-violet-hover': '#6d28d9',
      '--gradient-brand': 'linear-gradient(135deg, #7c3aed, #4f46e5)',
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
      '--bg-main': '#060612',
      '--bg-sidebar': '#0b0b1f',
      '--bg-header': 'rgba(11, 11, 31, 0.85)',
      '--bg-card': '#0b0b1f',
      '--text-primary': '#e0f7fa',
      '--text-secondary': '#80cdd8',
      '--border-color': 'rgba(0, 245, 255, 0.25)',
      '--color-violet': '#00f5ff',
      '--color-violet-hover': '#00c8d4',
      '--gradient-brand': 'linear-gradient(135deg, #00f5ff, #bf00ff)',
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
      '--bg-main': '#fdf4f0',
      '--bg-sidebar': '#fff8f5',
      '--bg-header': 'rgba(255, 248, 245, 0.85)',
      '--bg-card': '#fff8f5',
      '--text-primary': '#3d1a1a',
      '--text-secondary': '#7a4040',
      '--border-color': 'rgba(224, 90, 106, 0.2)',
      '--color-violet': '#e05a6a',
      '--color-violet-hover': '#c94458',
      '--gradient-brand': 'linear-gradient(135deg, #f97316, #e05a6a)',
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
      '--bg-main': '#020814',
      '--bg-sidebar': '#05101e',
      '--bg-header': 'rgba(5, 16, 30, 0.85)',
      '--bg-card': '#05101e',
      '--text-primary': '#e2eeff',
      '--text-secondary': '#7d9dc7',
      '--border-color': 'rgba(96, 165, 250, 0.2)',
      '--color-violet': '#60a5fa',
      '--color-violet-hover': '#3b82f6',
      '--gradient-brand': 'linear-gradient(135deg, #1e40af, #60a5fa)',
    },
    bodyClass: 'theme-deepspace dark',
  },
];

const STORAGE_KEY = 'micromind_active_theme';

export function getSavedThemeId() {
  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

export function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  const isDark = theme.bodyClass?.includes('dark');

  // 1. Root data-theme attribute
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');

  // 2. Body class toggling
  document.body.classList.remove(
    'light',
    'dark',
    'theme-cyberpunk',
    'theme-sunset',
    'theme-deepspace',
  );
  if (theme.bodyClass) {
    theme.bodyClass.split(' ').forEach((c) => document.body.classList.add(c));
  }

  // 3. Apply CSS variables onto :root
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // Persist
  localStorage.setItem(STORAGE_KEY, theme.id);
}
