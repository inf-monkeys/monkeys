import React, { memo } from 'react';

import { Copy, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ExecutionStatusIcon } from '@/components/layout/workspace/vines-view/execution/status-icon';
import { Button } from '@/components/ui/button';
import { Card, CardDescription } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useCopy } from '@/hooks/use-copy.ts';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';

interface IVinesBotChatMessageProps {
  botPhoto: string;
  endTime?: string;
  instanceId: string;
  status: VinesWorkflowExecution['status'];
  className?: string;
  children?: React.ReactNode;
}

export const VinesBotChatMessage = memo<IVinesBotChatMessageProps>(
  ({ botPhoto, endTime, instanceId, status, className, children }) => {
    const { t } = useTranslation();
    const { copy } = useCopy({ timeout: 500 });

    return (
      <div className={cn('group flex flex-row items-start gap-4', className)}>
        <VinesIcon size="sm">{botPhoto}</VinesIcon>

        <div className={cn('flex flex-col gap-1', endTime && '-mt-5')}>
          {endTime && (
            <span className="text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100">
              {endTime}
            </span>
          )}
          <Card className="p-4">
            {children}
            <Separator className="my-4" />
            <div className="group/footer flex items-center justify-between gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex gap-1">
                      <Workflow size={12} className="mt-0.5 stroke-muted-foreground" /> {instanceId}
                    </CardDescription>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="-m-2 scale-50 opacity-0 group-hover/footer:opacity-100"
                          icon={<Copy />}
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            copy(instanceId);
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>{t('common.utils.click-to-copy')}</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t('workspace.chat-view.workflow-mode.instance-id-tips')}</TooltipContent>
              </Tooltip>
              <ExecutionStatusIcon
                className="scale-80 -m-1"
                status={status as VinesNodeExecutionTask['status']}
                workflowStatus={status as string}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  },
);

VinesBotChatMessage.displayName = 'VinesBotChatMessage';
