import React from 'react';

import { SettingsIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IChatViewOptionsProps {}

export const WorkflowChatViewOptions: React.FC<IChatViewOptionsProps> = () => {
  const { t } = useTranslation();
  const { page, setCustomOptions } = useVinesPage();

  const isHideExecutionProcessEnabled = page?.customOptions?.showExecutionProcess ?? false;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              className="border-transparent bg-slate-1 !p-1 shadow-none"
              icon={<SettingsIcon />}
              variant="outline"
              size="small"
            />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('workspace.chat-view.workflow-mode.options.label')}</TooltipContent>
      </Tooltip>
      <PopoverContent side="right" align="start" className="w-auto">
        <div className="flex items-center space-x-2">
          <Switch
            id="airplane-mode"
            size="small"
            checked={isHideExecutionProcessEnabled}
            onCheckedChange={(val) => setCustomOptions({ showExecutionProcess: val })}
          />
          <Label className="text-sm">
            {t('workspace.chat-view.workflow-mode.options.show-execution-process.label')}
          </Label>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('workspace.chat-view.workflow-mode.options.show-execution-process.tips')}
        </span>
      </PopoverContent>
    </Popover>
  );
};
