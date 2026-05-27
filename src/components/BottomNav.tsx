import type { AppRoute } from '../types/navigation';
import { cx } from '../utils/classNames';
import { navigationItems } from '../utils/navigation';
import { NavIcon } from './NavIcon';

interface BottomNavProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export function BottomNav({ activeRoute, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-app-border/80 bg-app-surface/95 px-3 pt-2 shadow-soft backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
        {navigationItems.map((item) => {
          const isActive = item.route === activeRoute;

          return (
            <button
              key={item.route}
              type="button"
              className={cx(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition duration-200 active:scale-[0.98]',
                isActive
                  ? 'bg-app-accentSoft text-app-accent'
                  : 'text-app-muted hover:bg-app-elevated hover:text-app-text'
              )}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(item.route)}
            >
              <NavIcon name={item.icon} active={isActive} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
