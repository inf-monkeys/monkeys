import React, { useLayoutEffect } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { Account } from '@/components/layout/settings/account';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import VinesEvent from '@/utils/events.ts';

const SIDEBAR_LIST = [
  {
    label: '账号中心',
    key: 'account',
  },
  {
    label: 'API 密钥管理',
    key: 'api-key',
  },
];

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
          {SIDEBAR_LIST.map(({ label, key }) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="account">
          <Account />
        </TabsContent>
        <TabsContent value="api-key"></TabsContent>
      </Tabs>
    </div>
  );
};

export const Route = createFileRoute('/$teamId/settings/')({
  component: Settings,
  beforeLoad: teamIdGuard,
});
