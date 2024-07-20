import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useFavicon, useTitle } from 'ahooks';
import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAppStore } from '@/store/useAppStore';
import { EDarkModeTrigger } from '@/store/useAppStore/dark-mode.slice.ts';
import usePaletteStore from '@/store/usePaletteStore.ts';
import VinesEvent from '@/utils/events.ts';

export const OEM: React.FC = () => {
  const { team } = useVinesTeam();
  const [localDarkMode, setLocalDarkMode] = useLocalStorage<string>('vines-ui-dark-mode', '', false);

  const { data: oem } = useSystemConfig();

  const { darkMode, toggleDarkMode, setDarkMode, setDarkModeTrigger } = useAppStore();

  const { setValue } = usePaletteStore();

  const siteThemeColor = get(oem, 'theme.colors.primaryColor', '');
  const teamThemeColor = get(team, 'customTheme.primaryColor', '');
  useEffect(() => {
    setValue(teamThemeColor || siteThemeColor);
  }, [siteThemeColor, teamThemeColor]);

  useLayoutEffect(() => {
    const handleToggleTheme = (event: Pick<MediaQueryListEvent, 'matches'>) => toggleDarkMode(event.matches);

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    handleToggleTheme({ matches: darkModeMediaQuery.matches });
    darkModeMediaQuery.addEventListener('change', handleToggleTheme);
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleToggleTheme);
    };
  }, []);

  const initialRef = useRef(false);
  useEffect(() => {
    if (initialRef.current) {
      if (localDarkMode === 'auto') {
        setDarkModeTrigger(EDarkModeTrigger.Auto);
      } else {
        setDarkModeTrigger(EDarkModeTrigger.Manual);
        setDarkMode(localDarkMode === 'dark');
      }
      return;
    }

    // ↓ 此处要放所有在 useEffect 中的依赖项
    if (localDarkMode) {
      if (localDarkMode === 'auto') {
        setTimeout(() => setLocalDarkMode('auto'));
        setDarkModeTrigger(EDarkModeTrigger.Auto);
      } else {
        const isDarkMode = localDarkMode === 'dark';
        setDarkModeTrigger(EDarkModeTrigger.Manual);
        setDarkMode(isDarkMode);
        toggleDarkMode(isDarkMode);
      }
      initialRef.current = true;
    }
  }, [localDarkMode]);

  const [title, setTitle] = useState('');

  useEffect(() => {
    const handleUpdateSiteTitle = (text: string) => setTitle(text ? text + ' - ' : '');
    VinesEvent.on('vines-update-site-title', handleUpdateSiteTitle);
    return () => {
      VinesEvent.off('vines-update-site-title', handleUpdateSiteTitle);
    };
  }, []);

  useTitle(title + get(oem, 'theme.title', 'AI'));
  useFavicon(get(oem, `theme.favicon.${darkMode ? 'dark' : 'light'}`, ''));

  return null;
};
