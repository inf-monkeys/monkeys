import React, { useEffect } from 'react';

import { Link } from '@tanstack/react-router';

import { useClipboard } from '@mantine/hooks';
import { Blocks, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { cn } from '@/utils';

// @ts-ignore
import ChatCompletionsTemplateZH from './templates/chat-completions.mdx';
// @ts-ignore
import CompletionsTemplateZH from './templates/completions.mdx';

interface IIntegrationCenterProps extends React.ComponentPropsWithoutRef<'div'> {}

export const IntegrationCenter: React.FC<IIntegrationCenterProps> = () => {
  const { t } = useTranslation();

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
            displayName: t('workspace.wrapper.integration-center.content.new-chat-session'),
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
  const enabledOpenAIInterface = workflow?.exposeOpenaiCompatibleInterface ?? false;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="-mx-4 scale-90" icon={<Blocks />}>
          {t('workspace.wrapper.integration-center.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn('max-h max-w-xl', enabledOpenAIInterface && 'max-w-7xl')}>
        <DialogTitle>{t('workspace.wrapper.integration-center.title')}</DialogTitle>
        <DialogDescription>{t('workspace.wrapper.integration-center.desc')}</DialogDescription>
        {enabledOpenAIInterface ? (
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="prose max-w-full px-3 dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
              {workflow?.variables?.find((variable) => variable.name === 'messages') ? (
                <ChatCompletionsTemplateZH
                  apiBaseUrl={apiBaseUrl}
                  apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                  workflowId={workflowId}
                />
              ) : (
                <CompletionsTemplateZH
                  apiBaseUrl={apiBaseUrl}
                  apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                  workflowId={workflowId}
                />
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="vines-center h-80 w-full flex-col gap-4">
            {finalApikey ? (
              <ScrollArea>
                <div className="mb-4 flex w-full flex-col gap-2 rounded-md border border-input p-4">
                  <header className="flex items-start justify-between">
                    <div>
                      <h1 className="font-semibold">
                        {t('workspace.wrapper.integration-center.content.execution-workflow')}
                      </h1>
                      <span className="text-xs">
                        {t('workspace.wrapper.integration-center.content.execution-workflow-desc')}
                      </span>
                    </div>
                    <Button
                      className="scale-80"
                      variant="outline"
                      size="small"
                      icon={<Copy />}
                      onClick={() => {
                        clipboard.copy(executionWorkflowCurl);
                        toast.success(t('common.utils.copy-success'));
                      }}
                    />
                  </header>
                  <div className="max-h-80 max-w-[30.8rem] overflow-auto rounded-md bg-muted p-2">
                    <VinesHighlighter language="bash">{executionWorkflowCurl || ''}</VinesHighlighter>
                  </div>
                </div>
                <div className="mb-4 flex w-full flex-col gap-2 rounded-md border border-input p-4">
                  <header className="flex items-start justify-between">
                    <div>
                      <h1 className="font-semibold">
                        {t('workspace.wrapper.integration-center.content.execution-workflow-from-session')}
                      </h1>
                      <span className="text-xs">
                        {t('workspace.wrapper.integration-center.content.execution-workflow-from-session-desc')}
                      </span>
                    </div>
                    <Button
                      className="scale-80"
                      variant="outline"
                      size="small"
                      icon={<Copy />}
                      onClick={() => {
                        clipboard.copy(executionWorkflowWithChatSessionCurl);
                        toast.success(t('common.utils.copy-success'));
                      }}
                    />
                  </header>
                  <div className="max-h-80 max-w-[30.8rem] overflow-auto rounded-md bg-muted p-2">
                    <VinesHighlighter language="bash">{executionWorkflowWithChatSessionCurl || ''}</VinesHighlighter>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 rounded-md border border-input p-4">
                  <header className="flex items-start justify-between">
                    <div>
                      <h1 className="font-semibold">
                        {t('workspace.wrapper.integration-center.content.create-session')}
                      </h1>
                      <span className="text-xs">
                        {t('workspace.wrapper.integration-center.content.create-session-desc')}
                      </span>
                    </div>
                    <Button
                      className="scale-80"
                      variant="outline"
                      size="small"
                      icon={<Copy />}
                      onClick={() => {
                        clipboard.copy(createChatSessionCurl);
                        toast.success(t('common.utils.copy-success'));
                      }}
                    />
                  </header>
                  <div className="max-h-80 max-w-[30.8rem] overflow-auto rounded-md bg-muted p-2">
                    <VinesHighlighter language="bash">{createChatSessionCurl || ''}</VinesHighlighter>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <>
                <h1 className="font-bold">{t('workspace.wrapper.integration-center.empty-apikey')}</h1>
                <Link to="/$teamId/settings" params={{ teamId }}>
                  <Button variant="outline">{t('workspace.wrapper.integration-center.goto-config')}</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
