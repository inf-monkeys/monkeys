import React, { useEffect } from 'react';

import { Link } from '@tanstack/react-router';

import { useClipboard } from '@mantine/hooks';
import { Tooltip, TooltipContent, TooltipTrigger } from '@radix-ui/react-tooltip';
import { Blocks, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { IApiKeyStatus } from '@/apis/api-keys/typings.ts';
import { curl } from '@/components/layout-wrapper/workspace/header/expand/integration-center/utils.ts';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesHighlighter } from '@/components/ui/highlighter';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatCompletionsTemplateZH from './templates/chat-completions.mdx';
import CompletionsTemplateZH from './templates/completions.mdx';

interface IIntegrationCenterProps extends React.ComponentPropsWithoutRef<'div'> {}

export const IntegrationCenter: React.FC<IIntegrationCenterProps> = () => {
  const { teamId } = useVinesTeam();
  const clipboard = useClipboard({ timeout: 500 });

  const { data: apiKeys } = useApiKeyList();

  const finalApikey = apiKeys?.find((key) => key.status === IApiKeyStatus.Valid);
  const urlPrefix = window.location.protocol + '//' + window.location.host;

  const { workflow } = useVinesPage();

  const workflowId = workflow?.workflowId;
  const workflowInputs = workflow?.variables;

  const [executionWorkflowCurl, setExecutionWorkflowCurl] = React.useState<string | null>(null);
  const [createChatSessionCurl, setCreateChatSessionCurl] = React.useState<string | null>(null);
  const [executionWorkflowWithChatSessionCurl, setExecutionWorkflowWithChatSessionCurl] = React.useState<string | null>(
    null,
  );

  useEffect(() => {
    const data: { [x: string]: any } = {
      waitForWorkflowFinished: true,
      inputData: {},
    };
    if (workflowInputs?.length) {
      for (const variable of workflowInputs) {
        const { name, default: defaultValue } = variable;
        data.inputData[name] = defaultValue || '';
      }
    }
    if (workflowId && urlPrefix) {
      const apikey = finalApikey ? finalApikey.apiKey : '$VINES_API_KEY';
      setExecutionWorkflowCurl(
        curl({
          method: 'post',
          url: `${urlPrefix}/api/workflow/executions/${workflowId}/start`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apikey}`,
          },
          body: data,
        }),
      );
      setCreateChatSessionCurl(
        curl({
          method: 'post',
          url: `${urlPrefix}/api/workflow/chat-sessions`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apikey}`,
          },
          body: {
            workflowId,
            displayName: '新的会话',
          },
        }),
      );
      setExecutionWorkflowWithChatSessionCurl(
        curl({
          method: 'post',
          url: `${urlPrefix}/api/workflow/executions/${workflowId}/start`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apikey}`,
          },
          body: { ...data, chatSessionId: '$CHAT_SESSION_ID' },
        }),
      );
    }
  }, [workflowInputs, workflowId, finalApikey, urlPrefix]);

  const apiBaseUrl = window.location.protocol + '//' + window.location.host + '/api';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="-mx-4 scale-90" icon={<Blocks />}>
          集成中心
        </Button>
      </DialogTrigger>

      {workflow?.exposeOpenaiCompatibleInterface ? (
        <DialogContent className="max-h max-w-6xl">
          <DialogTitle>集成中心</DialogTitle>
          <DialogDescription>你可以通过 API 与其他应用集成，以实现更多功能</DialogDescription>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            {workflow.variables?.find((variable) => variable.name === 'messages') ? (
              <ChatCompletionsTemplateZH
                // @ts-ignore
                apiBaseUrl={apiBaseUrl}
                apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                workflowId={workflowId}
              />
            ) : (
              <CompletionsTemplateZH
                // @ts-ignore
                apiBaseUrl={apiBaseUrl}
                apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                workflowId={workflowId}
              />
            )}
          </ScrollArea>
        </DialogContent>
      ) : (
        <DialogContent className="max-h max-w-xl">
          <DialogTitle>集成中心</DialogTitle>
          <DialogDescription>你可以通过 API 与其他应用集成，以实现更多功能</DialogDescription>
          <div className="vines-center h-80 w-full flex-col gap-4">
            {finalApikey ? (
              <ScrollArea>
                <div className="mb-4 flex w-full flex-col gap-2 rounded-md border border-input p-4">
                  <header className="flex items-start justify-between">
                    <div>
                      <h1 className="font-semibold">直接运行工作流</h1>
                      <span className="text-xs">只需要关注核心参数</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="small"
                          icon={<Copy />}
                          onClick={() => {
                            clipboard.copy(executionWorkflowCurl);
                            toast.success('已复制');
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>点击复制</TooltipContent>
                    </Tooltip>
                  </header>
                  <div className="max-h-80 max-w-[26.5rem] overflow-auto rounded-md bg-muted p-2">
                    <VinesHighlighter language="bash">{executionWorkflowCurl || ''}</VinesHighlighter>
                  </div>
                </div>
                <div className="mb-4 flex w-full flex-col gap-2 rounded-md border border-input p-4">
                  <header className="flex items-start justify-between">
                    <div>
                      <h1 className="font-semibold">在特定会话中运行工作流</h1>
                      <span className="text-xs">除了核心参数外，需额外传入 SessionId</span>
                      <span className="text-xs">可通过 SessionId 区分会话人，适用于多轮对话获取历史记录等场景</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="small"
                          icon={<Copy />}
                          onClick={() => {
                            clipboard.copy(executionWorkflowWithChatSessionCurl);
                            toast.success('已复制');
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>点击复制</TooltipContent>
                    </Tooltip>
                  </header>
                  <div className="max-h-80 max-w-[26.5rem] overflow-auto rounded-md bg-muted p-2">
                    <VinesHighlighter language="bash">{executionWorkflowWithChatSessionCurl || ''}</VinesHighlighter>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-md border border-input p-4">
                  <header className="flex items-start justify-between">
                    <div>
                      <h1 className="font-semibold">创建新的会话</h1>
                      <span className="text-xs">创建会话并得到特定的 SessionId</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="small"
                          icon={<Copy />}
                          onClick={() => {
                            clipboard.copy(createChatSessionCurl);
                            toast.success('已复制');
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>点击复制</TooltipContent>
                    </Tooltip>
                  </header>
                  <div className="max-h-80 max-w-[26.5rem] overflow-auto rounded-md bg-muted p-2">
                    <VinesHighlighter language="bash">{createChatSessionCurl || ''}</VinesHighlighter>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <>
                <h1 className="font-bold">暂无 APIKEY，请先到「配置中心」创建</h1>
                <Link to="/$teamId/settings" params={{ teamId }}>
                  <Button variant="outline">前往配置中心</Button>
                </Link>
              </>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
