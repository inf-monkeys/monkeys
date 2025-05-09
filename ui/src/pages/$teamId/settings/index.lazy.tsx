import React, { useLayoutEffect } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { Account } from '@/components/layout/settings/account';
import { ApiKey } from '@/components/layout/settings/api-key';
import { Stat } from '@/components/layout/settings/stat';
import { TeamSettings } from '@/components/layout/settings/team';
import { TeamCredit } from '@/components/layout/settings/team-quota';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tabs, TabsContent } from '@/components/ui/tabs.tsx';
import useUrlState from '@/hooks/use-url-state.ts';
import VinesEvent from '@/utils/events.ts';

export const Settings: React.FC = () => {
  const { t } = useTranslation();

  const [{ tab }, setSettingsTab] = useUrlState<{ tab: 'account' | 'stat' | 'apikey' }>({
    tab: 'account',
  });

  useLayoutEffect(() => {
    VinesEvent.emit('vines-update-site-title', t('settings.title'));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* <h1 className="text-2xl font-bold">{t('settings.title')}</h1> */}
      <Tabs
        defaultValue="account"
        value={tab}
        onValueChange={(value) => setSettingsTab({ tab: value })}
        className="[&_[role='tabpanel']]:h-[calc(100vh-8.3rem)] [&_[role='tabpanel']]:overflow-y-auto [&_[role='tabpanel']]:overflow-x-hidden"
      >
        {/* <TabsList>
          <TabsTrigger value="account" className="text-xs">
            {t('settings.account.title')}
          </TabsTrigger>
          <TabsTrigger value="stat" className="text-xs">
            {t('settings.stat.title')}
          </TabsTrigger>
          <TabsTrigger value="apikey" className="text-xs">
            {t('settings.api-key.title')}
          </TabsTrigger>
        </TabsList> */}
        <TabsContent value="account" asChild>
          <ScrollArea className="-mr-3 pr-3" disabledOverflowMask>
            <Account />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="team-configurations" asChild>
          <ScrollArea className="-mr-3 pr-3" disabledOverflowMask>
            <TeamSettings />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="team-quota" asChild>
          <ScrollArea className="-mr-3 pr-3" disabledOverflowMask>
            <TeamCredit />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="stat" asChild>
          <ScrollArea className="-mr-3 pr-3" disabledOverflowMask>
            <Stat />
          </ScrollArea>
        </TabsContent>
        <TabsContent value="apikey" asChild>
          <ScrollArea className="-mr-3 pr-3" disabledOverflowMask>
            <ApiKey />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const Route = createLazyFileRoute('/$teamId/settings/')({
  component: Settings,
});
