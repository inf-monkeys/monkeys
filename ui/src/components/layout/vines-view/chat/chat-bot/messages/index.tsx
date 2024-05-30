import React, { useEffect, useRef, useState } from 'react';

import { useClipboard } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';
import { get, isEmpty } from 'lodash';
import { AlertCircle, CheckCircle, Copy, CopyCheck, FullscreenIcon } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { IVinesMessage } from '@/components/layout/vines-view/chat/chat-bot/use-chat.ts';
import { AutoScroll } from '@/components/layout/vines-view/chat/workflow-mode/messages/virtualized/auto-scroll.tsx';
import { VinesRealTimeChatMessage } from '@/components/layout/vines-view/chat/workflow-mode/messages/virtualized/chat-message/real-time.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { CodePreview } from '@/components/ui/code-editor/preview.tsx';
import { VinesHighlighter } from '@/components/ui/highlighter';
import { VinesMarkdown } from '@/components/ui/markdown';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow';
import { JSONValue } from '@/package/vines-flow/core/tools/typings.ts';

interface IVirtualizedListProps {
  data: IVinesMessage[];
  isLoading: boolean;
  userPhoto: string;
  botPhoto: string;
}

const EMPTY_CONTENT = String.fromCharCode(12288);

export const VirtualizedList: React.FC<IVirtualizedListProps> = ({ data, isLoading, userPhoto, botPhoto }) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);

  const { vines } = useVinesFlow();

  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({ align: 'end', behavior: 'auto', index: 'LAST' });
    }
  }, []);

  const overScan = window.innerHeight;

  const LastItemIndex = data.length - 1;

  const clipboard = useClipboard();

  return (
    <main className="relative flex h-full flex-col [&>div]:overflow-x-hidden">
      <Virtuoso
        atBottomStateChange={setAtBottom}
        atBottomThreshold={60}
        data={data}
        context={{ virtuosoRef }}
        followOutput={'auto'}
        initialTopMostItemIndex={LastItemIndex}
        itemContent={(index: number, data: IVinesMessage) => {
          const isUser = data.role === 'user';
          const content = data.content ?? '';
          const isEmptyMessage = isEmpty(content.trim());

          const extra = data.extra;
          const latestExtra = extra?.at(-1);
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
            <div className="flex flex-col gap-6 py-4">
              {isUser ? (
                <div className="group flex w-full max-w-full flex-row-reverse gap-4">
                  <Avatar className="size-8 cursor-pointer">
                    <AvatarImage className="aspect-auto" src={userPhoto} alt={isUser ? 'user' : 'assistant'} />
                    <AvatarFallback className="rounded-none p-2 text-xs">
                      {isUser ? 'user' : 'assistant'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <Card className="p-4 text-sm">{content}</Card>
                  </div>
                </div>
              ) : (
                <div className="group flex flex-row items-start gap-4">
                  <VinesIcon size="sm">{botPhoto}</VinesIcon>
                  <Card className="relative max-w-[calc(100%-3rem)] p-4 text-sm">
                    {latestExtra && (
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
                          {latestExtraStatus === 'success' && (
                            <CheckCircle size={20} className="mr-1 stroke-green-10" />
                          )}
                          {latestExtraStatus === 'failed' && <AlertCircle size={20} className="mr-1 stroke-red-10" />}
                        </div>
                        <Separator />

                        <div className="relative flex h-28 w-full">
                          <ScrollArea>
                            <VinesHighlighter language="json">
                              {JSON.stringify(latestExtraResult, null, 2) as string}
                            </VinesHighlighter>
                          </ScrollArea>
                          <div className="absolute -bottom-1 -right-2 flex scale-80 items-center gap-2">
                            <Tooltip>
                              <CodePreview data={latestExtra} lineNumbers={3} minimap>
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
                    )}
                    <VinesMarkdown
                      className={isLoading && LastItemIndex === index ? 'vines-result-streaming' : ''}
                      allowHtml
                    >
                      {content + (isEmptyMessage ? EMPTY_CONTENT : '')}
                    </VinesMarkdown>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          icon={clipboard.copied ? <CopyCheck /> : <Copy />}
                          variant="outline"
                          size="small"
                          className="absolute -bottom-1 -right-9 flex scale-80 gap-2 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => clipboard.copy(content)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>复制</TooltipContent>
                    </Tooltip>
                  </Card>
                </div>
              )}
            </div>
          );
        }}
        components={{
          Footer: VinesRealTimeChatMessage,
        }}
        overscan={overScan}
        ref={virtuosoRef}
      />
      <AutoScroll
        atBottom={atBottom}
        onScrollToBottom={(type) => {
          const virtuoso = virtuosoRef.current;
          switch (type) {
            case 'auto': {
              virtuoso?.scrollToIndex({ align: 'end', behavior: 'auto', index: 'LAST' });
              break;
            }
            case 'click': {
              virtuoso?.scrollToIndex({ align: 'end', behavior: 'smooth', index: 'LAST' });
              break;
            }
          }
        }}
      />
    </main>
  );
};

VirtualizedList.displayName = 'VinesOpenAIMessageVirtualizedList';
