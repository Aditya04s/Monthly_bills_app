import type { AppRoute, NavigationItem } from '../types/navigation';

export const DEFAULT_ROUTE: AppRoute = 'calculator';

export const navigationItems: NavigationItem[] = [
  {
    route: 'calculator',
    label: 'Calculator',
    icon: 'calculator'
  },
  {
    route: 'history',
    label: 'History',
    icon: 'history'
  },
  {
    route: 'settings',
    label: 'Settings',
    icon: 'settings'
  }
];

export function isAppRoute(value: string | null | undefined): value is AppRoute {
  return navigationItems.some((item) => item.route === value);
}

export function routeFromHash(hash: string): AppRoute {
  const normalized = hash.replace(/^#\/?/, '');
  return isAppRoute(normalized) ? normalized : DEFAULT_ROUTE;
}

export function routeToHash(route: AppRoute): string {
  return `#${route}`;
}

