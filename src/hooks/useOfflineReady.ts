import { useEffect, useState } from 'react';

export function useOfflineReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.ready.then(() => { if (active) setReady(true); });
    }
    return () => { active = false; };
  }, []);
  return ready;
}
