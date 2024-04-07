import React, { useLayoutEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Account } from '@/components/layout/settings/account';
import { ApiKey } from '@/components/layout/settings/api-key';
import { VinesTheme } from '@/components/layout/settings/theme';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import VinesEvent from '@/utils/events.ts';

export const Settings: React.FC = () => {
  useLayoutEffect(() => {
    VinesEvent.emit('vines-update-site-title', '配置中心');
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">配置中心</h2>
      <Tabs
        defaultValue="account"
        className="[&_[role='tabpanel']]:mt-4 [&_[role='tabpanel']]:h-[calc(100vh-11.5rem)] [&_[role='tabpanel']]:overflow-y-auto [&_[role='tabpanel']]:overflow-x-hidden"
      >
        <TabsList>
          <TabsTrigger value="account" className="text-xs">
            账号中心
          </TabsTrigger>
          <TabsTrigger value="theme" className="text-xs">
            团队主题
          </TabsTrigger>
          <TabsTrigger value="api-key" className="text-xs">
            API 密钥
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Account />
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
