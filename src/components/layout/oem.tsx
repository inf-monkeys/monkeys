import React, { useEffect, useLayoutEffect } from 'react';

import { useDocumentTitle, useFavicon } from '@mantine/hooks';
import { get } from 'lodash';

import { useOemConfig } from '@/apis/common';
import { useAppStore } from '@/store/useAppStore';
import usePaletteStore from '@/store/usePaletteStore.ts';

export const OEM: React.FC = () => {
  const { data: oem } = useOemConfig();
  const { toggleDarkMode } = useAppStore();

  const { setValue } = usePaletteStore();

  const siteThemeColor = get(oem, 'theme.colors.primaryColor', '');
  useEffect(() => {
    setValue(siteThemeColor);
  }, [siteThemeColor]);

  useLayoutEffect(() => {
    const handleToggleTheme = (event: Pick<MediaQueryListEvent, 'matches'>) => toggleDarkMode(event.matches);

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    handleToggleTheme({ matches: darkModeMediaQuery.matches });
    darkModeMediaQuery.addEventListener('change', handleToggleTheme);
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleToggleTheme);
    };
  }, []);

  useDocumentTitle(get(oem, 'theme.name', ''));
  useFavicon(get(oem, 'theme.favicon.url', ''));

  return null;
};
