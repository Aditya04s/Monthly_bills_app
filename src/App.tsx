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

export function App() {
  const { route, navigate } = useHashRoute();
  const theme = useTheme();

  return (
    <AppShell activeRoute={route} onNavigate={navigate}>
      {route === 'calculator' && <CalculatorScreen />}
      {route === 'history' && (
        <Suspense fallback={<div className="rounded-lg bg-app-surface p-4 text-sm text-app-muted">Loading</div>}>
          <HistoryScreen />
        </Suspense>
      )}
      {route === 'settings' && (
        <Suspense fallback={<div className="rounded-lg bg-app-surface p-4 text-sm text-app-muted">Loading</div>}>
          <SettingsScreen theme={theme} />
        </Suspense>
      )}
    </AppShell>
  );
}
