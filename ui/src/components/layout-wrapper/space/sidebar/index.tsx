import React from 'react';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { cn } from '@/utils';

interface ISpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SpaceSidebar: React.FC<ISpaceSidebarProps> = ({ children }) => {
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');

  // 根据主题模式应用不同圆角样式
  const isShadowMode = themeMode === 'shadow';
  const roundedClass = isShadowMode ? 'rounded-lg' : 'rounded-xl';

  return (
    <nav
      className={cn(
        'flex w-56 flex-col justify-between gap-global overflow-y-hidden border border-input bg-slate-1 p-global',
        roundedClass,
      )}
    >
      {children}
    </nav>
  );
};
