import React from 'react';

import { useTranslation } from 'react-i18next';

import { VinesLogViewLogTab } from '@/components/layout/workspace/vines-view/execution-log/log';
import { VinesLogViewStatTab } from '@/components/layout/workspace/vines-view/execution-log/stat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import useUrlState from '@/hooks/use-url-state.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

export const VinesLogView: React.FC = () => {
  const { t } = useTranslation();

  const workbenchVisible = usePageStore((s) => s.workbenchVisible);


  const [{ tab }, setTab] = useUrlState({ tab: 'log' });

  return (
    <main className={cn('relative  h-full max-h-full p-6', workbenchVisible && 'p-0 pl-4')}>
      <Tabs
        value={tab}
        onValueChange={(val) => setTab({ tab: val })}
        className="h-full w-full [&_[role='tabpanel']]:mt-4 [&_[role='tabpanel']]:h-[calc(100vh-11.5rem)] [&_[role='tabpanel']]:overflow-hidden"
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
          <VinesLogViewLogTab />
        </TabsContent>
        <TabsContent value="stat">
          <VinesLogViewStatTab />
        </TabsContent>
      </Tabs>
    </main>
  );
};
