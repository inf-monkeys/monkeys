import VinesEvent from '@/utils/events.ts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Layers2, Package, PackagePlus } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useVinesTeam } from '@/components/router/guard/team.tsx';

export const SpaceHeaderTabs: React.FC = () => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  return (
    <Tabs
      value="workbench"
      onValueChange={(val) => {
        switch (val) {
          case 'workbench':
            VinesEvent.emit('vines-nav', '/$teamId/', { teamId });
            break;
          case 'store':
            VinesEvent.emit('vines-nav', '/$teamId/store/', { teamId });
            break;
          case 'main':
            VinesEvent.emit('vines-nav', '/$teamId/agents/', { teamId });
        }
      }}
    >
      <TabsList className="!h-9">
        <TabsTrigger className="gap-1 py-1" value="workbench">
          <Layers2 size={14} />
          {t('components.layout.main.sidebar.list.workbench.label')}
        </TabsTrigger>
        <TabsTrigger className="gap-1 py-1" value="store">
          <Package size={14} />
          {t('components.layout.main.sidebar.list.store.application-store.label')}
        </TabsTrigger>
        <TabsTrigger className="gap-1 py-1" value="main">
          <PackagePlus size={14} />
          {t('components.layout.main.sidebar.list.workspace.label')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
