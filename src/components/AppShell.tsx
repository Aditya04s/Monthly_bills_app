import type { ReactNode } from 'react';
import type { AppRoute } from '../types/navigation';
import { navigationItems } from '../utils/navigation';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';

interface AppShellProps {
  activeRoute: AppRoute;
  children: ReactNode;
  onNavigate: (route: AppRoute) => void;
}

export function AppShell({ activeRoute, children, onNavigate }: AppShellProps) {
  const activeItem = navigationItems.find((item) => item.route === activeRoute);

  return (
    <div className="min-h-svh bg-app-bg text-app-text">
      <OfflineBanner />
      <header className="safe-top sticky top-0 z-10 border-b border-app-border/70 bg-app-bg/95 px-4 pb-4 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">
              Bill App
            </p>
            <h1 className="mt-0.5 text-2xl font-semibold leading-tight">{activeItem?.label}</h1>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-accentSoft text-sm font-bold text-app-accent"
            aria-hidden="true"
          >
            BA
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>

      <BottomNav activeRoute={activeRoute} onNavigate={onNavigate} />
    </div>
  );
}
