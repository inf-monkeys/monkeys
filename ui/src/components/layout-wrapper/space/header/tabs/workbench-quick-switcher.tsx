import React, { useEffect, useMemo, useState } from 'react';

import { keyBy } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CustomizationHeadbarTheme } from '@/apis/common/typings';
import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn, getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

import { useCurrentPage, useSetCurrentPage } from '@/store/useCurrentPageStore';

interface IWorkbenchQuickSwitcherProps {
  headbarTheme: CustomizationHeadbarTheme;
  onEnsureWorkbench?: () => void;
}

const DEFAULT_LABEL = '选择视图';

const getPageInfo = (page?: Partial<IPinPage>) => page?.workflow ?? page?.agent ?? page?.designProject ?? page?.info;

export const WorkbenchQuickSwitcher: React.FC<IWorkbenchQuickSwitcherProps> = ({ headbarTheme, onEnsureWorkbench }) => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();
  const { data: workspaceData } = useWorkspacePages();

  const currentPage = useCurrentPage();
  const setCurrentPage = useSetCurrentPage();

  const [selectedWorkbenchPageName, setSelectedWorkbenchPageName] = useState(DEFAULT_LABEL);

  const firstGroupWithPages = useMemo(() => {
    if (!workspaceData?.groups?.length) return null;
    const firstGroup = workspaceData.groups[0];
    if (!firstGroup?.pageIds?.length) return null;
    const pageMap = keyBy(workspaceData.pages ?? [], 'id');
    const pages = firstGroup.pageIds
      .map((pageId) => pageMap[pageId])
      .filter(Boolean) as IPinPage[];
    if (!pages.length) return null;
    return { group: firstGroup, pages };
  }, [workspaceData?.groups, workspaceData?.pages]);

  const firstGroupPages = firstGroupWithPages?.pages;

  const getPageDisplayName = (page?: Partial<IPinPage>) =>
    getI18nContent(getPageInfo(page)?.displayName) ??
    t([
      `workspace.wrapper.space.tabs.${page?.displayName ?? ''}`,
      getI18nContent(page?.displayName) ?? '',
      DEFAULT_LABEL,
    ]);

  const getPageIconUrl = (page?: Partial<IPinPage>) => getPageInfo(page)?.iconUrl;
  const getPageInstanceIcon = (page?: Partial<IPinPage>) => page?.instance?.icon ?? 'layout-grid';

  useEffect(() => {
    const currentTeamPage = currentPage?.[teamId];

    if (currentTeamPage) {
      const activeName = getPageDisplayName(currentTeamPage) ?? DEFAULT_LABEL;
      if (activeName !== selectedWorkbenchPageName) {
        setSelectedWorkbenchPageName(activeName);
      }
      return;
    }

    if (firstGroupPages?.length) {
      const firstPageName = getPageDisplayName(firstGroupPages[0]) ?? DEFAULT_LABEL;
      if (firstPageName !== selectedWorkbenchPageName) {
        setSelectedWorkbenchPageName(firstPageName);
      }
      return;
    }

    if (selectedWorkbenchPageName !== DEFAULT_LABEL) {
      setSelectedWorkbenchPageName(DEFAULT_LABEL);
    }
  }, [currentPage, teamId, firstGroupPages, selectedWorkbenchPageName, t]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className={cn(
            'ml-2 inline-flex items-center gap-1 rounded-sm border border-transparent px-1.5 py-0.5 text-xs font-medium transition-colors flex-none focus:outline-none focus-visible:outline-none focus-visible:ring-0',
            headbarTheme === 'glassy'
              ? 'text-white/80 hover:bg-white/20'
              : 'text-muted-foreground hover:border-border hover:bg-muted',
          )}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <span className="truncate" title={selectedWorkbenchPageName}>
            {selectedWorkbenchPageName}
          </span>
          <ChevronDown className="size-3" strokeWidth={2} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-0" sideOffset={6}>
        {firstGroupWithPages ? (
          firstGroupWithPages.pages.map((page) => (
            <DropdownMenuItem
              key={page.id}
              className="flex items-center gap-2 py-1.5"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const pageDisplayName = getPageDisplayName(page) ?? DEFAULT_LABEL;
                setSelectedWorkbenchPageName(pageDisplayName);
                onEnsureWorkbench?.();
                setCurrentPage({
                  [teamId]: { ...page, groupId: firstGroupWithPages.group.id },
                });
                VinesEvent.emit('vines-nav', '/$teamId/', { teamId });
              }}
            >
              {getPageIconUrl(page) ? (
                <VinesIcon className="size-4" size="sm" disabledPreview>
                  {getPageIconUrl(page)}
                </VinesIcon>
              ) : (
                <VinesLucideIcon className="size-4 text-muted-foreground" size={14} src={getPageInstanceIcon(page)} />
              )}
              <span className="text-sm font-medium leading-tight text-foreground">{getPageDisplayName(page)}</span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            暂无工作台分组
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
