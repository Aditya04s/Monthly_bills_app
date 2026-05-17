import type { ThemeMode } from '../types/theme';
import { cx } from '../utils/classNames';

const themeOptions: ThemeMode[] = ['system', 'light', 'dark'];

interface ThemeSegmentedControlProps {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export function ThemeSegmentedControl({ mode, onChange }: ThemeSegmentedControlProps) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-app-border bg-app-elevated p-1">
      {themeOptions.map((option) => {
        const active = option === mode;

        return (
          <button
            key={option}
            type="button"
            className={cx(
              'min-h-11 rounded-md px-3 text-sm font-semibold capitalize transition-colors',
              active
                ? 'bg-app-surface text-app-text shadow-sm'
                : 'text-app-muted hover:text-app-text'
            )}
            aria-pressed={active}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

