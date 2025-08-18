import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateComfyuiWorkflow } from '@/apis/comfyui';
import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
import { downloadJson, getI18nContent } from '@/utils';

interface IComfyuiWofrkflowProps {
  data: IComfyuiWorkflow;
}

export const ComfyuiWorkflowDetail: React.FC<IComfyuiWofrkflowProps> = ({ data }) => {
  const { t } = useTranslation();
  const { workflow, prompt } = data;
  const [updatedWorkflowJson, setUpdatedWorkflowJson] = useState(JSON.stringify(workflow || {}, null, 4));
  const [updatedWorkflowApiJson, setUpdatedWorkflowApiJson] = useState(JSON.stringify(prompt || {}, null, 4));

  const onUpdateToolWorkflowJson = async () => {
    let parsedWorkflow;
    try {
      parsedWorkflow = JSON.parse(updatedWorkflowJson);
    } catch {
      toast.error(t('ugc-page.comfyui-workflow.detail.tabs.toolsOutput.toast.not-json'));
      return;
    }
    let parsedPrompt;
    try {
      parsedPrompt = JSON.parse(updatedWorkflowApiJson);
    } catch {
      toast.error(t('ugc-page.comfyui-workflow.detail.tabs.toolsOutput.toast.not-json'));
      return;
    }
    await updateComfyuiWorkflow(data.id, {
      workflow: parsedWorkflow,
      workflowApi: parsedPrompt,
    });
    toast.success(t('ugc-page.comfyui-workflow.detail.tabs.toolsOutput.toast.save-success'));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('ugc-page.comfyui-workflow.detail.tabs.workflow.json')}</h1>
        <Button
          variant="outline"
          onClick={() => {
            const displayName = getI18nContent(data.displayName);
            const fileName = `${displayName} (${data.id}).json`;
            downloadJson(workflow, fileName);
          }}
        >
          {t('common.utils.download.label')}
        </Button>
      </div>
      <br></br>
      <CodeEditor
        data={JSON.stringify(workflow, null, 4)}
        height={400}
        lineNumbers={2}
        onUpdate={setUpdatedWorkflowJson}
      />
      <br></br>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('ugc-page.comfyui-workflow.detail.tabs.workflow.api-json')}</h1>
        <Button
          variant="outline"
          onClick={() => {
            const displayName = getI18nContent(data.displayName);
            const fileName = `${displayName} (${data.id})-api.json`;
            downloadJson(prompt, fileName);
          }}
        >
          {t('common.utils.download.label')}
        </Button>
      </div>
      <br></br>
      <CodeEditor
        data={JSON.stringify(prompt, null, 4)}
        height={400}
        lineNumbers={2}
        onUpdate={setUpdatedWorkflowApiJson}
      />
      <br></br>
      <Button type="submit" onClick={onUpdateToolWorkflowJson}>
        {t('common.utils.save')}
      </Button>
    </div>
  );
};
