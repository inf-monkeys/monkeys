import React, { useEffect, useState } from 'react';

import { get, unionBy } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { CustomizationHeadbarTheme, VinesSpaceHeadbarModules } from '@/apis/common/typings';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { Tabs, TabsList, TabsTrigger, TabsVariant } from '@/components/ui/tabs';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn, getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

const HEADBAR_THEME_MAP: Record<CustomizationHeadbarTheme, TabsVariant> = {
  card: 'default',
  fixed: 'ghost',
  glassy: 'rounded',
};

export const SpaceHeaderTabs: React.FC = () => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  const { data: oem } = useSystemConfig();

  const oemVinesSpaceHeadbarModules: VinesSpaceHeadbarModules = get(oem, 'theme.modules.vinesSpaceHeadbar', []);

  const headbarTheme: CustomizationHeadbarTheme = get(oem, 'theme.headbar.theme', 'card');

  const { isUseWorkbench, isUseAppStore, isUsePanel } = useVinesRoute();

  const [value, setValue] = useState('workbench');

  useEffect(() => {
    if (isUseWorkbench) {
      setValue('workbench');
    } else if (isUseAppStore) {
      setValue('app-store');
    } else if (isUsePanel) {
      setValue('workspace');
    }
  }, [isUseWorkbench, isUseAppStore, isUsePanel]);

  const TAB_LIST: VinesSpaceHeadbarModules = [
    {
      id: 'workbench',
      icon: 'layers',
      visible: true,
      disabled: false,
    },
    {
      id: 'app-store',
      icon: 'package',
      visible: true,
      disabled: false,
    },
    {
      id: 'workspace',
      icon: 'package-plus',
      visible: true,
      disabled: false,
    },
  ];

  const tabsList: VinesSpaceHeadbarModules = unionBy(oemVinesSpaceHeadbarModules, TAB_LIST, 'id');

  return (
    <Tabs
      variant={HEADBAR_THEME_MAP[headbarTheme]}
      value={value}
      onValueChange={(val) => {
        if (tabsList.find((item) => item.id === val)?.disabled) return;
        switch (val) {
          case 'workbench':
            VinesEvent.emit('vines-nav', '/$teamId/', { teamId });
            break;
          case 'app-store':
            VinesEvent.emit('vines-nav', '/$teamId/store/', { teamId });
            break;
          case 'workspace':
            VinesEvent.emit('vines-nav', '/$teamId/evaluations', { teamId });
            break;
        }
      }}
    >
      <TabsList className="!h-9" gap="10px">
        {tabsList
          .filter((item) => item.visible)
          .map((item) => (
            <TabsTrigger
              key={item.id}
              className={cn('gap-1 py-1', headbarTheme === 'glassy' && 'gap-2')}
              value={item.id}
            >
              {item.icon && (
                <VinesLucideIcon
                  src={item.icon}
                  size={14}
                  className={cn('size-[14px]', headbarTheme === 'glassy' && 'stroke-white')}
                />
              )}
              {getI18nContent(item.displayName, t(`components.layout.header.tabs.${item.id}`))}
            </TabsTrigger>
          ))}
      </TabsList>
    </Tabs>
  );
};
