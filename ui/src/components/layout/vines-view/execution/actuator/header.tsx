import React from 'react';

import { useClipboard } from '@mantine/hooks';
import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ExecutionStatusIcon } from '@/components/layout/vines-view/execution/status-icon';
import { getExecutionStatusText } from '@/components/layout/vines-view/execution/status-icon/utils.ts';
import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { execCopy } from '@/utils';

interface IActuatorHeaderProps {
  instanceId: string;
  workflowStatus: VinesWorkflowExecution['status'] | string;
  children?: React.ReactNode;
}

export const ActuatorHeader: React.FC<IActuatorHeaderProps> = ({ instanceId, workflowStatus, children }) => {
  const { t } = useTranslation();
  const clipboard = useClipboard({ timeout: 500 });

  const status = getExecutionStatusText(workflowStatus as string, workflowStatus as string);

  return (
    <header className="flex w-full items-center gap-4 pl-2">
      <ExecutionStatusIcon
        size={45}
        workflowStatus={workflowStatus as string}
        status={workflowStatus as string}
        spinClassName="scale-90 -ml-0"
      />
      <div>
        <h1 className="text-xl font-bold">{t([`workspace.pre-view.actuator.execution.status.${status}`, status])}</h1>
        <div className="flex items-center gap-2">
          <CardDescription className="line-clamp-1">
            {t('workspace.pre-view.actuator.execution.instance-id', { instanceId })}
          </CardDescription>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="-m-2 scale-50"
                icon={<Copy />}
                onClick={(e) => {
                  e.stopPropagation();
                  clipboard.copy(instanceId);
                  if (!clipboard.copied && !execCopy(instanceId)) toast.error(t('common.toast.copy-failed'));
                  else toast.success(t('common.toast.copy-success'));
                }}
                variant="outline"
              />
            </TooltipTrigger>
            <TooltipContent>{t('common.utils.click-to-copy')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="ml-4 flex flex-1 justify-end">{children}</div>
    </header>
  );
};
