import React, { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowValidation } from '@/apis/workflow/validation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { IVinesFlowRenderType, VINES_STATUS } from '@/package/vines-flow/core/typings.ts';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesExpandToolErrorsProps {
  disabled?: boolean;
}

interface VinesToolIssue {
  messages: string[];
  nodeId: string;
  nodeName: string;
  nodeIcon: string;
}

export const VinesExpandToolErrors: React.FC<IVinesExpandToolErrorsProps> = ({ disabled }) => {
  const { t, i18n } = useTranslation();

  const { vines } = useVinesFlow();

  const isVinesFlowLoading = vines.status === VINES_STATUS.IDLE;
  const isComplicate = vines.renderOptions.type === IVinesFlowRenderType.COMPLICATE;

  const { data } = useWorkflowValidation(vines.workflowId ?? '', vines.version);

  const [validationIssues, setValidationIssues] = useState<VinesToolIssue[]>([]);

  const hasValidationIssues = (data?.validationIssues?.length ?? 0) > 0;
  useEffect(() => {
    if (!data || !hasValidationIssues || isVinesFlowLoading) return;

    const issuesMap = new Map<string, string[]>();
    data.validationIssues.forEach((issue) => {
      const messages = issuesMap.get(issue.taskReferenceName) ?? [];
      issuesMap.set(issue.taskReferenceName, [
        ...messages,
        issue.humanMessage[i18n.language === 'en-US' ? 'en' : 'zh'],
      ]);
    });

    setValidationIssues(
      Array.from(issuesMap.entries()).map(([nodeId, messages]) => {
        const node = vines.getNodeById(nodeId);
        const nodeCustomData = node?.customData;
        const tool = vines.getTool(node?.getRaw()?.name ?? '');

        const isEndNodeName = nodeId === 'workflow_end' ? t('workspace.flow-view.vines.tools.end.name') : null;
        const isStartNodeName = nodeId === 'workflow_start' ? t('workspace.flow-view.vines.tools.start.name') : null;

        const isEndNodeIcon = nodeId === 'workflow_end' ? 'emoji:🏁:#fff' : null;
        const isStartNodeIcon = nodeId === 'workflow_start' ? 'emoji:🚀:#fff' : null;

        return {
          messages: messages,
          nodeId,
          nodeName:
            isEndNodeName || isStartNodeName
              ? (isEndNodeName || isStartNodeName) ?? ''
              : getI18nContent(tool?.displayName) ?? '' + (nodeCustomData?.title ? `（${nodeCustomData?.title}）` : ''),
          nodeIcon: isEndNodeIcon || isStartNodeIcon ? (isEndNodeIcon || isStartNodeIcon) ?? '' : tool?.icon ?? '',
        };
      }),
    );
  }, [data, vines.tools, i18n.language]);

  const handleFocusNode = (nodeId: string) => {
    VinesEvent.emit('canvas-zoom-to-node', (isComplicate ? 'complicate-' : '') + nodeId);
  };

  return (
    <motion.div animate={{ opacity: disabled || !hasValidationIssues || isVinesFlowLoading ? 0 : 1 }}>
      <Card className="absolute right-0 top-16 flex flex-col flex-nowrap gap-2 p-2">
        {validationIssues.map(({ messages, nodeIcon, nodeName, nodeId }, i) => (
          <div className="flex w-full max-w-64 flex-col gap-1 rounded-md bg-muted p-2" key={i}>
            <div className="flex items-center justify-between gap-8">
              <div className="flex min-w-36 items-center gap-2">
                <VinesIcon src={nodeIcon} size="xs" />
                <p className="line-clamp-1 max-w-24 text-sm font-bold leading-tight">{nodeName}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    icon={<Crosshair />}
                    className="!scale-75"
                    variant="outline"
                    onClick={() => handleFocusNode(nodeId)}
                  />
                </TooltipTrigger>
                <TooltipContent>{t('workspace.flow-view.error.tips')}</TooltipContent>
              </Tooltip>
            </div>
            {messages.map((it, index) => (
              <p className="text-xs" key={index}>
                - {it}
              </p>
            ))}
          </div>
        ))}
      </Card>
    </motion.div>
  );
};
