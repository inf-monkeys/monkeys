import React from 'react';

import { useTranslation } from 'react-i18next';

import { VinesLogViewLogTab } from '@/components/layout/vines-view/execution-log/log';
import { VinesLogViewStatTab } from '@/components/layout/vines-view/execution-log/stat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

export const VinesLogView: React.FC = () => {
  const { t } = useTranslation();

  const { workbenchVisible } = usePageStore();

  return (
    <main className={cn('relative  h-full max-h-full p-6', workbenchVisible && 'p-0 pl-4')}>
      <Tabs
        defaultValue="log"
        className="h-full w-full [&_[role='tabpanel']]:mt-4 [&_[role='tabpanel']]:h-[calc(100vh-11.5rem)] [&_[role='tabpanel']]:overflow-y-auto [&_[role='tabpanel']]:overflow-x-hidden"
      >
        <TabsList>
          <TabsTrigger value="log" className="text-xs">
            Log
          </TabsTrigger>
          <TabsTrigger value="stat" className="text-xs">
            Stat
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
