import React, { useEffect, useState } from 'react';

import { Layers2, Package, PackagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { VinesSpaceHeadbarModule } from '@/apis/common/typings';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import VinesEvent from '@/utils/events.ts';

export const SpaceHeaderTabs: React.FC = () => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  const { data: oem } = useSystemConfig();

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

  const TAB_LIST = [
    {
      value: 'workbench',
      icon: Layers2,
    },
    {
      value: 'app-store',
      icon: Package,
    },
    {
      value: 'workspace',
      icon: PackagePlus,
    },
  ];

  const tabsList = TAB_LIST.filter((item) => {
    if (oem?.theme?.modules?.vinesSpaceHeadbar === '*' || !oem?.theme?.modules?.vinesSpaceHeadbar) {
      return true;
    }
    return oem?.theme?.modules?.vinesSpaceHeadbar?.includes(item.value as VinesSpaceHeadbarModule);
  });

  return (
    <Tabs
      value={value}
      onValueChange={(val) => {
        switch (val) {
          case 'workbench':
            VinesEvent.emit('vines-nav', '/$teamId/', { teamId });
            break;
          case 'app-store':
            VinesEvent.emit('vines-nav', '/$teamId/store/', { teamId });
            break;
          case 'workspace':
            VinesEvent.emit('vines-nav', '/$teamId/workflows/', { teamId });
        }
      }}
    >
      <TabsList className="!h-9">
        {tabsList.map((item) => (
          <TabsTrigger key={item.value} className="gap-1 py-1" value={item.value}>
            <item.icon size={14} />
            {t(`components.layout.header.tabs.${item.value}`)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
