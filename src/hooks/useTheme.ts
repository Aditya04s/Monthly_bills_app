import { useCallback, useEffect, useState } from 'react';
import type { ResolvedTheme, ThemeMode, ThemeState } from '../types/theme';

const THEME_STORAGE_KEY = 'bill-app-theme';

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
      ? storedTheme
      : 'system';
  } catch {
    return 'system';
  }
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

function updateThemeColor(theme: ResolvedTheme) {
  const themeColor = theme === 'dark' ? '#020617' : '#f8fafc';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
  updateThemeColor(theme);
}

export function useTheme(): ThemeState {
  const [mode, setModeState] = useState<ThemeMode>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(mode));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const syncTheme = () => {
      const nextResolvedTheme = resolveTheme(mode);
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    };

    syncTheme();

    if (mode !== 'system') {
      return undefined;
    }

    media.addEventListener('change', syncTheme);
    return () => {
      media.removeEventListener('change', syncTheme);
    };
  }, [mode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch {
      // Theme changes should still work when storage is blocked.
    }
  }, []);

  return {
    mode,
    resolvedTheme,
    setMode
  };
}
