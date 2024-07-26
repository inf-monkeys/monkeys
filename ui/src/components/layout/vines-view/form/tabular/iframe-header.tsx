import React from 'react';

import { CircleEllipsisIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { useVinesOriginWorkflow } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

interface IIframeHeaderProps {
  historyVisible: boolean;
  setHistoryVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const IframeHeader: React.FC<IIframeHeaderProps> = ({ historyVisible, setHistoryVisible }) => {
  const { t } = useTranslation();

  const { workflow } = useVinesOriginWorkflow();

  return (
    <>
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2.5">
          <VinesIcon size="sm">{workflow?.iconUrl || 'emoji:🍀:#ceefc5'}</VinesIcon>
          <div className="flex flex-col gap-0.5">
            <h1 className="font-bold leading-tight">{getI18nContent(workflow?.displayName)}</h1>
            {workflow?.description && <span className="text-xxs">{getI18nContent(workflow?.description)}</span>}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setHistoryVisible(!historyVisible)} variant="outline" size="small">
            {t('workspace.pre-view.actuator.frame.history', {
              status: historyVisible ? t('workspace.pre-view.actuator.frame.close') : '',
            })}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button icon={<CircleEllipsisIcon />} variant="outline" size="small" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
              <div className="flex items-center gap-2">
                <VinesDarkMode />
                <I18nSelector />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      <div className="px-4">
        <Separator orientation="horizontal" />
      </div>
    </>
  );
};
