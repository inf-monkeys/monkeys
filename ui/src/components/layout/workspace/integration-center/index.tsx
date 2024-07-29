import React, { useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { IApiKeyStatus } from '@/apis/api-keys/typings.ts';
import { curl } from '@/components/layout/workspace/integration-center/utils.ts';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { usePageStore } from '@/store/usePageStore';

// @ts-ignore
import ChatCompletionsTemplateZH from './templates/chat-completions.mdx';
// @ts-ignore
import CompletionsTemplateZH from './templates/completions.mdx';
// @ts-ignore
import ExecuteWorkflowTemplateZH from './templates/execute-workflow.mdx';

interface IIntegrationCenterProps extends React.ComponentPropsWithoutRef<'div'> {}

export const IntegrationCenter: React.FC<IIntegrationCenterProps> = () => {
  const { t } = useTranslation();

  const containerHeight = usePageStore((s) => s.containerHeight);

  const { data: apiKeys } = useApiKeyList();

  const finalApikey = apiKeys?.find((key) => key.status === IApiKeyStatus.Valid);
  const urlPrefix = window.location.protocol + '//' + window.location.host;

  const { workflow } = useVinesPage();

  const workflowId = workflow?.workflowId;
  const workflowInputs = workflow?.variables;
  const openaiModelName = workflow?.openaiModelName;
  const model = openaiModelName || workflowId;

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold leading-none tracking-tight">
          {t('workspace.wrapper.integration-center.title')}
        </h1>
        <span className="text-sm text-muted-foreground">{t('workspace.wrapper.integration-center.desc')}</span>
      </div>
      <ScrollArea style={{ height: containerHeight - 107 }}>
        <div className="prose max-w-full px-3 dark:prose-invert prose-p:leading-relaxed prose-pre:p-0">
          {enabledOpenAIInterface ? (
            <>
              {workflow?.variables?.find((variable) => variable.name === 'messages') ? (
                <ChatCompletionsTemplateZH
                  apiBaseUrl={chatApiBaseUrl}
                  apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                  model={model}
                />
              ) : (
                <CompletionsTemplateZH
                  apiBaseUrl={chatApiBaseUrl}
                  apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                  model={model}
                />
              )}
            </>
          ) : (
            <>
              <ExecuteWorkflowTemplateZH
                apiBaseUrl={apiBaseUrl}
                apiKey={finalApikey ? finalApikey.apiKey : '$MONKEYS_API_KEY'}
                model={model}
                workflowInputs={workflowInputs}
                curlSync={executeWorkflowSyncCurl}
                curl={executeWorkflowCurl}
                curlExecutionStatus={getExecutionStatusCurl}
                workflowId={workflowId}
              />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
