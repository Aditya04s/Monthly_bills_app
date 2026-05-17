import { registerSW } from 'virtual:pwa-register';

export function registerAppServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  registerSW({
    immediate: true
  });
}
