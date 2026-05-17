export type AppRoute = 'calculator' | 'history' | 'settings';

export type NavIconName = 'calculator' | 'history' | 'settings';

export interface NavigationItem {
  route: AppRoute;
  label: string;
  icon: NavIconName;
}

