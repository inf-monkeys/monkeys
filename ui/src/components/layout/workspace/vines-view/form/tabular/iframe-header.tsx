import React from 'react';

import { CircleEllipsisIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IPinPage } from '@/apis/pages/typings.ts';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { useVinesOriginWorkflow } from '@/components/layout-wrapper/workspace/utils.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useLocalStorage } from '@/hooks/use-local-storage';
import useUrlState from '@/hooks/use-url-state.ts';
import { getI18nContent } from '@/utils';

interface IIframeHeaderProps {
  historyVisible: boolean;
  setHistoryVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const IframeHeader: React.FC<IIframeHeaderProps> = ({ historyVisible, setHistoryVisible }) => {
  const { t } = useTranslation();

  const { workflow: data } = useVinesOriginWorkflow();

  const { teamId } = useVinesTeam();
  const [page] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const [{ hidden: routeHidden }] = useUrlState<{ hidden?: string }>();
  const hidden = (routeHidden?.toString() ?? '')?.split(',');

  const moreBtnVisible = !hidden.includes('form-header-more-btn');
  const historyBtnVisible = !hidden.includes('form-header-history-btn');

  const workflow = page?.[teamId]?.workflow ?? data;

  const displayName = getI18nContent(workflow?.displayName);

  return (
    <>
      <header className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <VinesIcon size="sm" disabledPreview>
            {workflow?.iconUrl || 'emoji:🍀:#eeeef1'}
          </VinesIcon>
          <div className="flex flex-col gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="line-clamp-1 text-sm font-bold leading-tight">{displayName}</h1>
              </TooltipTrigger>
              <TooltipContent>{displayName}</TooltipContent>
            </Tooltip>
            {workflow?.description && <span className="text-xxs">{getI18nContent(workflow?.description)}</span>}
          </div>
        </div>
        <div className="flex space-x-2">
          {historyBtnVisible && (
            <Button onClick={() => setHistoryVisible(!historyVisible)} variant="outline" size="small">
              {t('workspace.pre-view.actuator.frame.history', {
                status: historyVisible ? t('workspace.pre-view.actuator.frame.close') : '',
              })}
            </Button>
          )}
          {moreBtnVisible && (
            <Popover>
              <PopoverTrigger asChild>
                <Button icon={<CircleEllipsisIcon />} variant="outline" size="small" className="!py-0" />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <div className="flex items-center gap-2">
                  <VinesDarkMode />
                  <I18nSelector />
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </header>
      <div className="px-2 pt-2">
        <Separator orientation="horizontal" />
      </div>
    </>
  );
};
