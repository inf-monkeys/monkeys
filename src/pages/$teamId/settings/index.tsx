import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { UserSettings } from '@/pages/$teamId/settings/user/index.component.tsx';

const SIDEBAR_LIST = [
  {
    label: '个人中心',
    key: 'user',
  },
  {
    label: '团队成员',
    key: 'team-members',
  },
  {
    label: '团队账户',
    key: 'team-payment',
  },
  {
    label: '团队主题',
    key: 'team-theme',
  },
  {
    label: '团队数据',
    key: 'team-data',
  },
  {
    label: 'API 密钥管理',
    key: 'api-key',
  },
];

export const Settings: React.FC = () => {
  return (
    <>
      <Tabs defaultValue="user" className="flex w-full items-start gap-3" orientation="vertical">
        <TabsList className="w-32">
          {SIDEBAR_LIST.map((item) => (
            <TabsTrigger key={item.key} value={item.key} className="text-xs">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="user">
          <UserSettings />
        </TabsContent>
      </Tabs>
    </>
  );
};

export const Route = createFileRoute('/$teamId/settings/')({
  component: Settings,
  beforeLoad: teamIdGuard,
});
