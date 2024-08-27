import React from 'react';

import { useTranslation } from 'react-i18next';

import { VinesLogViewLogTab } from '@/components/layout/workspace/vines-view/log/log';
import { VinesLogViewStatTab } from '@/components/layout/workspace/vines-view/log/stat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import useUrlState from '@/hooks/use-url-state.ts';
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

export const VinesLogView: React.FC = () => {
  const { t } = useTranslation();

  const visible = useViewStore((s) => s.visible);
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);
  const containerHeight = usePageStore((s) => s.containerHeight);

  const height = containerHeight - (workbenchVisible ? 32 : 48) - 60;

  const [{ tab }, setTab] = useUrlState({ tab: 'log' });

  return (
    <main className={cn('relative h-full max-h-full p-6', workbenchVisible && 'p-4')}>
      <Tabs
        value={tab}
        onValueChange={(val) => setTab({ tab: val })}
        className="h-full w-full [&>[role='tabpanel']]:mt-4 [&>[role='tabpanel']]:overflow-hidden"
      >
        <TabsList>
          <TabsTrigger value="log" className="text-xs">
            {t('workspace.logs-view.log.title')}
          </TabsTrigger>
          <TabsTrigger value="stat" className="text-xs">
            {t('workspace.logs-view.stat.title')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="log">
          <VinesLogViewLogTab visible={visible} containerHeight={height} workbenchVisible={workbenchVisible} />
        </TabsContent>
        <TabsContent value="stat">
          <VinesLogViewStatTab visible={visible} containerHeight={height} workbenchVisible={workbenchVisible} />
        </TabsContent>
      </Tabs>
    </main>
  );
};
