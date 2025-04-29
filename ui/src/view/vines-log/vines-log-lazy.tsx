import React from 'react';

import { Telescope } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesLogViewLogTab } from '@/components/layout/workspace/vines-view/log/log';
import { VinesLogViewLogObservabilityModal } from '@/components/layout/workspace/vines-view/log/log/observability';
import { VinesLogViewStatTab } from '@/components/layout/workspace/vines-view/log/stat';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import useUrlState from '@/hooks/use-url-state.ts';
import { usePageStore } from '@/store/usePageStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

const VinesLogView: React.FC = () => {
  const { t } = useTranslation();

  const visible = useViewStore((s) => s.visible);
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);
  const vinesIFrameVisible = usePageStore((s) => s.vinesIFrameVisible);

  const containerHeight = usePageStore((s) => s.containerHeight);

  const height = containerHeight - (vinesIFrameVisible ? 0 : workbenchVisible ? 32 : 48) - 60;

  const [{ tab }, setTab] = useUrlState({ tab: 'log' });

  return (
    <main className={cn('relative h-full max-h-full p-6', workbenchVisible && 'p-4')}>
      <Tabs
        value={tab}
        onValueChange={(val) => setTab({ tab: val })}
        className="h-full w-full [&>[role='tabpanel']]:mt-4 [&>[role='tabpanel']]:overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="log" className="text-xs">
              {t('workspace.logs-view.log.title')}
            </TabsTrigger>
            <TabsTrigger value="stat" className="text-xs">
              {t('workspace.logs-view.stat.title')}
            </TabsTrigger>
          </TabsList>
          <VinesLogViewLogObservabilityModal>
            <Button variant="outline" icon={<Telescope />}>
              {t('workspace.logs-view.observability.title')}
            </Button>
          </VinesLogViewLogObservabilityModal>
        </div>
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

export default VinesLogView;
