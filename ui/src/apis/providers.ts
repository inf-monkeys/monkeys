import { stringify } from '@/utils/fast-stable-stringify.ts';

export const localStorageProvider = () => {
  if (localStorage.getItem('vines-swr-cache-enable') === '1') {
    const map = new Map(JSON.parse(localStorage.getItem('vines-swr-cache') || '[]'));

    window.addEventListener('beforeunload', () => {
      const appCache = stringify(Array.from(map.entries()));
      localStorage.setItem('vines-swr-cache', appCache);
    });

    return map as any;
  } else {
    return new Map();
  }
};
