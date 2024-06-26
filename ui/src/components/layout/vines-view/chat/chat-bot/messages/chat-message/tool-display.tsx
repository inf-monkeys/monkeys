import React from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { AlertCircle, CheckCircle, FullscreenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useKnowledgeBases } from '@/apis/knowledge-base';
import { Button } from '@/components/ui/button';
import { CodePreview } from '@/components/ui/code-editor/preview.tsx';
import { VinesHighlighter } from '@/components/ui/highlighter';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { JSONValue } from '@/package/vines-flow/core/tools/typings.ts';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';
type Status = 'inprogress' | 'success' | 'failed';

export interface ToolCallLogDetailedInfo {
  toolCallId: string;
  toolName: string;
  arguments: JSONValue;
  result: JSONValue;
  status: Status;
}

export interface RetriveKnowledgeBaseDetailedInfo {
  knowledgeBaseId: string;
}

export interface ChatCompelitionLog {
  type: 'retrive_knowledge_base' | 'tool_call';
  level: LogLevel;
  message: string;
  detailedInfo: ToolCallLogDetailedInfo | RetriveKnowledgeBaseDetailedInfo;
}

interface IToolDisplayProps {
  data?: ChatCompelitionLog[];
}

export const ToolDisplay: React.FC<IToolDisplayProps> = ({ data }) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();
  const { data: knowledges } = useKnowledgeBases();
  const chatCompelitionLog = data?.at(-1);

  if (!chatCompelitionLog) {
    return <></>;
  }

  const { type, message, detailedInfo } = chatCompelitionLog;

  let status: Status = 'inprogress';
  let result: JSONValue = {};

  let toolDisplayName = '';
  let toolDesc = '';
  let toolIcon = '';
  if (type === 'retrive_knowledge_base') {
    status = 'success';
    result = message;
    const knowledgeBaseId = (detailedInfo as RetriveKnowledgeBaseDetailedInfo).knowledgeBaseId;
    const knowledgeBase = knowledges?.find((k) => k.uuid === knowledgeBaseId);
    if (knowledgeBase) {
      toolDisplayName = knowledgeBase.displayName;
      toolDesc = knowledgeBase.description || '';
      toolIcon = knowledgeBase.iconUrl || 'emoji:📚:#f0f0f0';
    }
  } else if (type === 'tool_call') {
    status = (detailedInfo as ToolCallLogDetailedInfo).status;
    result = (detailedInfo as ToolCallLogDetailedInfo).result || (detailedInfo as ToolCallLogDetailedInfo).arguments;
    const toolName = (detailedInfo as ToolCallLogDetailedInfo).toolName;
    const vinesTool = vines.getTool(toolName);
    toolDisplayName = vinesTool?.displayName || toolName;
    toolDesc = vinesTool?.description || '';
    toolIcon = vinesTool?.icon || 'emoji:🛠:#f0f0f0';
  }

  return (
    chatCompelitionLog && (
      <div className="mb-2 flex max-w-full flex-col items-center gap-2 overflow-hidden rounded border border-input p-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <VinesIcon size="md">{toolIcon}</VinesIcon>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-base font-bold leading-tight">{toolDisplayName}</h1>
              <span className="text-xs leading-tight text-gray-10">{toolDesc}</span>
            </div>
          </div>
          {status === 'inprogress' && (
            <CircularProgress
              className="-m-3 -mr-2 scale-[.5] [&_circle:last-child]:stroke-vines-500"
              size="lg"
              aria-label="Loading..."
            />
          )}
          {status === 'success' && <CheckCircle size={20} className="mr-1 stroke-green-10" />}
          {status === 'failed' && <AlertCircle size={20} className="mr-1 stroke-red-10" />}
        </div>
        <Separator />

        <div className="relative flex h-28 w-full">
          <ScrollArea>
            {type === 'tool_call' ? (
              <VinesHighlighter language="json">{JSON.stringify(result, null, 2) as string}</VinesHighlighter>
            ) : (
              <VinesHighlighter language="markdown">{result as string}</VinesHighlighter>
            )}
          </ScrollArea>
          <div className="absolute -bottom-1 -right-2 flex scale-80 items-center gap-2">
            <Tooltip>
              <CodePreview data={data ?? ([] as any[])} lineNumbers={3} minimap>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="small">
                    RAW
                  </Button>
                </TooltipTrigger>
              </CodePreview>
              <TooltipContent>{t('workspace.chat-view.chat-bot.tool-display.raw-preview')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <CodePreview data={result} lineNumbers={3} minimap>
                <TooltipTrigger asChild>
                  <Button icon={<FullscreenIcon />} variant="outline" size="small" />
                </TooltipTrigger>
              </CodePreview>
              <TooltipContent>{t('workspace.chat-view.chat-bot.tool-display.scale-to-preview')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    )
  );
};
