import { useCallback, useEffect, useState } from 'react';
import type { AppRoute } from '../types/navigation';
import { DEFAULT_ROUTE, routeFromHash, routeToHash } from '../utils/navigation';

function readCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') {
    return DEFAULT_ROUTE;
  }

  return routeFromHash(window.location.hash);
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(readCurrentRoute);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(readCurrentRoute());
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    if (typeof window === 'undefined') {
      setRoute(nextRoute);
      return;
    }

    const nextHash = routeToHash(nextRoute);
    if (window.location.hash === nextHash) {
      setRoute(nextRoute);
      return;
    }

    window.location.hash = nextHash;
  }, []);

  return {
    route,
    navigate
  };
}

