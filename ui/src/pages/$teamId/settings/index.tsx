import React, { useLayoutEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { Account } from '@/components/layout/settings/account';
import { ApiKey } from '@/components/layout/settings/api-key';
import { VinesTheme } from '@/components/layout/settings/theme';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import VinesEvent from '@/utils/events.ts';
import { VinesLogViewStatTab } from '@/components/layout/vines-view/execution-log/stat';
import { Stat } from '@/components/layout/settings/stat';

export const Settings: React.FC = () => {
  const { t } = useTranslation();

  useLayoutEffect(() => {
    VinesEvent.emit('vines-update-site-title', t('settings.title'));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      <Tabs
        defaultValue="account"
        className="[&_[role='tabpanel']]:mt-4 [&_[role='tabpanel']]:h-[calc(100vh-11.5rem)] [&_[role='tabpanel']]:overflow-y-auto [&_[role='tabpanel']]:overflow-x-hidden"
      >
        <TabsList>
          <TabsTrigger value="account" className="text-xs">
            {t('settings.account.title')}
          </TabsTrigger>
          <TabsTrigger value="stat" className="text-xs">
            {t('settings.stat.title')}
          </TabsTrigger>
          <TabsTrigger value="theme" className="text-xs">
            {t('settings.theme.title')}
          </TabsTrigger>
          <TabsTrigger value="api-key" className="text-xs">
            {t('settings.api-key.title')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Account />
        </TabsContent>
        <TabsContent value="stat">
          <Stat />
        </TabsContent>
        <TabsContent value="theme">
          <VinesTheme />
        </TabsContent>
        <TabsContent value="api-key">
          <ApiKey />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const Route = createFileRoute('/$teamId/settings/')({
  component: Settings,
  beforeLoad: teamIdGuard,
});
