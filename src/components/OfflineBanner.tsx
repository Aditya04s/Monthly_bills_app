import { useEffect, useState } from 'react';

function getOnlineStatus(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function OfflineBanner() {
  const [online, setOnline] = useState(getOnlineStatus);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div className="border-b border-app-border bg-app-accentSoft px-4 py-2 text-center text-sm font-semibold text-app-accent">
      Offline mode
    </div>
  );
}
