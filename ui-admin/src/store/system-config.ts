import { create } from 'zustand';

import { getSystemConfig, SystemConfig } from '@/apis/system-config';

export function getBrandTitle(config?: SystemConfig): string {
  return config?.theme?.title || config?.theme?.name || 'Monkeys';
}

export function getBrandLogoUrl(config?: SystemConfig, options?: { darkMode?: boolean }): string {
  const darkMode = options?.darkMode ?? false;
  const logo = config?.theme?.logo;
  return (
    (darkMode ? logo?.dark : logo?.light) ||
    logo?.light ||
    logo?.dark ||
    ''
  );
}

export function getBrandFaviconUrl(config?: SystemConfig, options?: { darkMode?: boolean }): string {
  const darkMode = options?.darkMode ?? false;
  const favicon = config?.theme?.favicon;
  return (
    (darkMode ? favicon?.dark : favicon?.light) ||
    favicon?.light ||
    favicon?.dark ||
    ''
  );
}

export function applyFavicon(url: string) {
  if (typeof document === 'undefined') return;
  if (!url) return;

  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

export function formatAdminTitle(brandTitle: string): string {
  return brandTitle || 'Monkeys';
}

type SystemConfigStore = {
  config?: SystemConfig;
  isLoading: boolean;
  isLoaded: boolean;
  load: () => Promise<void>;
};

let inflight: Promise<void> | null = null;

export const useSystemConfigStore = create<SystemConfigStore>((set, get) => ({
  config: undefined,
  isLoading: false,
  isLoaded: false,
  load: async () => {
    if (get().isLoaded) return;
    if (inflight) return inflight;

    set({ isLoading: true });
    inflight = (async () => {
      const config = await getSystemConfig().catch(() => undefined);
      set({ config, isLoaded: true, isLoading: false });
    })().finally(() => {
      inflight = null;
    });

    return inflight;
  },
}));
