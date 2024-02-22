import { Cache } from 'swr/_internal';

import { parse, stringify } from 'superjson';

export function localStorageProvider(): Cache<Map<unknown, unknown>> {
  const whitelist = ['/api/configs'];
  const expiryTime = 24 * 60 * 60 * 1000;
  const cacheKey = 'vines-swr';

  let initialMap: never[] = [];
  let timestamp: number = 0;

  try {
    const localData = parse(localStorage.getItem(cacheKey) || 'null');
    if (Array.isArray(localData) && localData.length === 2) {
      [timestamp, initialMap] = localData as [number, never[]];
    }
  } catch (e) {
    console.error('Failed to parse local storage data:', e);
  }

  const map = new Map(initialMap);

  window.addEventListener('beforeunload', () => {
    const currentTime = new Date().getTime();

    for (const key of map.keys()) {
      if (!whitelist.includes(key as string)) {
        map.delete(key);
      }
    }

    if (currentTime - timestamp > expiryTime) {
      const appCache = stringify([currentTime, Array.from(map.entries())]);
      localStorage.setItem(cacheKey, appCache);
    }
  });

  return map as Cache<Map<unknown, unknown>>;
}
