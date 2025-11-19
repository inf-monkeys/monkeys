import React, { useEffect, useState } from 'react';

import { get, unionBy } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { CustomizationHeadbarTheme, VinesSpaceHeadbarModules } from '@/apis/common/typings';
import { useGetDesignProject } from '@/apis/designs';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { Tabs, TabsList, TabsTrigger, TabsVariant } from '@/components/ui/tabs';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn, getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

import { DesignsExtraInfo } from '../extra-info/designs';
import { WorkbenchQuickSwitcher } from './workbench-quick-switcher';

const HEADBAR_THEME_MAP: Record<CustomizationHeadbarTheme, TabsVariant> = {
  card: 'default',
  fixed: 'ghost',
  glassy: 'rounded',
  ghost: 'ghost',
};

const TAB_LIST: VinesSpaceHeadbarModules = [
  {
    id: 'workbench',
    icon: 'layers',
    visible: true,
    disabled: false,
  },
  {
    id: 'app-store',
    icon: 'package',
    visible: true,
    disabled: false,
  },
  {
    id: 'workspace',
    icon: 'package-plus',
    visible: true,
    disabled: false,
  },
];

const EXTRA_INFO_MAP: Record<string, React.FC<{ tabId?: string }>> = {
  designs: DesignsExtraInfo,
  'designs-templates': DesignsExtraInfo,
};

export interface ISpaceHeaderTabsProps {
  defaultValue?: string;
}

export const SpaceHeaderTabs: React.FC<ISpaceHeaderTabsProps> = ({ defaultValue }) => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  const { data: oem } = useSystemConfig();

  const oemVinesSpaceHeadbarModules: VinesSpaceHeadbarModules = get(oem, 'theme.modules.vinesSpaceHeadbar', []);

  const headbarTheme: CustomizationHeadbarTheme = get(oem, 'theme.headbar.theme', 'card');

  const {
    isUseWorkbench,
    isUseAppStore,
    isUsePanel,
    isUseCustomNav,
    routeCustomNavId,
    isUseDesign,
    routeDesignProjectId,
  } = useVinesRoute();

  // 获取当前设计项目信息，用于判断是否为模板
  const { data: currentDesignProject } = useGetDesignProject(routeDesignProjectId);

  const [value, setValue] = useState(defaultValue || 'workbench');

  useEffect(() => {
    if (isUseCustomNav && routeCustomNavId) {
      setValue(routeCustomNavId);
    } else if (isUseWorkbench) {
      setValue('workbench');
    } else if (isUseAppStore) {
      setValue('app-store');
    } else if (isUsePanel) {
      setValue('workspace');
    } else if (isUseDesign) {
      // 如果当前项目是模板，显示设计模板标签，否则显示设计项目标签
      if (currentDesignProject?.isTemplate) {
        setValue('designs-templates');
      } else {
        setValue('designs');
      }
    }
  }, [
    isUseWorkbench,
    isUseAppStore,
    isUsePanel,
    isUseCustomNav,
    routeCustomNavId,
    isUseDesign,
    currentDesignProject?.isTemplate,
  ]);

  const tabsList: VinesSpaceHeadbarModules = unionBy(oemVinesSpaceHeadbarModules, TAB_LIST, 'id');
  const workbenchHeadbarModule = tabsList.find((item) => item.id === 'workbench');
  const showWorkbenchQuickSwitcher = workbenchHeadbarModule?.showQuickSwitcher === true;

  return (
    <Tabs
      variant={HEADBAR_THEME_MAP[headbarTheme]}
      value={value}
      onValueChange={(val) => {
        if (tabsList.find((item) => item.id === val)?.disabled) return;
        switch (val) {
          case 'workbench':
            VinesEvent.emit('vines-nav', '/$teamId/', { teamId });
            break;
          case 'app-store':
            VinesEvent.emit('vines-nav', '/$teamId/store/', { teamId });
            break;
          case 'workspace':
            VinesEvent.emit('vines-nav', '/$teamId/evaluations', { teamId });
            break;
          default:
            VinesEvent.emit('vines-nav', `/$teamId/nav/$navId`, { teamId, navId: val });
            break;
        }
      }}
    >
      <TabsList className="!h-9" gap="10px">
        {tabsList
          .filter((item) => item.visible)
          .map((item) => {
            const ExtraInfo = EXTRA_INFO_MAP[item.id];
            return (
              <TabsTrigger
                key={item.id}
                className={cn('gap-1 py-1', headbarTheme === 'glassy' && 'gap-2')}
                value={item.id}
                onClick={() => {
                  if (item.id === 'designs') {
                    VinesEvent.emit('vines-nav', '/$teamId/nav/designs', { teamId });
                  } else if (item.id === 'designs-templates') {
                    VinesEvent.emit('vines-nav', '/$teamId/nav/designs-templates', { teamId });
                  }
                }}
              >
                {item.icon && (
                  <VinesLucideIcon
                    src={item.icon}
                    size={14}
                    className={cn(
                      'size-[14px]',
                      headbarTheme === 'glassy' && (item.id === value ? 'stroke-white' : 'stroke-vines-500'),
                    )}
                  />
                )}
                {getI18nContent(item.displayName, t(`components.layout.header.tabs.${item.id}`))}
                {item.id === 'workbench' && showWorkbenchQuickSwitcher && (
                  <WorkbenchQuickSwitcher headbarTheme={headbarTheme} onEnsureWorkbench={() => setValue('workbench')} />
                )}
                {ExtraInfo && <ExtraInfo tabId={item.id} />}
              </TabsTrigger>
            );
          })}
      </TabsList>
    </Tabs>
  );
};
