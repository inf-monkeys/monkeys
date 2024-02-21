import React, { useEffect } from 'react';

import { get } from 'lodash';
import { SuperSEO } from 'react-super-seo';

import { useOemConfig } from '@/apis/common';
import usePaletteStore from '@/store/usePaletteStore.ts';

export const OEM: React.FC = () => {
  const { data: oem } = useOemConfig();

  const { setValue } = usePaletteStore();

  const siteThemeColor = get(oem, 'theme.colors.primaryColor', '');
  useEffect(() => {
    setValue(siteThemeColor);
  }, [siteThemeColor]);

  useEffect(() => {
    const handleToggleTheme = (event: MediaQueryListEvent) => {
      document.documentElement.classList[event.matches ? 'add' : 'remove']('dark');
    };
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', handleToggleTheme);
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleToggleTheme);
    };
  }, []);

  const siteName = get(oem, 'theme.name', '');
  const siteIcon = get(oem, 'theme.favicon.url', '');
  const siteIconType = get(oem, 'theme.favicon.type', '');

  return (
    oem && (
      <SuperSEO title={siteName} description="懂业务的大模型流程引擎，零代码构建高价值 AI 应用。">
        <link rel="shortcut icon" type={siteIconType} href={siteIcon} />
      </SuperSEO>
    )
  );
};
