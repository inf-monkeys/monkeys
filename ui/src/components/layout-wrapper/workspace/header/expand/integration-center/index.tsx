import React, { useEffect } from 'react';

import { useClipboard } from '@mantine/hooks';
import { Blocks } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { IApiKeyStatus } from '@/apis/api-keys/typings.ts';
import { curl } from '@/components/layout-wrapper/workspace/header/expand/integration-center/utils.ts';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';

// @ts-ignore
import ChatCompletionsTemplateZH from './templates/chat-completions.mdx';
// @ts-ignore
import CompletionsTemplateZH from './templates/completions.mdx';
// @ts-ignore
import ExecuteWorkflowTemplateZH from './templates/execute-workflow.mdx';

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

  const [executeWorkflowSyncCurl, setExecuteWorkflowSyncCurl] = React.useState<string | null>(null);
  const [executeWorkflowCurl, setExecuteWorkflowCurl] = React.useState<string | null>(null);
  const [getExecutionStatusCurl, setGetExecutionStatusCurl] = React.useState<string | null>(null);

  useEffect(() => {
    const data: { [x: string]: any } = {
      inputData: {},
    };
    if (workflowInputs?.length) {
      for (const variable of workflowInputs) {
        const { name, default: defaultValue } = variable;
        data.inputData[name] = defaultValue || '';
      }
    }
    if (workflowId && urlPrefix) {
      const apikey = finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY';
      setExecuteWorkflowSyncCurl(
        curl({
          method: 'POST',
          url: `${urlPrefix}/api/workflow/executions/${workflowId}/start-sync`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apikey}`,
          },
          body: data,
        }),
      );
      setExecuteWorkflowCurl(
        curl({
          method: 'POST',
          url: `${urlPrefix}/api/workflow/executions/${workflowId}/start`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apikey}`,
          },
          body: data,
        }),
      );
      setGetExecutionStatusCurl(
        curl({
          method: 'GET',
          url: `${urlPrefix}/api/workflow/executions/{workflowInstanceId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apikey}`,
          },
        }),
      );
    }
  }, [workflowInputs, workflowId, finalApikey, urlPrefix]);

  const chatApiBaseUrl = window.location.protocol + '//' + window.location.host + '/v1';
  const apiBaseUrl = window.location.protocol + '//' + window.location.host + '/api';
  const enabledOpenAIInterface = workflow?.exposeOpenaiCompatibleInterface ?? false;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="-mx-4 scale-90" icon={<Blocks />}>
          {t('workspace.wrapper.integration-center.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn('max-h max-w-xl', 'max-w-7xl')}>
        <DialogTitle>{t('workspace.wrapper.integration-center.title')}</DialogTitle>
        <DialogDescription>{t('workspace.wrapper.integration-center.desc')}</DialogDescription>
        <ScrollArea className="h-[calc(100vh-20rem)]">
          <div className="prose max-w-full px-3 dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
            {enabledOpenAIInterface ? (
              <>
                {workflow?.variables?.find((variable) => variable.name === 'messages') ? (
                  <ChatCompletionsTemplateZH
                    apiBaseUrl={chatApiBaseUrl}
                    apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                    workflowId={workflowId}
                  />
                ) : (
                  <CompletionsTemplateZH
                    apiBaseUrl={chatApiBaseUrl}
                    apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                    workflowId={workflowId}
                  />
                )}
              </>
            ) : (
              <>
                <ExecuteWorkflowTemplateZH
                  apiBaseUrl={apiBaseUrl}
                  apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                  workflowId={workflowId}
                  workflowInputs={workflowInputs}
                  curlSync={executeWorkflowSyncCurl}
                  curl={executeWorkflowCurl}
                  curlExecutionStatus={getExecutionStatusCurl}
                />
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
