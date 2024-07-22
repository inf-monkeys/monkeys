import React from 'react';

import { useParams } from '@tanstack/react-router';

import { LogIn, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getVinesToken } from '@/apis/utils.ts';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { VinesLogo } from '@/components/layout/main/vines-logo.tsx';
import { IntegrationCenter } from '@/components/layout-wrapper/workspace/header/expand/integration-center';
import { UserCard } from '@/components/layout-wrapper/workspace/header/expand/user-card.tsx';
import { WorkflowInfoCard } from '@/components/layout-wrapper/workspace/header/workflow-info-card.tsx';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePageStore } from '@/store/usePageStore';
import VinesEvent from '@/utils/events.ts';

interface IWorkspaceHeaderProps extends React.ComponentPropsWithoutRef<'header'> {}

export const WorkspaceHeader: React.FC<IWorkspaceHeaderProps> = () => {
  const { t } = useTranslation();

  const { teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const { visibleCustomSetting, setVisibleCustomSetting } = usePageStore();

  const hasToken = !!getVinesToken();

  return (
    <header className="flex h-14 w-full items-center justify-between bg-slate-1 px-6 shadow-sm">
      <div className="z-20 flex h-full items-center gap-5">
        <VinesLogo
          description=""
          height={32}
          className={hasToken ? 'cursor-pointer' : ''}
          onClick={() => hasToken && VinesEvent.emit('vines-nav', '/$teamId', { teamId })}
        />
        <Separator orientation="vertical" className="h-1/2" />
        <WorkflowInfoCard />
      </div>
      <div className="z-20 flex items-center gap-6">
        <IntegrationCenter />
        <div className="flex gap-3">
          {hasToken && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  icon={<Settings2 />}
                  variant="outline"
                  size="small"
                  onClick={() => setVisibleCustomSetting(!visibleCustomSetting)}
                />
              </TooltipTrigger>
              <TooltipContent>{t('workspace.wrapper.settings.label')}</TooltipContent>
            </Tooltip>
          )}
          <VinesDarkMode className="-mx-0.5 scale-90" />
          <I18nSelector className="-mx-0.5 scale-90" />
        </div>
        {hasToken ? (
          <UserCard />
        ) : (
          <Button
            variant="outline"
            size="small"
            icon={<LogIn />}
            onClick={() => VinesEvent.emit('vines-nav', '/login')}
          >
            {t('auth.login.login')}
          </Button>
        )}
      </div>
    </header>
  );
};
