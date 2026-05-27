import { lazy, Suspense } from 'react';
import { AppShell } from './components/AppShell';
import { useHashRoute } from './hooks/useHashRoute';
import { useTheme } from './hooks/useTheme';
import { CalculatorScreen } from './screens/CalculatorScreen';

const HistoryScreen = lazy(() =>
  import('./screens/HistoryScreen').then((module) => ({
    default: module.HistoryScreen
  }))
);
const SettingsScreen = lazy(() =>
  import('./screens/SettingsScreen').then((module) => ({
    default: module.SettingsScreen
  }))
);

function RouteLoadingState() {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface p-4 shadow-sm" aria-label="Loading screen">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-32 rounded bg-app-elevated" />
        <div className="space-y-2">
          <div className="h-14 rounded-lg bg-app-elevated" />
          <div className="h-14 rounded-lg bg-app-elevated" />
        </div>
      </div>
    </div>
  );
}

export function App() {
  const { route, navigate } = useHashRoute();
  const theme = useTheme();

  return (
    <AppShell activeRoute={route} onNavigate={navigate}>
      <div hidden={route !== 'calculator'}>
        <CalculatorScreen isActive={route === 'calculator'} />
      </div>
      {route === 'history' && (
        <Suspense fallback={<RouteLoadingState />}>
          <HistoryScreen />
        </Suspense>
      )}
      {route === 'settings' && (
        <Suspense fallback={<RouteLoadingState />}>
          <SettingsScreen theme={theme} />
        </Suspense>
      )}
    </AppShell>
  );
}
