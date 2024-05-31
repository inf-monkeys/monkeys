import React from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { get } from 'lodash';
import { AlertCircle, CheckCircle, FullscreenIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CodePreview } from '@/components/ui/code-editor/preview.tsx';
import { VinesHighlighter } from '@/components/ui/highlighter';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { JSONValue } from '@/package/vines-flow/core/tools/typings.ts';

interface IToolDisplayProps {
  data?: JSONValue[];
}

export const ToolDisplay: React.FC<IToolDisplayProps> = ({ data }) => {
  const { vines } = useVinesFlow();

  const latestExtra = data?.at(-1);
  const latestExtraStatus: string = get(latestExtra, 'detailedInfo.status', '');
  const latestExtraResult = get(
    latestExtra,
    'detailedInfo.result',
    get(latestExtra, 'detailedInfo.arguments', {}),
  ) as JSONValue;

  let toolName = '';
  let toolDesc = '';
  let toolIcon = '';
  if (latestExtra) {
    const extraToolName = get(latestExtra, 'detailedInfo.toolName', '');
    const vinesTool = vines.getTool(extraToolName);
    toolName = get(vinesTool, 'displayName', extraToolName);
    toolDesc = get(vinesTool, 'description', '');
    toolIcon = get(vinesTool, 'icon', 'emoji:🍀:#ceefc5');
  }

  return (
    latestExtra && (
      <div className="mb-2 flex max-w-full flex-col items-center gap-2 overflow-hidden rounded border border-input p-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <VinesIcon size="md">{toolIcon}</VinesIcon>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-base font-bold leading-tight">{toolName}</h1>
              <span className="text-xs leading-tight text-gray-10">{toolDesc}</span>
            </div>
          </div>
          {latestExtraStatus === 'inprogress' && (
            <CircularProgress
              className="-m-3 -mr-2 scale-[.5] [&_circle:last-child]:stroke-vines-500"
              size="lg"
              aria-label="Loading..."
            />
          )}
          {latestExtraStatus === 'success' && <CheckCircle size={20} className="mr-1 stroke-green-10" />}
          {latestExtraStatus === 'failed' && <AlertCircle size={20} className="mr-1 stroke-red-10" />}
        </div>
        <Separator />

        <div className="relative flex h-28 w-full">
          <ScrollArea>
            <VinesHighlighter language="json">{JSON.stringify(latestExtraResult, null, 2) as string}</VinesHighlighter>
          </ScrollArea>
          <div className="absolute -bottom-1 -right-2 flex scale-80 items-center gap-2">
            <Tooltip>
              <CodePreview data={data ?? []} lineNumbers={3} minimap>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="small">
                    RAW
                  </Button>
                </TooltipTrigger>
              </CodePreview>
              <TooltipContent>查看原始数据</TooltipContent>
            </Tooltip>
            <Tooltip>
              <CodePreview data={latestExtraResult} lineNumbers={3} minimap>
                <TooltipTrigger asChild>
                  <Button icon={<FullscreenIcon />} variant="outline" size="small" />
                </TooltipTrigger>
              </CodePreview>
              <TooltipContent>放大查看数据</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    )
  );
};
