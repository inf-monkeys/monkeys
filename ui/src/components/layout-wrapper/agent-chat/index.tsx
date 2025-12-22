/**
 * Agent 聊天页面布局
 * 只包含 headbar 和聊天内容，不显示侧边栏
 */

import React from 'react';
import { Outlet } from '@tanstack/react-router';
import { get } from 'lodash';
import { useSystemConfig } from '@/apis/common';
import { TeamSelector } from '@/components/layout/main/sidebar/teams/team-selector';
import { SpaceHeader } from '@/components/layout-wrapper/space/header';
import { ViewGuard } from '@/components/layout-wrapper/view-guard';
import { cn } from '@/utils';

export const AgentChatLayout: React.FC = () => {
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');

  // 根据主题模式应用不同样式
  const isShadowMode = themeMode === 'shadow';
  const backgroundClass = isShadowMode ? 'bg-[#f2f3f4] dark:bg-[#000000]' : 'bg-neocard';

  const showTeamSelector =
    oem &&
    (!oem.theme.headbar || oem.theme.headbar.actions === '*' || oem.theme.headbar.actions?.includes('team-selector'));

  return (
    <ViewGuard className={cn('flex h-screen flex-col gap-global', backgroundClass)}>
      {/* Headbar */}
      <SpaceHeader tail={showTeamSelector ? <TeamSelector /> : undefined} disableSeparator />

      {/* 聊天内容区域 - 占满剩余空间 */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </ViewGuard>
  );
};
