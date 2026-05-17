export type ThemeMode = 'system' | 'light' | 'dark';

export type ResolvedTheme = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

