import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useFavicon, useTitle } from 'ahooks';
import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import useUrlState from '@/hooks/use-url-state.ts';
import { useAppStore } from '@/store/useAppStore';
import { EDarkModeTrigger } from '@/store/useAppStore/dark-mode.slice.ts';
import usePaletteStore, { useNeocardPaletteStore } from '@/store/usePaletteStore.ts';
import VinesEvent from '@/utils/events.ts';

export const OEM: React.FC = () => {
  const { team } = useVinesTeam();
  const [localDarkMode, setLocalDarkMode] = useLocalStorage<string>('vines-ui-dark-mode', '', false);

  const { data: oem } = useSystemConfig();

  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const setDarkModeTrigger = useAppStore((s) => s.setDarkModeTrigger);

  const setValue = usePaletteStore((s) => s.setValue);
  const setNeocardValue = useNeocardPaletteStore((s) => s.setValue);

  const siteThemeColor = get(oem, 'theme.colors.primaryColor', '');
  const siteNeocardColor = get(oem, 'theme.colors.neocardColor', '');
  const siteNeocardDarkColor = get(oem, 'theme.colors.neocardDarkColor', '');
  const teamThemeColor = get(team, 'customTheme.primaryColor', '');
  const teamNeocardColor = get(team, 'customTheme.neocardColor', '');
  const teamNeocardDarkColor = get(team, 'customTheme.neocardDarkColor', '');

  useEffect(() => {
    setValue(teamThemeColor || siteThemeColor);
  }, [siteThemeColor, teamThemeColor]);

  useEffect(() => {
    const lightColor = teamNeocardColor || siteNeocardColor;
    const darkColor = teamNeocardDarkColor || siteNeocardDarkColor;
    setNeocardValue({ light: lightColor, dark: darkColor });
  }, [siteNeocardColor, siteNeocardDarkColor, teamNeocardColor, teamNeocardDarkColor]);

  const [{ theme }] = useUrlState<{ theme: 'dark' | 'light' | null }>({ theme: null });

  useLayoutEffect(() => {
    if (theme) return;
    const handleToggleTheme = (event: Pick<MediaQueryListEvent, 'matches'>) => toggleDarkMode(event.matches);

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    handleToggleTheme({ matches: darkModeMediaQuery.matches });
    darkModeMediaQuery.addEventListener('change', handleToggleTheme);
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleToggleTheme);
    };
  }, []);

  const hideAuthToast = get(oem, 'auth.hideAuthToast', false);
  const autoReload = get(oem, 'auth.autoReload', false);
  window['hideAuthToast'] = hideAuthToast;
  window['autoReload'] = autoReload;

  const initialRef = useRef(false);
  useEffect(() => {
    if (theme) {
      setDarkModeTrigger(EDarkModeTrigger.Manual);
      const useDarkMode = theme === 'dark';
      setDarkMode(useDarkMode);
      toggleDarkMode(useDarkMode);
      initialRef.current = true;
      return;
    }

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
  }, [localDarkMode, theme]);

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
